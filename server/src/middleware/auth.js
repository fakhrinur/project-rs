import jwt from 'jsonwebtoken'

/**
 * Memastikan request membawa token JWT yang valid.
 * Hasil decode disimpan di `req.user` => { sub, role, nama }
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' })
  }
}

/**
 * Membatasi akses berdasarkan peran.
 * Contoh: router.get('/', requireAuth, requireRole('petugas'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Belum terautentikasi' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak untuk peran ini' })
    }
    return next()
  }
}
