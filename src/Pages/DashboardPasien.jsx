import { useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorNote,
  Field,
  Loading,
  ui,
} from '../components/dashboard/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { formatDate, formatDateTime, formatRupiah, formatTime } from '../lib/format'
import { useApi } from '../lib/useApi'

const MENUS = [
  { id: 'cari-dokter', label: 'Cari Dokter', icon: 'search' },
  { id: 'jadwal-dokter', label: 'Jadwal Dokter', icon: 'calendar' },
  { id: 'pendaftaran', label: 'Pendaftaran', icon: 'clipboard' },
  { id: 'antrean-saya', label: 'Antrean Saya', icon: 'queue' },
  { id: 'riwayat', label: 'Riwayat Pemeriksaan', icon: 'history' },
]

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function DashboardPasien() {
  const { user } = useAuth()
  const [activeMenu, setActiveMenu] = useState('cari-dokter')
  const [draftDoctor, setDraftDoctor] = useState(null)

  const title = MENUS.find((menu) => menu.id === activeMenu)?.label ?? 'Dashboard'

  const startRegistration = (doctor) => {
    setDraftDoctor(doctor)
    setActiveMenu('pendaftaran')
  }

  return (
    <DashboardShell
      roleLabel="Pasien"
      title={title}
      subtitle={`Selamat datang kembali, ${user?.nama ?? 'Pasien'}.`}
      menus={MENUS}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {activeMenu === 'cari-dokter' && <CariDokter onRegister={startRegistration} />}
      {activeMenu === 'jadwal-dokter' && <JadwalDokter />}
      {activeMenu === 'pendaftaran' && (
        <Pendaftaran
          initialDoctor={draftDoctor}
          onFinished={() => setActiveMenu('antrean-saya')}
          key={draftDoctor?.doctor_id ?? 'manual'}
        />
      )}
      {activeMenu === 'antrean-saya' && <AntreanSaya />}
      {activeMenu === 'riwayat' && <Riwayat />}
    </DashboardShell>
  )
}

