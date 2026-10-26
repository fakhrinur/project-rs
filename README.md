# SI Rumah Sakit — Login & Dashboard

Aplikasi manajemen rumah sakit (RS Wijaya Husada) **full-stack** dengan 3 peran:
**Pasien**, **Petugas**, dan **Dokter**.

- **Frontend:** React 19 + Vite + React Router 7
- **Backend:** Express 5 + Prisma 6 + PostgreSQL
- **Auth:** JWT + proteksi route per peran

## Fitur

**Umum**

- Login memakai API (bukan simulasi) dan redirect otomatis sesuai peran
- Route dashboard diproteksi: pengguna tidak bisa membuka dashboard peran lain
- Sesi disimpan di `localStorage` dan diverifikasi ulang lewat `GET /api/auth/me`
- Tampilan responsif, sidebar bisa dibuka/tutup di layar kecil

**Pasien**

- Cari dokter & lihat jadwal praktik per poli
- Daftar kunjungan baru (poli, dokter, keluhan)
- Nomor antrean hari ini
- Riwayat pemeriksaan: diagnosis, gejala, tindakan, resep, dan status pembayaran

**Petugas**

- Cari & tambah data pasien (otomatis dibuatkan akun login)
- Buat pendaftaran kunjungan
- Ubah status antrean (dipanggil / selesai / batal)
- Ringkasan antrean per poli
- Tambah & hapus jadwal dokter

**Dokter**

- Jadwal praktik sendiri
- Antrean pasien hari ini
- Input hasil pemeriksaan + resep obat (menyimpan rekam medis & menutup antrean)
- Riwayat rekam medis pasien yang pernah ditangani

## Prasyarat

- Node.js 20+
- PostgreSQL 14+ (database sudah ada / buat baru)
- npm

## 1. Menjalankan Backend

```bash
cd server
npm install
```

Salin environment file lalu isi kredensial database Anda:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Isi minimal `DATABASE_URL` dan `JWT_SECRET` di `server/.env`, contoh:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_manajemen?schema=public"
PORT=4000
JWT_SECRET="string-acak-panjang"
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
```

Siapkan Prisma (schema sudah di-introspect dari database yang ada):

```bash
npm run db:generate   # generate Prisma Client
npm run db:pull       # opsional: introspect ulang jika struktur DB berubah
npm run db:seed       # opsional: isi data demo (aman dijalankan berulang)
npm run dev           # http://localhost:4000
```

Cek kesehatan server:

```bash
curl http://localhost:4000/api/health
```

## 2. Menjalankan Frontend

Dari root proyek:

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Jika backend tidak berjalan di `http://localhost:4000`, buat `.env` di root:

```env
VITE_API_URL="http://localhost:4000/api"
```

## Akun Demo

Data demo dibuat oleh `npm run db:seed` (password mengikuti data awal database):

| Peran | Username | Password |
| --- | --- | --- |
| Pasien | `pasien1` | `dummy_password` |
| Petugas | `petugas1` | `dummy_password` |
| Dokter | `dokter1` | `dummy_password` |
| Dokter | `dokter2` | `dummy_password` |
| Dokter | `dokter3` | `dummy_password` |

Login juga menerima:

- **Pasien:** NIK (16 digit) selain username
- **Dokter:** kode dokter / No. STR selain username

Pasien baru yang ditambahkan petugas otomatis mendapat akun:

- Username = NIK
- Password awal = `pasien123`

> Backend mendukung password lama yang masih **plaintext** maupun yang sudah **bcrypt**,
> sehingga data lama tetap bisa dipakai tanpa migrasi paksa.

## Environment Variables

### `server/.env`

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string PostgreSQL |
| `PORT` | tidak | Port API (default `4000`) |
| `JWT_SECRET` | ya | Kunci penandatangan token JWT |
| `CORS_ORIGIN` | tidak | Origin frontend yang diizinkan, pisahkan dengan koma |

### `.env` (root, opsional)

| Variabel | Keterangan |
| --- | --- |
| `VITE_API_URL` | Base URL API, default `http://localhost:4000/api` |

## Endpoint API

Semua endpoint selain login memerlukan header `Authorization: Bearer <token>`.

