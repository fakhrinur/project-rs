import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/**
 * Mengambil data dari API dan menyediakan state loading/error + reload.
 * `path` contoh: "/pasien/antrean?date=2026-10-26"
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true

    api
      .get(path)
      .then((response) => {
        if (alive) setState({ data: response, loading: false, error: null })
      })
      .catch((error) => {
        if (alive) {
          setState({ data: null, loading: false, error: error.message })
        }
      })

    return () => {
      alive = false
    }
  }, [path, version])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }))
    setVersion((value) => value + 1)
  }, [])

  return { ...state, reload }
}
