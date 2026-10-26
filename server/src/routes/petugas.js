import { Router } from 'express'
import { hashPassword } from '../lib/auth.js'
import {
  attachQueueNumbers,
  dayRange,
  formatTime,
  timeOnly,
} from '../lib/helpers.js'
import { prisma } from '../lib/prisma.js'
import {
  patientSchema,
  registrationSchema,
  scheduleSchema,
  statusSchema,
} from '../lib/schemas.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('petugas'))

router.get('/pasien', async (req, res) => {
  const q = req.query.q ? String(req.query.q) : null

  const data = await prisma.patients.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { nik: { contains: q } },
          ],
        }
      : undefined,
    include: { users: { select: { username: true, role: true } } },
    orderBy: { patient_id: 'desc' },
    take: 100,
  })

  res.json({ data })
})

router.post('/pasien', async (req, res) => {
  const body = patientSchema.parse(req.body)

  const existing = await prisma.patients.findUnique({ where: { nik: body.nik } })
  if (existing) {
    return res.status(409).json({ message: 'Pasien dengan NIK tersebut sudah terdaftar' })
  }

  const birthDate = body.birth_date ? new Date(body.birth_date) : null
  if (birthDate && Number.isNaN(birthDate.getTime())) {
    return res.status(400).json({ message: 'Tanggal lahir tidak valid' })
  }

  const patient = await prisma.$transaction(async (tx) => {
    let userId = null

    const usernameTaken = await tx.users.findUnique({ where: { username: body.nik } })
    if (!usernameTaken) {
      const user = await tx.users.create({
        data: {
          username: body.nik,
          password: await hashPassword('pasien123'),
          role: 'pasien',
        },
      })
      userId = user.user_id
    }

    return tx.patients.create({
      data: {
        user_id: userId,
        nik: body.nik,
        name: body.name,
        gender: body.gender,
        birth_date: birthDate,
        address: body.address,
        phone: body.phone,
        blood_type: body.blood_type,
      },
    })
  })

  res.status(201).json({
    data: patient,
    message: 'Pasien berhasil ditambahkan. Akun login memakai NIK dengan sandi awal: pasien123',
  })
})

router.get('/pendaftaran', async (req, res) => {
  const range = dayRange(req.query.date)
  if (!range) {
    return res.status(400).json({ message: 'Format tanggal tidak valid' })
  }

  const status = req.query.status ? String(req.query.status) : null

  const dayRegistrations = await prisma.registrations.findMany({
    where: { registration_date: { gte: range.start, lt: range.end } },
    include: {
      patients: true,
      doctors: true,
      polyclinics: true,
      payments: true,
    },
    orderBy: { registration_date: 'asc' },
  })

  const numbered = attachQueueNumbers(dayRegistrations)
  const data = status ? numbered.filter((row) => row.status === status) : numbered

  res.json({ data })
})

router.post('/pendaftaran', async (req, res) => {
  const body = registrationSchema.parse(req.body)

  if (!body.patient_id) {
    return res.status(400).json({ message: 'Pasien wajib dipilih' })
  }

  const [patient, doctor, polyclinic] = await Promise.all([
    prisma.patients.findUnique({ where: { patient_id: body.patient_id } }),
    prisma.doctors.findUnique({ where: { doctor_id: body.doctor_id } }),
    prisma.polyclinics.findUnique({ where: { polyclinic_id: body.polyclinic_id } }),
  ])

  if (!patient) return res.status(404).json({ message: 'Pasien tidak ditemukan' })
  if (!doctor) return res.status(404).json({ message: 'Dokter tidak ditemukan' })
  if (!polyclinic) return res.status(404).json({ message: 'Poli tidak ditemukan' })

  const registration = await prisma.registrations.create({
    data: {
      patient_id: body.patient_id,
      doctor_id: body.doctor_id,
      polyclinic_id: body.polyclinic_id,
      complaint: body.complaint,
      status: 'menunggu',
    },
    include: { patients: true, doctors: true, polyclinics: true },
  })

  res.status(201).json({ data: registration })
})

