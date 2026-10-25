# SI Rumah Sakit — Login & Dashboard

Aplikasi frontend sistem manajemen rumah sakit (RS Wijaya Husada) dengan 3 peran pengguna:
**Pasien**, **Petugas**, dan **Dokter**.

Dibangun dengan **React 19 + Vite + React Router 7**.

## Fitur

- Halaman login dengan pemilih peran (pasien / petugas / dokter) dan validasi form
  - Pasien: login dengan NIK 16 digit
  - Petugas: login dengan ID Pegawai
  - Dokter: login dengan No. STR
- Redirect otomatis ke dashboard sesuai peran setelah login
- Dashboard terpisah untuk setiap peran dengan sidebar menu yang responsif
- Tampilan mobile-friendly (sidebar dapat dibuka/tutup)

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Perintah lain:

```bash
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
npm run lint     # cek kode dengan ESLint
```

## Struktur

```
src/
├─ Pages/
│  ├─ login.jsx                 # halaman login 3 peran
│  ├─ DashboardPasien.jsx
│  ├─ DashboardPetugas.jsx
│  └─ DashboardDokter.jsx
├─ App.jsx                      # definisi route
├─ main.jsx
└─ index.css
```

## Route

| Path | Halaman |
| --- | --- |
| `/` | Login |
| `/dashboard/pasien` | Dashboard pasien |
| `/dashboard/petugas` | Dashboard petugas |
| `/dashboard/dokter` | Dashboard dokter |

## Login (simulasi)

Saat ini autentikasi masih **simulasi** (tanpa backend). Isi data apa pun yang valid,
lalu tunggu ±1 detik untuk diarahkan ke dashboard sesuai peran.

Untuk menghubungkan ke backend, ganti bagian `TODO` di `handleSubmit`
pada `src/Pages/login.jsx` dengan pemanggilan API, contoh:

```js
const res = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ role: activeRole, ...form }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.message);
localStorage.setItem("token", data.token);
localStorage.setItem("role", activeRole);
```

## Catatan

Ini adalah prototipe UI. Data pasien, jadwal, dan rekam medis masih berupa placeholder
dan perlu dihubungkan ke API backend masing-masing.
