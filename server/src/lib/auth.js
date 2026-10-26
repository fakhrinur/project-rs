import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'

export async function verifyPassword(plain, stored) {
  if (!stored) return false

  // Mendukung password yang sudah di-hash bcrypt maupun yang masih plaintext
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(plain, stored)
  }

  return plain === stored
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.user_id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
  )
}

/**
 * Mengambil profil lengkap (pasien/dokter) milik user.
 */
export async function loadProfile(userId) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { user_id: true, username: true, role: true, created_at: true },
  })

  if (!user) return null

  if (user.role === 'pasien') {
    const patient = await prisma.patients.findUnique({ where: { user_id: userId } })
    return {
      ...user,
      nama: patient?.name ?? user.username,
      patientId: patient?.patient_id ?? null,
      patient,
    }
  }

  if (user.role === 'dokter') {
    const doctor = await prisma.doctors.findUnique({ where: { user_id: userId } })
    return {
      ...user,
      nama: doctor?.name ?? user.username,
      doctorId: doctor?.doctor_id ?? null,
      doctor,
    }
  }

  return { ...user, nama: user.username }
}
