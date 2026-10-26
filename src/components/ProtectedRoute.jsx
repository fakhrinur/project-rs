import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const HOME_BY_ROLE = {
  pasien: '/dashboard/pasien',
  dokter: '/dashboard/dokter',
  petugas: '/dashboard/petugas',
}

export default function ProtectedRoute({ role, children }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div style={styles.splash}>
        <div style={styles.spinner} />
        <p style={styles.text}>Memeriksa sesi login...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role] ?? '/'} replace />
  }

  return children
}

const styles = {
  splash: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    background: '#F4F7F6',
    fontFamily: "'Manrope', sans-serif",
  },
  spinner: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: '3px solid #D7E1DE',
    borderTopColor: '#2F8F7E',
    animation: 'rs-spin .8s linear infinite',
  },
  text: {
    fontSize: 13,
    color: '#5C6B67',
    margin: 0,
  },
}
