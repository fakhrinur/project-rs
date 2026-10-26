import { Router } from 'express'
import { attachQueueNumbers, dayRange } from '../lib/helpers.js'
import { prisma } from '../lib/prisma.js'
import { registrationSchema } from '../lib/schemas.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('pasien'))

async function getPatient(req, res) {
  const patient = await prisma.patients.findUnique({
    where: { user_id: req.user.sub },
  })

  if (!patient) {
    res.status(404).json({
      message: 'Akun ini belum terhubung ke data pasien. Hubungi petugas pendaftaran.',
    })
    return null
  }

  return patient
}

router.get('/me', async (req, res) => {
  const patient = await getPatient(req, res)
  if (!patient) return

  res.json({ data: patient })
})

router.get('/antrean', async (req, res) => {
  const patient = await getPatient(req, res)
  if (!patient) return

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
        patient_id: patient.patient_id,
        registration_date: { gte: range.start, lt: range.end },
        status: { not: 'batal' },
      },
      include: { doctors: true, polyclinics: true },
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

router.get('/riwayat', async (req, res) => {
  const patient = await getPatient(req, res)
  if (!patient) return

  const data = await prisma.registrations.findMany({
    where: { patient_id: patient.patient_id },
    include: {
      doctors: true,
      polyclinics: true,
      medical_records: {
        include: {
          prescriptions: { include: { medicines: true } },
        },
      },
      payments: true,
    },
    orderBy: { registration_date: 'desc' },
  })

  res.json({ data })
})

router.get('/tagihan', async (req, res) => {
  const patient = await getPatient(req, res)
  if (!patient) return

  const data = await prisma.payments.findMany({
    where: { registrations: { patient_id: patient.patient_id } },
    include: {
      registrations: {
        include: { doctors: true, polyclinics: true },
      },
    },
    orderBy: { payment_id: 'desc' },
  })

  res.json({ data })
})

router.post('/pendaftaran', async (req, res) => {
  const patient = await getPatient(req, res)
  if (!patient) return

  const { doctor_id, polyclinic_id, complaint } = registrationSchema.parse(req.body)

  const [doctor, polyclinic, schedule] = await Promise.all([
    prisma.doctors.findUnique({ where: { doctor_id } }),
    prisma.polyclinics.findUnique({ where: { polyclinic_id } }),
    prisma.doctor_schedules.findFirst({
      where: { doctor_id, polyclinic_id },
    }),
  ])

  if (!doctor) {
    return res.status(404).json({ message: 'Dokter tidak ditemukan' })
  }
  if (!polyclinic) {
    return res.status(404).json({ message: 'Poli tidak ditemukan' })
  }
  if (!schedule) {
    return res.status(400).json({ message: 'Dokter tersebut tidak praktik di poli ini' })
  }

  const registration = await prisma.registrations.create({
    data: {
      patient_id: patient.patient_id,
      doctor_id,
      polyclinic_id,
      complaint,
      status: 'menunggu',
    },
    include: { doctors: true, polyclinics: true },
  })

  res.status(201).json({ data: registration })
})

export default router
