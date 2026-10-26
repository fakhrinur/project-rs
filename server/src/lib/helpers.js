/**
 * Nomor antrean dihitung per poli untuk satu hari yang sama,
 * diurutkan berdasarkan waktu pendaftaran.
 */
export function attachQueueNumbers(rows) {
  const counters = new Map()
  const sorted = [...rows].sort(
    (a, b) => new Date(a.registration_date) - new Date(b.registration_date),
  )

  const numbers = new Map()

  for (const row of sorted) {
    const next = (counters.get(row.polyclinic_id) ?? 0) + 1
    counters.set(row.polyclinic_id, next)
    numbers.set(row.registration_id, next)
  }

  return rows.map((row) => ({
    ...row,
    queue_no: numbers.get(row.registration_id) ?? null,
  }))
}

/**
 * Rentang waktu satu hari (berdasarkan tanggal lokal server).
 * Input: "2026-10-26" (opsional, default hari ini)
 */
export function dayRange(dateInput) {
  const base = dateInput ? new Date(`${dateInput}T00:00:00`) : new Date()

  if (Number.isNaN(base.getTime())) {
    return null
  }

  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

/** "08:30" -> Date (basis 1970, agar cocok dengan kolom @db.Time) */
export function timeOnly(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hour, minute] = value.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, hour, minute))
}

export function formatTime(value) {
  if (!value) return null
  return new Date(value).toISOString().slice(11, 16)
}
