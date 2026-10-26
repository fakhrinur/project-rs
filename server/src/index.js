import 'dotenv/config'
import { Prisma } from '@prisma/client'
import cors from 'cors'
import express from 'express'
import { ZodError } from 'zod'
import authRoutes from './routes/auth.js'
import dokterRoutes from './routes/dokter.js'
import masterRoutes from './routes/master.js'
import pasienRoutes from './routes/pasien.js'
import petugasRoutes from './routes/petugas.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins, credentials: true }))
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

app.use('/api/auth', authRoutes)
app.use('/api', masterRoutes)
app.use('/api/dokter', dokterRoutes)
app.use('/api/pasien', pasienRoutes)
app.use('/api/petugas', petugasRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' })
})

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: error.issues[0]?.message ?? 'Data yang dikirim tidak valid',
      issues: error.issues,
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Data sudah ada (duplikat)' })
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Data tidak ditemukan' })
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Data terkait tidak valid' })
    }
  }

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