router.patch('/pendaftaran/:id/status', async (req, res) => {
  const { status } = statusSchema.parse(req.body)
  const registrationId = Number(req.params.id)

  const existing = await prisma.registrations.findUnique({
    where: { registration_id: registrationId },
  })

  if (!existing) {
    return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' })
  }

  const data = await prisma.registrations.update({
    where: { registration_id: registrationId },
    data: { status },
    include: { patients: true, doctors: true, polyclinics: true },
  })

  res.json({ data })
})

router.get('/antrean', async (req, res) => {
  const range = dayRange(req.query.date)
  if (!range) {
    return res.status(400).json({ message: 'Format tanggal tidak valid' })
  }

  const rows = await prisma.registrations.findMany({
    where: {
      registration_date: { gte: range.start, lt: range.end },
      status: { not: 'batal' },
    },
    include: { patients: true, doctors: true, polyclinics: true },
    orderBy: { registration_date: 'asc' },
  })

  const data = attachQueueNumbers(rows)

  const perPolyclinic = new Map()
  for (const row of data) {
    const key = row.polyclinics?.name ?? 'Lainnya'
    if (!perPolyclinic.has(key)) {
      perPolyclinic.set(key, { polyclinic: key, total: 0, menunggu: 0, selesai: 0 })
    }
    const item = perPolyclinic.get(key)
    item.total += 1
    if (row.status === 'selesai') item.selesai += 1
    if (row.status === 'menunggu') item.menunggu += 1
  }

  res.json({
    data,
    summary: {
      total: data.length,
      menunggu: data.filter((row) => row.status === 'menunggu').length,
      selesai: data.filter((row) => row.status === 'selesai').length,
      poli: [...perPolyclinic.values()],
    },
  })
})

router.get('/summary', async (_req, res) => {
  const range = dayRange()

  const [totalPasien, totalDokter, todayRegistrations] = await Promise.all([
    prisma.patients.count(),
    prisma.doctors.count(),
    prisma.registrations.findMany({
      where: { registration_date: { gte: range.start, lt: range.end } },
      select: { status: true },
    }),
  ])

  res.json({
    data: {
      total_pasien: totalPasien,
      total_dokter: totalDokter,
      pendaftaran_hari_ini: todayRegistrations.length,
      menunggu: todayRegistrations.filter((row) => row.status === 'menunggu').length,
      selesai: todayRegistrations.filter((row) => row.status === 'selesai').length,
    },
  })
})

router.post('/jadwal', async (req, res) => {
  const body = scheduleSchema.parse(req.body)

  const start = timeOnly(body.start_time)
  const end = timeOnly(body.end_time)

  if (!start || !end) {
    return res.status(400).json({ message: 'Format jam tidak valid' })
  }
  if (start >= end) {
    return res.status(400).json({ message: 'Jam selesai harus setelah jam mulai' })
  }

  const data = await prisma.doctor_schedules.create({
    data: {
      doctor_id: body.doctor_id,
      polyclinic_id: body.polyclinic_id,
      day: body.day,
      start_time: start,
      end_time: end,
    },
    include: { doctors: true, polyclinics: true },
  })

  res.status(201).json({
    data: {
      ...data,
      start_time: formatTime(data.start_time),
      end_time: formatTime(data.end_time),
    },
  })
})

router.delete('/jadwal/:id', async (req, res) => {
  const scheduleId = Number(req.params.id)

  const existing = await prisma.doctor_schedules.findUnique({
    where: { schedule_id: scheduleId },
  })

  if (!existing) {
    return res.status(404).json({ message: 'Jadwal tidak ditemukan' })
  }

  await prisma.doctor_schedules.delete({ where: { schedule_id: scheduleId } })

  res.json({ message: 'Jadwal dihapus' })
})

export default router
