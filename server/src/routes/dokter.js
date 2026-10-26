import { Router } from 'express'
import { attachQueueNumbers, dayRange, formatTime } from '../lib/helpers.js'
import { prisma } from '../lib/prisma.js'
import { medicalRecordSchema } from '../lib/schemas.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('dokter'))

async function getDoctor(req, res) {
  const doctor = await prisma.doctors.findUnique({
    where: { user_id: req.user.sub },
  })

  if (!doctor) {
    res.status(404).json({
      message: 'Akun ini belum terhubung ke data dokter. Hubungi admin.',
    })
    return null
  }

  return doctor
}

router.get('/me', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const schedules = await prisma.doctor_schedules.findMany({
    where: { doctor_id: doctor.doctor_id },
    include: { polyclinics: true },
    orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
  })

  res.json({
    data: {
      ...doctor,
      doctor_schedules: schedules.map((schedule) => ({
        ...schedule,
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
      })),
    },
  })
})

router.get('/jadwal', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const data = await prisma.doctor_schedules.findMany({
    where: { doctor_id: doctor.doctor_id },
    include: { polyclinics: true },
    orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
  })

  res.json({
    data: data.map((schedule) => ({
      ...schedule,
      start_time: formatTime(schedule.start_time),
      end_time: formatTime(schedule.end_time),
    })),
  })
})

router.get('/antrean', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const range = dayRange(req.query.date)
  if (!range) {
    return res.status(400).json({ message: 'Format tanggal tidak valid' })
  }

  const [todayRegistrations, mine] = await Promise.all([
    prisma.registrations.findMany({
      where: { registration_date: { gte: range.start, lt: range.end } },
      select: {
        registration_id: true,
        polyclinic_id: true,
        registration_date: true,
      },
    }),
    prisma.registrations.findMany({
      where: {
        doctor_id: doctor.doctor_id,
        registration_date: { gte: range.start, lt: range.end },
        status: { not: 'batal' },
      },
      include: { patients: true, polyclinics: true },
      orderBy: { registration_date: 'asc' },
    }),
  ])

  const numbers = new Map(
    attachQueueNumbers(todayRegistrations).map((row) => [
      row.registration_id,
      row.queue_no,
    ]),
  )

  res.json({
    data: mine.map((row) => ({
      ...row,
      queue_no: numbers.get(row.registration_id) ?? null,
    })),
  })
})

router.post('/pemeriksaan', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const body = medicalRecordSchema.parse(req.body)

  const registration = await prisma.registrations.findUnique({
    where: { registration_id: body.registration_id },
  })

  if (!registration) {
    return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' })
  }
  if (registration.doctor_id !== doctor.doctor_id) {
    return res.status(403).json({ message: 'Pendaftaran ini bukan milik Anda' })
  }

  const record = await prisma.$transaction(async (tx) => {
    const saved = await tx.medical_records.upsert({
      where: { registration_id: body.registration_id },
      create: {
        registration_id: body.registration_id,
        diagnosis: body.diagnosis,
        symptoms: body.symptoms,
        treatment: body.treatment,
        notes: body.notes,
      },
      update: {
        diagnosis: body.diagnosis,
        symptoms: body.symptoms,
        treatment: body.treatment,
        notes: body.notes,
      },
    })

    await tx.prescriptions.deleteMany({
      where: { medical_record_id: saved.medical_record_id },
    })

    if (body.prescriptions.length > 0) {
      await tx.prescriptions.createMany({
        data: body.prescriptions.map((item) => ({
          medical_record_id: saved.medical_record_id,
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          dosage: item.dosage,
          instructions: item.instructions,
        })),
      })
    }

    await tx.registrations.update({
      where: { registration_id: body.registration_id },
      data: { status: 'selesai' },
    })

    return tx.medical_records.findUnique({
      where: { medical_record_id: saved.medical_record_id },
      include: {
        prescriptions: { include: { medicines: true } },
        registrations: {
          include: { patients: true, polyclinics: true, doctors: true },
        },
      },
    })
  })

  res.status(201).json({ data: record })
})

router.get('/pasien/:patientId/rekam-medis', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const patientId = Number(req.params.patientId)

  const patient = await prisma.patients.findUnique({
    where: { patient_id: patientId },
  })

  if (!patient) {
    return res.status(404).json({ message: 'Pasien tidak ditemukan' })
  }

  const data = await prisma.registrations.findMany({
    where: { patient_id: patientId },
    include: {
      doctors: true,
      polyclinics: true,
      medical_records: {
        include: { prescriptions: { include: { medicines: true } } },
      },
    },
    orderBy: { registration_date: 'desc' },
  })

  res.json({ data: { patient, registrations: data } })
})

router.get('/pasien', async (req, res) => {
  const doctor = await getDoctor(req, res)
  if (!doctor) return

  const data = await prisma.patients.findMany({
    where: {
      registrations: { some: { doctor_id: doctor.doctor_id } },
    },
    orderBy: { name: 'asc' },
  })

  res.json({ data })
})

export default router
