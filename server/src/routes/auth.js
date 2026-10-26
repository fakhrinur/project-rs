import { Router } from 'express'
import { loadProfile, signToken, verifyPassword } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { loginSchema } from '../lib/schemas.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

async function findUserByIdentifier(identifier, role) {
  const byUsername = await prisma.users.findFirst({
    where: { username: identifier, role },
  })

  if (byUsername) return byUsername

  // Pasien boleh login memakai NIK
  if (role === 'pasien') {
    const patient = await prisma.patients.findFirst({
      where: { nik: identifier },
      include: { users: true },
    })
    if (patient?.users) return patient.users
  }

  // Dokter boleh login memakai kode dokter / No. STR
  if (role === 'dokter') {
    const doctor = await prisma.doctors.findFirst({
      where: { doctor_code: identifier },
      include: { users: true },
    })
    if (doctor?.users) return doctor.users
  }

  return null
}

router.post('/login', async (req, res) => {
  const { role, identifier, password } = loginSchema.parse(req.body)

  const user = await findUserByIdentifier(identifier, role)
  const valid = user ? await verifyPassword(password, user.password) : false

  if (!user || !valid) {
    return res.status(401).json({
      message: 'Identitas atau kata sandi salah. Periksa kembali data Anda.',
    })
  }

  const profile = await loadProfile(user.user_id)

  return res.json({
    token: signToken(user),
    user: profile,
  })
})

router.get('/me', requireAuth, async (req, res) => {
  const profile = await loadProfile(req.user.sub)

  if (!profile) {
    return res.status(404).json({ message: 'Akun tidak ditemukan' })
  }

  return res.json({ user: profile })
})

export default router
