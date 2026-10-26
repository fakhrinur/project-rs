import { useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Loading,
  Table,
  ui,
} from '../components/dashboard/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { formatDate, formatDateTime, formatTime } from '../lib/format'
import { useApi } from '../lib/useApi'

const MENUS = [
  { id: 'data-pasien', label: 'Data Pasien', icon: 'users' },
  { id: 'pendaftaran', label: 'Pendaftaran', icon: 'clipboard' },
  { id: 'antrean', label: 'Antrean', icon: 'queue' },
  { id: 'jadwal-dokter', label: 'Jadwal Dokter', icon: 'calendar' },
]

export default function DashboardPetugas() {
  const { user } = useAuth()
  const [activeMenu, setActiveMenu] = useState('data-pasien')

  const title = MENUS.find((menu) => menu.id === activeMenu)?.label ?? 'Dashboard'

  return (
    <DashboardShell
      roleLabel="Petugas"
      title={title}
      subtitle={`Selamat datang kembali, ${user?.nama ?? 'Petugas'}.`}
      menus={MENUS}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {activeMenu === 'data-pasien' && <DataPasien />}
      {activeMenu === 'pendaftaran' && <PendaftaranPetugas />}
      {activeMenu === 'antrean' && <AntreanPetugas />}
      {activeMenu === 'jadwal-dokter' && <JadwalPetugas />}
    </DashboardShell>
  )
}

