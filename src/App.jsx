import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/AuthContext'
import DashboardDokter from './Pages/DashboardDokter'
import DashboardPasien from './Pages/DashboardPasien'
import DashboardPetugas from './Pages/DashboardPetugas'
import Login from './Pages/login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard/pasien"
            element={
              <ProtectedRoute role="pasien">
                <DashboardPasien />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/petugas"
            element={
              <ProtectedRoute role="petugas">
                <DashboardPetugas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/dokter"
            element={
              <ProtectedRoute role="dokter">
                <DashboardDokter />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
