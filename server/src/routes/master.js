import { Router } from 'express'
import { formatTime } from '../lib/helpers.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

function shapeSchedule(schedule) {
  return {
    ...schedule,
    start_time: formatTime(schedule.start_time),
    end_time: formatTime(schedule.end_time),
  }
}

router.get('/poli', requireAuth, async (_req, res) => {
  const data = await prisma.polyclinics.findMany({
    orderBy: { name: 'asc' },
  })

  res.json({ data })
})

router.get('/dokter', requireAuth, async (req, res) => {
  const { polyclinic_id, q } = req.query
  const where = {}

  if (polyclinic_id) {
    where.doctor_schedules = { some: { polyclinic_id: Number(polyclinic_id) } }
  }

  if (q) {
    where.OR = [
      { name: { contains: String(q), mode: 'insensitive' } },
      { specialization: { contains: String(q), mode: 'insensitive' } },
    ]
  }

  const doctors = await prisma.doctors.findMany({
    where,
    include: {
      doctor_schedules: {
        include: { polyclinics: true },
        orderBy: { schedule_id: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  res.json({
    data: doctors.map((doctor) => ({
      ...doctor,
      doctor_schedules: doctor.doctor_schedules.map(shapeSchedule),
    })),
  })
})

router.get('/jadwal', requireAuth, async (req, res) => {
  const { doctor_id, polyclinic_id, day } = req.query
  const where = {}

  if (doctor_id) where.doctor_id = Number(doctor_id)
  if (polyclinic_id) where.polyclinic_id = Number(polyclinic_id)
  if (day) where.day = String(day)

  const data = await prisma.doctor_schedules.findMany({
    where,
    include: { doctors: true, polyclinics: true },
    orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
  })

  res.json({ data: data.map(shapeSchedule) })
})

router.get('/obat', requireAuth, requireRole('petugas', 'dokter'), async (_req, res) => {
  const data = await prisma.medicines.findMany({
    orderBy: { name: 'asc' },
  })

  res.json({ data })
})

export default router
