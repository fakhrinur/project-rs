import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

const time = (hhmm) => {
  const [hour, minute] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, hour, minute))
}

async function ensureUser(username, role, plainPassword) {
  const existing = await prisma.users.findUnique({ where: { username } })
  if (existing) return existing

  return prisma.users.create({
    data: {
      username,
      role,
      password: await bcrypt.hash(plainPassword, 10),
    },
  })
}

async function ensureDoctor({ username, name, code, specialization }) {
  const user = await ensureUser(username, 'dokter', 'dummy_password')

  return prisma.doctors.upsert({
    where: { doctor_code: code },
    update: { user_id: user.user_id, name, specialization },
    create: {
      user_id: user.user_id,
      doctor_code: code,
      name,
      specialization,
      phone: '081200000001',
    },
  })
}

async function ensureSchedule(doctorId, polyclinicId, day, start, end) {
  const existing = await prisma.doctor_schedules.findFirst({
    where: {
      doctor_id: doctorId,
      polyclinic_id: polyclinicId,
      day,
      start_time: time(start),
    },
  })

  if (existing) return existing

  return prisma.doctor_schedules.create({
    data: {
      doctor_id: doctorId,
      polyclinic_id: polyclinicId,
      day,
      start_time: time(start),
      end_time: time(end),
    },
  })
}

async function main() {
  const pasienUser = await ensureUser('pasien1', 'pasien', 'dummy_password')

  const patient = await prisma.patients.upsert({
    where: { nik: '3201234567890001' },
    update: { user_id: pasienUser.user_id },
    create: {
      user_id: pasienUser.user_id,
      nik: '3201234567890001',
      name: 'Budi Santoso',
      gender: 'L',
      birth_date: new Date('1995-04-12'),
      address: 'Jl. Merdeka No. 10, Bandung',
      phone: '081234567890',
      blood_type: 'O',
    },
  })

  const doctorUmum = await ensureDoctor({
    username: 'dokter1',
    name: 'dr. Andi Prasetyo',
    code: '4021012345678',
    specialization: 'Dokter Umum',
  })

  const doctorAnak = await ensureDoctor({
    username: 'dokter2',
    name: 'dr. Siti Aminah, Sp.A',
    code: '4021098765432',
    specialization: 'Spesialis Anak',
  })

  const doctorGigi = await ensureDoctor({
    username: 'dokter3',
    name: 'drg. Rina Kartika',
    code: '4021055556666',
    specialization: 'Dokter Gigi',
  })

  const poliUmum = await prisma.polyclinics.findFirst({ where: { name: 'Poli Umum' } })
  const poliAnak = await prisma.polyclinics.findFirst({ where: { name: 'Poli Anak' } })
  const poliGigi = await prisma.polyclinics.findFirst({ where: { name: 'Poli Gigi' } })

  if (poliUmum && poliAnak && poliGigi) {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

    for (const day of days) {
      await ensureSchedule(doctorUmum.doctor_id, poliUmum.polyclinic_id, day, '08:00', '12:00')
      await ensureSchedule(doctorUmum.doctor_id, poliUmum.polyclinic_id, day, '13:00', '16:00')
      await ensureSchedule(doctorAnak.doctor_id, poliAnak.polyclinic_id, day, '09:00', '13:00')
      await ensureSchedule(doctorGigi.doctor_id, poliGigi.polyclinic_id, day, '10:00', '14:00')
    }
  }

  let medicines = await prisma.medicines.findMany({ orderBy: { medicine_id: 'asc' } })

  if (medicines.length === 0) {
    await prisma.medicines.createMany({
      data: [
        {
          medicine_code: 'OBT-001',
          name: 'Paracetamol 500mg',
          category: 'Analgesik',
          stock: 120,
          unit: 'tablet',
          price: 500,
        },
        {
          medicine_code: 'OBT-002',
          name: 'Amoxicillin 500mg',
          category: 'Antibiotik',
          stock: 80,
          unit: 'kapsul',
          price: 1200,
        },
        {
          medicine_code: 'OBT-003',
          name: 'OBH Combi',
          category: 'Batuk',
          stock: 50,
          unit: 'botol',
          price: 18000,
        },
      ],
    })
    medicines = await prisma.medicines.findMany({ orderBy: { medicine_id: 'asc' } })
  }

  const existingRegistrations = await prisma.registrations.count({
    where: { patient_id: patient.patient_id },
  })

  if (existingRegistrations === 0 && poliUmum) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12, 9, 0)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 20, 10, 0)

    await prisma.registrations.create({
      data: {
        patient_id: patient.patient_id,
        doctor_id: doctorUmum.doctor_id,
        polyclinic_id: poliUmum.polyclinic_id,
        registration_date: today,
        complaint: 'Demam dan batuk sejak 2 hari yang lalu',
        status: 'menunggu',
      },
    })

    const finished = await prisma.registrations.create({
      data: {
        patient_id: patient.patient_id,
        doctor_id: doctorUmum.doctor_id,
        polyclinic_id: poliUmum.polyclinic_id,
        registration_date: lastMonth,
        complaint: 'Sakit kepala dan mual',
        status: 'selesai',
      },
    })

    await prisma.registrations.create({
      data: {
        patient_id: patient.patient_id,
        doctor_id: doctorUmum.doctor_id,
        polyclinic_id: poliUmum.polyclinic_id,
        registration_date: twoMonthsAgo,
        complaint: 'Nyeri tenggorokan',
        status: 'selesai',
      },
    })

    const record = await prisma.medical_records.create({
      data: {
        registration_id: finished.registration_id,
        diagnosis: 'ISPA ringan',
        symptoms: 'Demam, batuk berdahak, nyeri tenggorokan',
        treatment: 'Istirahat 3 hari dan banyak minum air putih',
        notes: 'Kontrol kembali jika demam tidak turun dalam 3 hari',
      },
    })

    if (medicines[0]) {
      await prisma.prescriptions.createMany({
        data: [
          {
            medical_record_id: record.medical_record_id,
            medicine_id: medicines[0].medicine_id,
            quantity: 10,
            dosage: '3x1',
            instructions: 'Sesudah makan',
          },
          ...(medicines[1]
            ? [
                {
                  medical_record_id: record.medical_record_id,
                  medicine_id: medicines[1].medicine_id,
                  quantity: 6,
                  dosage: '2x1',
                  instructions: 'Habiskan antibiotik',
                },
              ]
            : []),
        ],
      })
    }

    await prisma.payments.create({
      data: {
        registration_id: finished.registration_id,
        amount: 150000,
        payment_method: 'Tunai',
        payment_status: 'lunas',
        paid_at: lastMonth,
      },
    })
  }

  const counts = {
    users: await prisma.users.count(),
    patients: await prisma.patients.count(),
    doctors: await prisma.doctors.count(),
    polyclinics: await prisma.polyclinics.count(),
    schedules: await prisma.doctor_schedules.count(),
    registrations: await prisma.registrations.count(),
    medicines: await prisma.medicines.count(),
  }

  console.log('Seed selesai:', counts)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
