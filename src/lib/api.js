const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const TOKEN_KEY = 'rs_token'
const USER_KEY = 'rs_user'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

function parseJson(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Tidak dapat terhubung ke server. Pastikan backend berjalan di port 4000.',
      0,
    )
  }

  const text = await response.text()
  const payload = parseJson(text)

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Permintaan gagal (HTTP ${response.status})`,
      response.status,
    )
  }

  return payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