function CariDokter({ onRegister }) {
  const [query, setQuery] = useState('')
  const { data, loading, error, reload } = useApi('/dokter')

  const doctors = useMemo(() => {
    const list = data?.data ?? []
    const keyword = query.trim().toLowerCase()

    if (!keyword) return list

    return list.filter((doctor) =>
      `${doctor.name} ${doctor.specialization ?? ''}`.toLowerCase().includes(keyword),
    )
  }, [data, query])

  return (
    <Card
      title="Cari Dokter"
      subtitle="Cari dokter berdasarkan nama atau spesialisasi, lalu daftar kunjungan."
      actions={
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama / spesialisasi"
          style={{ ...ui.input, width: 250 }}
        />
      }
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && doctors.length === 0 && (
        <Empty text="Dokter tidak ditemukan." />
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {doctors.map((doctor) => (
          <div key={doctor.doctor_id} style={styles.itemRow}>
            <div style={{ minWidth: 0 }}>
              <p style={styles.itemTitle}>{doctor.name}</p>
              <p style={ui.muted}>
                {doctor.specialization ?? 'Umum'} · Kode {doctor.doctor_code}
              </p>
              <div style={{ ...ui.row, gap: 6, marginTop: 8 }}>
                {doctor.doctor_schedules.slice(0, 3).map((schedule) => (
                  <span key={schedule.schedule_id} style={styles.chip}>
                    {schedule.day} {formatTime(schedule.start_time)}–
                    {formatTime(schedule.end_time)} · {schedule.polyclinics?.name}
                  </span>
                ))}
                {doctor.doctor_schedules.length > 3 && (
                  <span style={styles.chip}>
                    +{doctor.doctor_schedules.length - 3} jadwal lain
                  </span>
                )}
                {doctor.doctor_schedules.length === 0 && (
                  <span style={ui.muted}>Belum ada jadwal praktik</span>
                )}
              </div>
            </div>
            <Button
              onClick={() => onRegister(doctor)}
              disabled={doctor.doctor_schedules.length === 0}
            >
              Daftar
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function JadwalDokter() {
  const [polyclinicId, setPolyclinicId] = useState('')
  const { data, loading, error, reload } = useApi('/jadwal')
  const poli = useApi('/poli')

  const grouped = useMemo(() => {
    const schedules = (data?.data ?? []).filter(
      (schedule) =>
        !polyclinicId || String(schedule.polyclinic_id) === polyclinicId,
    )

    const map = new Map()
    for (const schedule of schedules) {
      if (!map.has(schedule.day)) map.set(schedule.day, [])
      map.get(schedule.day).push(schedule)
    }

    return [...map.entries()].sort(
      (a, b) =>
        (DAY_ORDER.indexOf(a[0]) + 1 || 99) - (DAY_ORDER.indexOf(b[0]) + 1 || 99),
    )
  }, [data, polyclinicId])

  return (
    <Card
      title="Jadwal Dokter"
      subtitle="Jadwal praktik seluruh dokter per poli dan hari."
      actions={
        <select
          value={polyclinicId}
          onChange={(event) => setPolyclinicId(event.target.value)}
          style={{ ...ui.input, width: 200 }}
        >
          <option value="">Semua poli</option>
          {(poli.data?.data ?? []).map((item) => (
            <option key={item.polyclinic_id} value={item.polyclinic_id}>
              {item.name}
            </option>
          ))}
        </select>
      }
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && grouped.length === 0 && (
        <Empty text="Belum ada jadwal untuk filter ini." />
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {grouped.map(([day, schedules]) => (
          <div key={day} style={styles.dayCard}>
            <p style={styles.dayTitle}>{day}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {schedules.map((schedule) => (
                <div key={schedule.schedule_id} style={styles.scheduleRow}>
                  <span style={styles.timeBadge}>
                    {formatTime(schedule.start_time)}–{formatTime(schedule.end_time)}
                  </span>
                  <span style={{ flex: 1, minWidth: 140 }}>
                    <strong style={{ color: '#132A25' }}>{schedule.doctors?.name}</strong>
                    <span style={{ color: '#5C6B67' }}> · {schedule.polyclinics?.name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Pendaftaran({ initialDoctor, onFinished }) {
  const poli = useApi('/poli')
  const doctors = useApi('/dokter')
  const [polyclinicId, setPolyclinicId] = useState(
    initialDoctor?.doctor_schedules?.[0]?.polyclinic_id
      ? String(initialDoctor.doctor_schedules[0].polyclinic_id)
      : '',
  )
  const [doctorId, setDoctorId] = useState(
    initialDoctor?.doctor_id ? String(initialDoctor.doctor_id) : '',
  )
  const [complaint, setComplaint] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const availableDoctors = useMemo(() => {
    const list = doctors.data?.data ?? []

    if (!polyclinicId) return list

    return list.filter((doctor) =>
      doctor.doctor_schedules.some(
        (schedule) => String(schedule.polyclinic_id) === polyclinicId,
      ),
    )
  }, [doctors.data, polyclinicId])

  const selectedDoctorId = availableDoctors.some(
    (doctor) => String(doctor.doctor_id) === doctorId,
  )
    ? doctorId
    : ''

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!polyclinicId || !selectedDoctorId) {
      setError('Pilih poli dan dokter terlebih dahulu.')
      return
    }

    setSubmitting(true)

    try {
      const response = await api.post('/pasien/pendaftaran', {
        polyclinic_id: Number(polyclinicId),
        doctor_id: Number(selectedDoctorId),
        complaint: complaint.trim() || undefined,
      })

      setSuccess(response.data)
      setComplaint('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <Card
        title="Pendaftaran Kunjungan"
        subtitle="Pilih poli dan dokter, lalu jelaskan keluhan Anda."
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Field label="Poli">
              <select
                value={polyclinicId}
                onChange={(event) => setPolyclinicId(event.target.value)}
                style={ui.input}
              >
                <option value="">Pilih poli</option>
                {(poli.data?.data ?? []).map((item) => (
                  <option key={item.polyclinic_id} value={item.polyclinic_id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dokter">
              <select
                value={selectedDoctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                style={ui.input}
              >
                <option value="">Pilih dokter</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name} — {doctor.specialization ?? 'Umum'}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Keluhan">
            <textarea
              rows={3}
              value={complaint}
              onChange={(event) => setComplaint(event.target.value)}
              placeholder="Contoh: demam dan batuk sejak 2 hari"
              style={{ ...ui.input, resize: 'vertical' }}
            />
          </Field>

          <ErrorNote message={error} />

          {success && (
            <div style={styles.successBox}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#12352F', fontSize: 14 }}>
                Pendaftaran berhasil
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#374942' }}>
                {success.polyclinics?.name} · {success.doctors?.name} · status{' '}
                <strong>{success.status}</strong>
              </p>
            </div>
          )}

          <div style={{ ...ui.row, gap: 8 }}>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
            {success && (
              <Button variant="ghost" onClick={onFinished}>
                Lihat Antrean
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Dokter di poli terpilih" subtitle="Jadwal praktik tersedia.">
        {doctors.loading && <Loading />}
        <ErrorNote message={doctors.error} onRetry={doctors.reload} />
        {!doctors.loading && availableDoctors.length === 0 && (
          <Empty text="Belum ada dokter pada poli ini." />
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {availableDoctors.map((doctor) => (
            <div key={doctor.doctor_id} style={styles.itemRow}>
              <div>
                <p style={styles.itemTitle}>{doctor.name}</p>
                <p style={ui.muted}>{doctor.specialization ?? 'Umum'}</p>
              </div>
              <div style={{ ...ui.row, gap: 6 }}>
                {doctor.doctor_schedules
                  .filter(
                    (schedule) =>
                      !polyclinicId ||
                      String(schedule.polyclinic_id) === polyclinicId,
                  )
                  .slice(0, 2)
                  .map((schedule) => (
                    <span key={schedule.schedule_id} style={styles.chip}>
                      {schedule.day} {formatTime(schedule.start_time)}–
                      {formatTime(schedule.end_time)}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function AntreanSaya() {
  const { data, loading, error, reload } = useApi('/pasien/antrean')
  const rows = data?.data ?? []

  return (
    <Card
      title="Antrean Saya"
      subtitle="Antrean kunjungan hari ini."
      actions={<Button variant="ghost" onClick={reload}>Muat ulang</Button>}
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && rows.length === 0 && (
        <Empty text="Belum ada antrean hari ini. Silakan daftar kunjungan terlebih dahulu." />
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((row) => (
          <div key={row.registration_id} style={styles.queueCard}>
            <div style={styles.queueNumber}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7FB8AB' }}>
                NO. ANTREAN
              </span>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
                {row.queue_no ?? '-'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ ...ui.row, gap: 8, marginBottom: 4 }}>
                <strong style={{ color: '#132A25' }}>{row.polyclinics?.name}</strong>
                <Badge>{row.status}</Badge>
              </div>
              <p style={ui.muted}>
                {row.doctors?.name} · terdaftar {formatDateTime(row.registration_date)}
              </p>
              {row.complaint && (
                <p style={{ ...ui.muted, marginTop: 4 }}>Keluhan: {row.complaint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Riwayat() {
  const { data, loading, error, reload } = useApi('/pasien/riwayat')
  const rows = data?.data ?? []

  return (
    <Card
      title="Riwayat Pemeriksaan"
      subtitle="Seluruh kunjungan, diagnosis, resep, dan status pembayaran."
      actions={<Button variant="ghost" onClick={reload}>Muat ulang</Button>}
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && rows.length === 0 && (
        <Empty text="Belum ada riwayat pemeriksaan." />
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((row) => {
          const record = row.medical_records

          return (
            <div key={row.registration_id} style={styles.historyCard}>
              <div style={{ ...ui.row, justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ color: '#132A25' }}>{row.polyclinics?.name}</strong>
                  <p style={ui.muted}>
                    {formatDateTime(row.registration_date)} · {row.doctors?.name}
                  </p>
                </div>
                <div style={{ ...ui.row, gap: 6 }}>
                  <Badge>{row.status}</Badge>
                  {row.payments && <Badge>{row.payments.payment_status}</Badge>}
                </div>
              </div>

              {row.complaint && (
                <p style={{ ...ui.muted, marginTop: 8 }}>Keluhan: {row.complaint}</p>
              )}

              {record ? (
                <div style={styles.recordBox}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#2F8F7E' }}>
                    DIAGNOSIS
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: '#132A25', fontWeight: 600 }}>
                    {record.diagnosis ?? '-'}
                  </p>
                  {record.symptoms && (
                    <p style={ui.muted}>Gejala: {record.symptoms}</p>
                  )}
                  {record.treatment && (
                    <p style={ui.muted}>Tindakan: {record.treatment}</p>
                  )}
                  {record.notes && <p style={ui.muted}>Catatan: {record.notes}</p>}

                  {record.prescriptions?.length > 0 && (
                    <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: '#374942' }}>
                      {record.prescriptions.map((prescription) => (
                        <li key={prescription.prescription_id}>
                          {prescription.medicines?.name} — {prescription.quantity}{' '}
                          {prescription.medicines?.unit ?? ''} ({prescription.dosage ?? '-'})
                          {prescription.instructions ? `, ${prescription.instructions}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p style={{ ...ui.muted, marginTop: 8 }}>
                  Belum ada catatan pemeriksaan untuk kunjungan ini.
                </p>
              )}

              {row.payments && (
                <p style={{ ...ui.muted, marginTop: 10 }}>
                  Biaya: {formatRupiah(row.payments.amount)} · Metode:{' '}
                  {row.payments.payment_method ?? '-'} · Dibayar{' '}
                  {row.payments.paid_at ? formatDate(row.payments.paid_at) : '-'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const styles = {
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    padding: '12px 14px',
    border: '1px solid #E3ECE9',
    borderRadius: 12,
    background: '#FBFDFC',
  },
  itemTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#132A25',
  },
  chip: {
    background: '#EEF3F1',
    color: '#4A5C57',
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 600,
  },
  dayCard: {
    border: '1px solid #E3ECE9',
    borderRadius: 12,
    padding: 14,
  },
  dayTitle: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#2F8F7E',
  },
  scheduleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    fontSize: 13,
    color: '#374942',
    padding: '6px 0',
    borderTop: '1px dashed #E3ECE9',
  },
  timeBadge: {
    background: '#12352F',
    color: '#EAF3F0',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  successBox: {
    background: '#EEF6F3',
    border: '1px solid #BFE0D5',
    borderRadius: 10,
    padding: 14,
  },
  queueCard: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
    border: '1px solid #E3ECE9',
    borderRadius: 14,
    padding: 14,
    background: '#FBFDFC',
  },
  queueNumber: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 92,
    padding: '10px 14px',
    borderRadius: 12,
    background: '#12352F',
  },
  historyCard: {
    border: '1px solid #E3ECE9',
    borderRadius: 14,
    padding: 16,
    background: '#FFFFFF',
  },
  recordBox: {
    background: '#F6FAF9',
    border: '1px solid #E3ECE9',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
}