**Auth**

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| POST | `/api/auth/login` | Login (`role`, `identifier`, `password`) |
| GET | `/api/auth/me` | Profil pengguna yang sedang login |

**Master**

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/api/poli` | Semua peran |
| GET | `/api/dokter` | Semua peran (filter `polyclinic_id`, `q`) |
| GET | `/api/jadwal` | Semua peran (filter `doctor_id`, `polyclinic_id`, `day`) |
| GET | `/api/obat` | Petugas, Dokter |

**Pasien**

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/pasien/me` | Profil pasien |
| GET | `/api/pasien/antrean` | Antrean hari ini + nomor antrean |
| GET | `/api/pasien/riwayat` | Riwayat kunjungan, rekam medis, resep |
| GET | `/api/pasien/tagihan` | Data pembayaran |
| POST | `/api/pasien/pendaftaran` | Daftar kunjungan baru |

**Petugas**

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/petugas/pasien` | Cari pasien (`q`) |
| POST | `/api/petugas/pasien` | Tambah pasien + akun login |
| GET | `/api/petugas/pendaftaran` | Pendaftaran per tanggal |
| POST | `/api/petugas/pendaftaran` | Buat pendaftaran |
| PATCH | `/api/petugas/pendaftaran/:id/status` | Ubah status antrean |
| GET | `/api/petugas/antrean` | Antrean + ringkasan per poli |
| GET | `/api/petugas/summary` | Statistik dashboard |
| POST | `/api/petugas/jadwal` | Tambah jadwal dokter |
| DELETE | `/api/petugas/jadwal/:id` | Hapus jadwal |

**Dokter**

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/dokter/me` | Profil dokter + jadwal |
| GET | `/api/dokter/jadwal` | Jadwal praktik sendiri |
| GET | `/api/dokter/antrean` | Antrean pasien hari ini |
| GET | `/api/dokter/pasien` | Pasien yang pernah ditangani |
| GET | `/api/dokter/pasien/:id/rekam-medis` | Riwayat rekam medis pasien |
| POST | `/api/dokter/pemeriksaan` | Simpan pemeriksaan + resep |

## Struktur Proyek

```
.
├─ src/                          # Frontend
│  ├─ Pages/
│  │  ├─ login.jsx
│  │  ├─ DashboardPasien.jsx
│  │  ├─ DashboardPetugas.jsx
│  │  └─ DashboardDokter.jsx
│  ├─ components/
│  │  ├─ ProtectedRoute.jsx
│  │  └─ dashboard/              # Shell, UI, ikon
│  ├─ lib/
│  │  ├─ api.js                  # fetch wrapper + token
│  │  ├─ AuthContext.jsx         # sesi login
│  │  ├─ useApi.js               # hook data fetching
│  │  └─ format.js               # format tanggal/rupiah
│  ├─ App.jsx
│  └─ main.jsx
└─ server/                       # Backend
   ├─ prisma/
   │  ├─ schema.prisma           # hasil introspect database
   │  └─ seed.js                 # data demo idempotent
   └─ src/
      ├─ index.js                # app Express + error handler
      ├─ middleware/auth.js      # verifikasi JWT + RBAC
      ├─ lib/                    # prisma, auth, helper, validasi
      └─ routes/                 # auth, master, pasien, petugas, dokter
```

## Perintah

**Root (frontend)**

```bash
npm run dev       # dev server http://localhost:5173
npm run build     # build produksi ke dist/
npm run preview   # pratinjau hasil build
npm run lint      # ESLint

npm run dev:server    # jalankan backend dari root
npm run start:server  # backend mode produksi
npm run db:generate   # generate Prisma Client
npm run db:seed       # isi data demo
```

**`server/`**

```bash
npm run dev          # server dengan --watch
npm run start        # server produksi
npm run db:generate  # generate Prisma Client
npm run db:pull      # introspect schema dari database
npm run db:seed      # isi data demo
npm run db:studio    # Prisma Studio
```

## Catatan Keamanan

- `server/.env` sudah masuk `.gitignore` — jangan commit kredensial.
- Ganti `JWT_SECRET` dan password database sebelum deploy.
- Password legacy yang masih plaintext tetap didukung agar kompatibel, tetapi
  sebaiknya dimigrasikan ke bcrypt untuk produksi.
- Token JWT berlaku 12 jam.
