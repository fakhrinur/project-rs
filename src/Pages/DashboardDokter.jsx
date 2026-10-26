import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import {
  Badge,
  Button,
  Card,
  Empty,
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
  { id: 'jadwal-saya', label: 'Jadwal Saya', icon: 'calendar' },
  { id: 'antrean-pasien', label: 'Antrean Pasien', icon: 'queue' },
  { id: 'pemeriksaan', label: 'Pemeriksaan', icon: 'stethoscope' },
  { id: 'riwayat-pasien', label: 'Riwayat Pasien', icon: 'history' },
]

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function DashboardDokter() {
  const { user } = useAuth()
  const [activeMenu, setActiveMenu] = useState('jadwal-saya')
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const title = MENUS.find((menu) => menu.id === activeMenu)?.label ?? 'Dashboard'

  const startExam = (registration) => {
    setSelectedRegistration(registration)
    setActiveMenu('pemeriksaan')
  }

  const handleSaved = () => {
    setSelectedRegistration(null)
    setRefreshKey((value) => value + 1)
    setActiveMenu('antrean-pasien')
  }

  return (
    <DashboardShell
      roleLabel="Dokter"
      title={title}
      subtitle={`Selamat bertugas, ${user?.name ?? user?.nama ?? 'Dokter'}.`}
      menus={MENUS}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {activeMenu === 'jadwal-saya' && <JadwalSaya />}
      {activeMenu === 'antrean-pasien' && (
        <AntreanPasien key={refreshKey} onStartExam={startExam} />
      )}
      {activeMenu === 'pemeriksaan' && (
        <Pemeriksaan
          registration={selectedRegistration}
          onSaved={handleSaved}
          onPickRegistration={() => setActiveMenu('antrean-pasien')}
          onSelect={startExam}
        />
      )}
      {activeMenu === 'riwayat-pasien' && <RiwayatPasien />}
    </DashboardShell>
  )
}

