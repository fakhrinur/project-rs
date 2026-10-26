import { z } from 'zod'

export const loginSchema = z.object({
  role: z.enum(['pasien', 'petugas', 'dokter']),
  identifier: z.string().trim().min(1, 'Identitas wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export const patientSchema = z.object({
  nik: z.string().trim().length(16, 'NIK harus 16 digit'),
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  gender: z.enum(['L', 'P']).optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  blood_type: z.string().optional(),
})

export const registrationSchema = z.object({
  patient_id: z.number().int().positive().optional(),
  doctor_id: z.number().int().positive('Dokter wajib dipilih'),
  polyclinic_id: z.number().int().positive('Poli wajib dipilih'),
  complaint: z.string().max(500).optional(),
})

export const statusSchema = z.object({
  status: z.enum(['menunggu', 'dipanggil', 'diperiksa', 'selesai', 'batal']),
})

export const scheduleSchema = z.object({
  doctor_id: z.number().int().positive(),
  polyclinic_id: z.number().int().positive(),
  day: z.string().trim().min(3).max(20),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam HH:MM'),
})

export const medicalRecordSchema = z.object({
  registration_id: z.number().int().positive(),
  diagnosis: z.string().trim().min(1, 'Diagnosis wajib diisi'),
  symptoms: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  prescriptions: z
    .array(
      z.object({
        medicine_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        dosage: z.string().optional(),
        instructions: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
})
