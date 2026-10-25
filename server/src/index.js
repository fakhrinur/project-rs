import 'dotenv/config'
import cors from 'cors'
import express from 'express'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  let database = 'disconnected'

  try {
    const { prisma } = await import('./lib/prisma.js')
    await prisma.$queryRaw`SELECT 1`
    database = 'connected'
  } catch (error) {
    database = `disconnected: ${error.message}`
  }

  res.json({
    ok: true,
    service: 'rs-server',
    database,
    time: new Date().toISOString(),
  })
})

// Route API akan ditambahkan di sini setelah schema database terbaca:
// app.use('/api/auth', authRoutes)
// app.use('/api/dokter', dokterRoutes)
// app.use('/api/jadwal', jadwalRoutes)
// app.use('/api/pendaftaran', pendaftaranRoutes)
// app.use('/api/rekam-medis', rekamMedisRoutes)
// app.use('/api/antrean', antreanRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' })
})

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body JSON tidak valid' })
  }

  console.error(error)
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
})

const port = Number(process.env.PORT ?? 4000)

app.listen(port, () => {
  console.log(`[rs-server] berjalan di http://localhost:${port}`)
})