function JadwalSaya() {
  const { data, loading, error, reload } = useApi('/dokter/jadwal')
  const profile = useApi('/dokter/me')

  const grouped = useMemo(() => {
    const map = new Map()

    for (const schedule of data?.data ?? []) {
      if (!map.has(schedule.day)) map.set(schedule.day, [])
      map.get(schedule.day).push(schedule)
    }

    return [...map.entries()].sort(
      (a, b) =>
        (DAY_ORDER.indexOf(a[0]) + 1 || 99) - (DAY_ORDER.indexOf(b[0]) + 1 || 99),
    )
  }, [data])

  return (
    <Card
      title="Jadwal Praktik Saya"
      subtitle={`${profile.data?.data?.name ?? 'Dokter'} · ${profile.data?.data?.specialization ?? '-'}`}
      actions={<Button variant="ghost" onClick={reload}>Muat ulang</Button>}
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && grouped.length === 0 && (
        <Empty text="Belum ada jadwal praktik. Hubungi petugas untuk menambahkan jadwal." />
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
                  <span style={{ color: '#374942' }}>{schedule.polyclinics?.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AntreanPasien({ onStartExam }) {
  const { data, loading, error, reload } = useApi('/dokter/antrean')
  const rows = data?.data ?? []

  return (
    <Card
      title="Antrean Pasien Hari Ini"
      subtitle="Pasien yang terdaftar untuk Anda."
      actions={<Button variant="ghost" onClick={reload}>Muat ulang</Button>}
    >
      {loading && <Loading />}
      <ErrorNote message={error} onRetry={reload} />

      {!loading && !error && rows.length === 0 && (
        <Empty text="Belum ada pasien dalam antrean hari ini." />
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.registration_id} style={styles.queueRow}>
            <div style={styles.queueNumber}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7FB8AB' }}>NO.</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
                {row.queue_no ?? '-'}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ ...ui.row, gap: 8 }}>
                <strong style={{ color: '#132A25' }}>{row.patients?.name}</strong>
                <Badge>{row.status}</Badge>
              </div>
              <p style={ui.muted}>
                {row.polyclinics?.name} · {formatTime(row.registration_date)}
                {row.patients?.nik ? ` · NIK ${row.patients.nik}` : ''}
              </p>
              {row.complaint && <p style={{ ...ui.muted, marginTop: 3 }}>Keluhan: {row.complaint}</p>}
            </div>

            <Button variant="accent" onClick={() => onStartExam(row)}>
              Periksa
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Pemeriksaan({ registration, onSaved, onPickRegistration, onSelect }) {
  const antrean = useApi('/dokter/antrean')
  const medicines = useApi('/obat')
  const [form, setForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
  })
  const [prescriptions, setPrescriptions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const registrationId = registration?.registration_id ?? null

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function addPrescription() {
    setPrescriptions((current) => [
      ...current,
      { medicine_id: '', quantity: 1, dosage: '', instructions: '' },
    ])
  }

  function updatePrescription(index, field, value) {
    setPrescriptions((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  function removePrescription(index) {
    setPrescriptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!registrationId) {
      setError('Pilih pasien dari antrean terlebih dahulu.')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/dokter/pemeriksaan', {
        registration_id: registrationId,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms || undefined,
        treatment: form.treatment || undefined,
        notes: form.notes || undefined,
        prescriptions: prescriptions
          .filter((item) => item.medicine_id)
          .map((item) => ({
            medicine_id: Number(item.medicine_id),
            quantity: Number(item.quantity) || 1,
            dosage: item.dosage || undefined,
            instructions: item.instructions || undefined,
          })),
      })

      setNotice('Hasil pemeriksaan berhasil disimpan.')
      setForm({ diagnosis: '', symptoms: '', treatment: '', notes: '' })
      setPrescriptions([])
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Pemeriksaan Pasien"
        subtitle={
          registration
            ? `${registration.patients?.name} · ${registration.polyclinics?.name} · No. ${registration.queue_no ?? '-'}`
            : 'Belum ada pasien yang dipilih.'
        }
        actions={
          <Button variant="ghost" onClick={onPickRegistration}>
            Pilih dari Antrean
          </Button>
        }
      >
        {!registration && <Empty text="Buka menu Antrean Pasien lalu tekan tombol Periksa." />}

        {registration && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div style={styles.grid2}>
              <Field label="Diagnosis">
                <input value={form.diagnosis} onChange={update('diagnosis')} required style={ui.input} />
              </Field>
              <Field label="Gejala">
                <input value={form.symptoms} onChange={update('symptoms')} style={ui.input} />
              </Field>
            </div>

            <Field label="Tindakan">
              <input value={form.treatment} onChange={update('treatment')} style={ui.input} />
            </Field>

            <Field label="Catatan">
              <textarea
                rows={2}
                value={form.notes}
                onChange={update('notes')}
                style={{ ...ui.input, resize: 'vertical' }}
              />
            </Field>

            <div>
              <div style={{ ...ui.row, justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={ui.label}>Resep Obat</span>
                <Button variant="ghost" onClick={addPrescription}>
                  + Tambah Obat
                </Button>
              </div>

              {prescriptions.length === 0 && (
                <p style={ui.muted}>Belum ada obat pada resep ini.</p>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                {prescriptions.map((item, index) => (
                  <div key={index} style={styles.prescriptionRow}>
                    <select
                      value={item.medicine_id}
                      onChange={(event) =>
                        updatePrescription(index, 'medicine_id', event.target.value)
                      }
                      style={{ ...ui.input, flex: '2 1 160px' }}
                    >
                      <option value="">Pilih obat</option>
                      {(medicines.data?.data ?? []).map((medicine) => (
                        <option key={medicine.medicine_id} value={medicine.medicine_id}>
                          {medicine.name} (stok {medicine.stock ?? 0})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updatePrescription(index, 'quantity', event.target.value)
                      }
                      style={{ ...ui.input, width: 80 }}
                      aria-label="Jumlah"
                    />

                    <input
                      value={item.dosage}
                      onChange={(event) =>
                        updatePrescription(index, 'dosage', event.target.value)
                      }
                      placeholder="3x1"
                      style={{ ...ui.input, width: 90 }}
                      aria-label="Dosis"
                    />

                    <input
                      value={item.instructions}
                      onChange={(event) =>
                        updatePrescription(index, 'instructions', event.target.value)
                      }
                      placeholder="Sesudah makan"
                      style={{ ...ui.input, flex: '1 1 150px' }}
                      aria-label="Aturan pakai"
                    />

                    <Button
                      variant="danger"
                      onClick={() => removePrescription(index)}
                      style={{ padding: '8px 10px' }}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <ErrorNote message={error} />
            {notice && <p style={styles.notice}>{notice}</p>}

            <div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Antrean Saat Ini" subtitle="Pilih pasien lain jika diperlukan.">
        {antrean.loading && <Loading />}
        <ErrorNote message={antrean.error} onRetry={antrean.reload} />

        {!antrean.loading && (
          <Table
            empty="Tidak ada antrean hari ini."
            rows={(antrean.data?.data ?? []).map((row) => ({
              ...row,
              key: row.registration_id,
            }))}
            columns={[
              { key: 'queue_no', label: 'No.', render: (row) => `#${row.queue_no ?? '-'}` },
              { key: 'patient', label: 'Pasien', render: (row) => row.patients?.name },
              { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
              {
                key: 'action',
                label: '',
                render: (row) => (
                  <Button
                    variant="ghost"
                    style={{ padding: '5px 9px', fontSize: 12 }}
                    onClick={() => onSelect(row)}
                  >
                    Pilih
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

function RiwayatPasien() {
  const patients = useApi('/dokter/pasien')
  const [patientId, setPatientId] = useState('')
  const [result, setResult] = useState({ forId: null, data: null, error: null })

  useEffect(() => {
    if (!patientId) return

    let alive = true

    api
      .get(`/dokter/pasien/${patientId}/rekam-medis`)
      .then((response) => {
        if (alive) {
          setResult({ forId: patientId, data: response.data, error: null })
        }
      })
      .catch((requestError) => {
        if (alive) {
          setResult({ forId: patientId, data: null, error: requestError.message })
        }
      })

    return () => {
      alive = false
    }
  }, [patientId])

  const loading = Boolean(patientId) && result.forId !== patientId
  const error = result.forId === patientId ? result.error : null
  const detail = result.forId === patientId ? result.data : null

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Riwayat Pasien"
        subtitle="Pilih pasien untuk melihat seluruh rekam medisnya."
      >
        <Field label="Pasien">
          <select
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            style={{ ...ui.input, maxWidth: 360 }}
          >
            <option value="">Pilih pasien</option>
            {(patients.data?.data ?? []).map((patient) => (
              <option key={patient.patient_id} value={patient.patient_id}>
                {patient.name} — {patient.nik ?? '-'}
              </option>
            ))}
          </select>
        </Field>

        {patients.loading && <Loading />}
        <ErrorNote message={patients.error || error} onRetry={patients.reload} />
        {loading && <Loading text="Memuat rekam medis..." />}

        {!patients.loading && (patients.data?.data ?? []).length === 0 && (
          <Empty text="Belum ada pasien yang pernah Anda tangani." />
        )}
      </Card>

      {detail && (
        <Card
          title={detail.patient?.name}
          subtitle={`NIK ${detail.patient?.nik ?? '-'} · ${detail.patient?.gender ?? '-'} · Gol. darah ${detail.patient?.blood_type ?? '-'}`}
        >
          {detail.registrations.length === 0 && <Empty text="Pasien belum memiliki riwayat kunjungan." />}

          <div style={{ display: 'grid', gap: 12 }}>
            {detail.registrations.map((row) => (
              <div key={row.registration_id} style={styles.historyCard}>
                <div style={{ ...ui.row, justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: '#132A25' }}>{row.polyclinics?.name}</strong>
                    <p style={ui.muted}>
                      {formatDateTime(row.registration_date)} · {row.doctors?.name}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </div>

                {row.complaint && <p style={{ ...ui.muted, marginTop: 6 }}>Keluhan: {row.complaint}</p>}

                {row.medical_records ? (
                  <div style={styles.recordBox}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#2F8F7E' }}>
                      DIAGNOSIS
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#132A25' }}>
                      {row.medical_records.diagnosis ?? '-'}
                    </p>
                    {row.medical_records.symptoms && (
                      <p style={ui.muted}>Gejala: {row.medical_records.symptoms}</p>
                    )}
                    {row.medical_records.treatment && (
                      <p style={ui.muted}>Tindakan: {row.medical_records.treatment}</p>
                    )}
                    {row.medical_records.prescriptions?.length > 0 && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: '#374942' }}>
                        {row.medical_records.prescriptions.map((prescription) => (
                          <li key={prescription.prescription_id}>
                            {prescription.medicines?.name} — {prescription.quantity}{' '}
                            {prescription.medicines?.unit ?? ''} ({prescription.dosage ?? '-'})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p style={{ ...ui.muted, marginTop: 6 }}>Belum ada catatan pemeriksaan.</p>
                )}
              </div>
            ))}
          </div>

          {detail.patient?.birth_date && (
            <p style={{ ...ui.muted, marginTop: 14 }}>
              Tanggal lahir: {formatDate(detail.patient.birth_date)} · Alamat:{' '}
              {detail.patient.address ?? '-'}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

const styles = {
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
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    border: '1px solid #E3ECE9',
    borderRadius: 12,
    padding: 12,
    background: '#FBFDFC',
  },
  queueNumber: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    padding: '6px 10px',
    borderRadius: 10,
    background: '#12352F',
  },
  grid2: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  prescriptionRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 10,
    border: '1px dashed #D7E1DE',
    borderRadius: 10,
    background: '#FBFDFC',
  },
  notice: {
    background: '#EEF6F3',
    border: '1px solid #BFE0D5',
    color: '#22695C',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    margin: 0,
  },
  historyCard: {
    border: '1px solid #E3ECE9',
    borderRadius: 12,
    padding: 14,
  },
  recordBox: {
    background: '#F6FAF9',
    border: '1px solid #E3ECE9',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
}
