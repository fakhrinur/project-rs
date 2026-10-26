/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  api,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [initializing, setInitializing] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return

    let alive = true

    api
      .get('/auth/me')
      .then((response) => {
        if (!alive) return
        setUser(response.user)
        setStoredUser(response.user)
      })
      .catch(() => {
        if (!alive) return
        setToken(null)
        setStoredUser(null)
        setUser(null)
      })
      .finally(() => {
        if (alive) setInitializing(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials)

    setToken(response.token)
    setStoredUser(response.user)
    setUser(response.user)

    return response.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, initializing, login, logout }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  }

  return context
}