function DataPasien() {
  const { data, loading, error, reload } = useApi('/petugas/pasien')
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nik: '',
    name: '',
    gender: 'L',
    birth_date: '',
    address: '',
    phone: '',
    blood_type: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [notice, setNotice] = useState(null)

  const patients = useMemo(() => {
    const list = data?.data ?? []
    const keyword = query.trim().toLowerCase()

    if (!keyword) return list

    return list.filter((patient) =>
      `${patient.name} ${patient.nik ?? ''}`.toLowerCase().includes(keyword),
    )
  }, [data, query])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)
    setSubmitting(true)

    try {
      const response = await api.post('/petugas/pasien', {
        ...form,
        birth_date: form.birth_date || undefined,
        blood_type: form.blood_type || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
      })

      setNotice(response.message ?? 'Pasien berhasil ditambahkan.')
      setForm({
        nik: '',
        name: '',
        gender: 'L',
        birth_date: '',
        address: '',
        phone: '',
        blood_type: '',
      })
      setShowForm(false)
      reload()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Data Pasien"
        subtitle="Cari pasien atau tambahkan pasien baru."
        actions={
          <div style={{ ...ui.row, gap: 8 }}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / NIK"
              style={{ ...ui.input, width: 210 }}
            />
            <Button onClick={() => setShowForm((value) => !value)}>
              {showForm ? 'Tutup Form' : '+ Pasien Baru'}
            </Button>
          </div>
        }
      >
        <ErrorNote message={error} onRetry={reload} />
        {notice && <p style={styles.notice}>{notice}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.formBox}>
            <div style={styles.grid2}>
              <Field label="NIK (16 digit)">
                <input value={form.nik} onChange={update('nik')} maxLength={16} required style={ui.input} />
              </Field>
              <Field label="Nama Lengkap">
                <input value={form.name} onChange={update('name')} required style={ui.input} />
              </Field>
              <Field label="Jenis Kelamin">
                <select value={form.gender} onChange={update('gender')} style={ui.input}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </Field>
              <Field label="Tanggal Lahir">
                <input type="date" value={form.birth_date} onChange={update('birth_date')} style={ui.input} />
              </Field>
              <Field label="No. Telepon">
                <input value={form.phone} onChange={update('phone')} style={ui.input} />
              </Field>
              <Field label="Golongan Darah">
                <input value={form.blood_type} onChange={update('blood_type')} placeholder="A / B / AB / O" style={ui.input} />
              </Field>
            </div>
            <Field label="Alamat">
              <textarea rows={2} value={form.address} onChange={update('address')} style={{ ...ui.input, resize: 'vertical' }} />
            </Field>

            <ErrorNote message={formError} />

            <div style={{ ...ui.row, gap: 8 }}>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Pasien'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {loading && <Loading />}

        {!loading && (
          <Table
            empty="Belum ada data pasien."
            rows={patients.map((patient) => ({ ...patient, key: patient.patient_id }))}
            columns={[
              { key: 'name', label: 'Nama' },
              { key: 'nik', label: 'NIK', render: (row) => row.nik ?? '-' },
              { key: 'gender', label: 'JK', render: (row) => row.gender ?? '-' },
              {
                key: 'birth_date',
                label: 'Tgl Lahir',
                render: (row) => (row.birth_date ? formatDate(row.birth_date) : '-'),
              },
              { key: 'phone', label: 'Telepon', render: (row) => row.phone ?? '-' },
              {
                key: 'account',
                label: 'Akun',
                render: (row) => (row.users ? row.users.username : 'belum ada'),
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

function PendaftaranPetugas() {
  const patients = useApi('/petugas/pasien')
  const poli = useApi('/poli')
  const doctors = useApi('/dokter')
  const registrations = useApi('/petugas/pendaftaran')

  const [form, setForm] = useState({
    patient_id: '',
    polyclinic_id: '',
    doctor_id: '',
    complaint: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const availableDoctors = useMemo(() => {
    const list = doctors.data?.data ?? []
    if (!form.polyclinic_id) return list

    return list.filter((doctor) =>
      doctor.doctor_schedules.some(
        (schedule) => String(schedule.polyclinic_id) === form.polyclinic_id,
      ),
    )
  }, [doctors.data, form.polyclinic_id])

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'polyclinic_id' ? { doctor_id: '' } : {}),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!form.patient_id || !form.polyclinic_id || !form.doctor_id) {
      setError('Pasien, poli, dan dokter wajib dipilih.')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/petugas/pendaftaran', {
        patient_id: Number(form.patient_id),
        polyclinic_id: Number(form.polyclinic_id),
        doctor_id: Number(form.doctor_id),
        complaint: form.complaint.trim() || undefined,
      })

      setNotice('Pendaftaran berhasil dibuat.')
      setForm({ patient_id: '', polyclinic_id: '', doctor_id: '', complaint: '' })
      registrations.reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function changeStatus(id, status) {
    setError(null)

    try {
      await api.patch(`/petugas/pendaftaran/${id}/status`, { status })
      registrations.reload()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Pendaftaran Pasien" subtitle="Daftarkan kunjungan baru untuk pasien.">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div style={styles.grid2}>
            <Field label="Pasien">
              <select value={form.patient_id} onChange={update('patient_id')} style={ui.input}>
                <option value="">Pilih pasien</option>
                {(patients.data?.data ?? []).map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.name} — {patient.nik ?? '-'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Poli">
              <select value={form.polyclinic_id} onChange={update('polyclinic_id')} style={ui.input}>
                <option value="">Pilih poli</option>
                {(poli.data?.data ?? []).map((item) => (
                  <option key={item.polyclinic_id} value={item.polyclinic_id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dokter">
              <select value={form.doctor_id} onChange={update('doctor_id')} style={ui.input}>
                <option value="">Pilih dokter</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Keluhan">
              <input value={form.complaint} onChange={update('complaint')} placeholder="Keluhan pasien" style={ui.input} />
            </Field>
          </div>

          <ErrorNote message={error || patients.error} onRetry={patients.reload} />
          {notice && <p style={styles.notice}>{notice}</p>}

          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Buat Pendaftaran'}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Pendaftaran Hari Ini"
        subtitle="Ubah status antrean pasien."
        actions={<Button variant="ghost" onClick={registrations.reload}>Muat ulang</Button>}
      >
        {registrations.loading && <Loading />}
        <ErrorNote message={registrations.error} onRetry={registrations.reload} />

        {!registrations.loading && (
          <Table
            empty="Belum ada pendaftaran hari ini."
            rows={(registrations.data?.data ?? []).map((row) => ({
              ...row,
              key: row.registration_id,
            }))}
            columns={[
              { key: 'queue_no', label: 'No.', render: (row) => `#${row.queue_no ?? '-'}` },
              { key: 'patient', label: 'Pasien', render: (row) => row.patients?.name },
              { key: 'poli', label: 'Poli', render: (row) => row.polyclinics?.name },
              { key: 'doctor', label: 'Dokter', render: (row) => row.doctors?.name },
              {
                key: 'time',
                label: 'Jam',
                render: (row) => formatTime(row.registration_date),
              },
              { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
              {
                key: 'actions',
                label: 'Aksi',
                render: (row) => (
                  <div style={{ ...ui.row, gap: 6 }}>
                    {row.status === 'menunggu' && (
                      <Button
                        variant="ghost"
                        style={{ padding: '5px 9px', fontSize: 12 }}
                        onClick={() => changeStatus(row.registration_id, 'dipanggil')}
                      >
                        Panggil
                      </Button>
                    )}
                    {row.status !== 'selesai' && row.status !== 'batal' && (
                      <Button
                        variant="ghost"
                        style={{ padding: '5px 9px', fontSize: 12 }}
                        onClick={() => changeStatus(row.registration_id, 'selesai')}
                      >
                        Selesai
                      </Button>
                    )}
                    {row.status !== 'batal' && (
                      <Button
                        variant="danger"
                        style={{ padding: '5px 9px', fontSize: 12 }}
                        onClick={() => changeStatus(row.registration_id, 'batal')}
                      >
                        Batal
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

function AntreanPetugas() {
  const { data, loading, error, reload } = useApi('/petugas/antrean')
  const rows = data?.data ?? []
  const summary = data?.summary

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={styles.statGrid}>
        <StatCard label="Total antrean" value={summary?.total ?? 0} />
        <StatCard label="Menunggu" value={summary?.menunggu ?? 0} tone="#946200" />
        <StatCard label="Selesai" value={summary?.selesai ?? 0} tone="#2E7D32" />
      </div>

      <Card
        title="Antrean Hari Ini"
        subtitle="Daftar antrean seluruh poli."
        actions={<Button variant="ghost" onClick={reload}>Muat ulang</Button>}
      >
        {loading && <Loading />}
        <ErrorNote message={error} onRetry={reload} />

        {!loading && (
          <Table
            empty="Belum ada antrean hari ini."
            rows={rows.map((row) => ({ ...row, key: row.registration_id }))}
            columns={[
              { key: 'queue_no', label: 'No.', render: (row) => `#${row.queue_no ?? '-'}` },
              { key: 'patient', label: 'Pasien', render: (row) => row.patients?.name },
              { key: 'poli', label: 'Poli', render: (row) => row.polyclinics?.name },
              { key: 'doctor', label: 'Dokter', render: (row) => row.doctors?.name },
              {
                key: 'registered',
                label: 'Terdaftar',
                render: (row) => formatDateTime(row.registration_date),
              },
              { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
            ]}
          />
        )}

        {summary?.poli?.length > 0 && (
          <div style={{ ...ui.row, gap: 8, marginTop: 14 }}>
            {summary.poli.map((item) => (
              <span key={item.polyclinic} style={styles.poliChip}>
                {item.polyclinic}: {item.total} antrean ({item.menunggu} menunggu)
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function JadwalPetugas() {
  const schedules = useApi('/jadwal')
  const doctors = useApi('/dokter')
  const poli = useApi('/poli')
  const [form, setForm] = useState({
    doctor_id: '',
    polyclinic_id: '',
    day: 'Senin',
    start_time: '08:00',
    end_time: '12:00',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!form.doctor_id || !form.polyclinic_id) {
      setError('Dokter dan poli wajib dipilih.')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/petugas/jadwal', {
        doctor_id: Number(form.doctor_id),
        polyclinic_id: Number(form.polyclinic_id),
        day: form.day,
        start_time: form.start_time,
        end_time: form.end_time,
      })
      setNotice('Jadwal berhasil ditambahkan.')
      schedules.reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeSchedule(id) {
    setError(null)

    try {
      await api.delete(`/petugas/jadwal/${id}`)
      schedules.reload()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Tambah Jadwal Praktik" subtitle="Atur jadwal dokter per poli dan hari.">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div style={styles.grid3}>
            <Field label="Dokter">
              <select value={form.doctor_id} onChange={update('doctor_id')} style={ui.input}>
                <option value="">Pilih dokter</option>
                {(doctors.data?.data ?? []).map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Poli">
              <select value={form.polyclinic_id} onChange={update('polyclinic_id')} style={ui.input}>
                <option value="">Pilih poli</option>
                {(poli.data?.data ?? []).map((item) => (
                  <option key={item.polyclinic_id} value={item.polyclinic_id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Hari">
              <select value={form.day} onChange={update('day')} style={ui.input}>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jam Mulai">
              <input type="time" value={form.start_time} onChange={update('start_time')} style={ui.input} />
            </Field>

            <Field label="Jam Selesai">
              <input type="time" value={form.end_time} onChange={update('end_time')} style={ui.input} />
            </Field>
          </div>

          <ErrorNote message={error || schedules.error} onRetry={schedules.reload} />
          {notice && <p style={styles.notice}>{notice}</p>}

          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Jadwal Praktik"
        subtitle="Seluruh jadwal yang terdaftar."
        actions={<Button variant="ghost" onClick={schedules.reload}>Muat ulang</Button>}
      >
        {schedules.loading && <Loading />}

        {!schedules.loading && (
          <Table
            empty="Belum ada jadwal."
            rows={(schedules.data?.data ?? []).map((row) => ({
              ...row,
              key: row.schedule_id,
            }))}
            columns={[
              { key: 'day', label: 'Hari' },
              { key: 'doctor', label: 'Dokter', render: (row) => row.doctors?.name },
              { key: 'poli', label: 'Poli', render: (row) => row.polyclinics?.name },
              {
                key: 'time',
                label: 'Jam',
                render: (row) => `${formatTime(row.start_time)}–${formatTime(row.end_time)}`,
              },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <Button
                    variant="danger"
                    style={{ padding: '5px 9px', fontSize: 12 }}
                    onClick={() => removeSchedule(row.schedule_id)}
                  >
                    Hapus
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: tone ?? '#12352F' }}>{value}</p>
    </div>
  )
}

const styles = {
  grid2: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  grid3: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  formBox: {
    background: '#F8FBFA',
    border: '1px solid #E3ECE9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    display: 'grid',
    gap: 12,
  },
  notice: {
    background: '#EEF6F3',
    border: '1px solid #BFE0D5',
    color: '#22695C',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    margin: '0 0 12px',
  },
  statGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  },
  statCard: {
    background: '#FFFFFF',
    border: '1px solid #E3ECE9',
    borderRadius: 14,
    padding: 16,
  },
  statLabel: {
    margin: '0 0 6px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#5C6B67',
  },
  statValue: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Source Serif 4', serif",
  },
  poliChip: {
    background: '#EEF3F1',
    color: '#4A5C57',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
}
