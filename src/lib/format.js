export function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value) {
  if (!value) return '-'

  if (typeof value === 'string' && value.includes('T')) {
    return value.slice(11, 16)
  }

  return String(value).slice(0, 5)
}

export function formatRupiah(value) {
  const number = Number(value ?? 0)

  return number.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000

  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}
