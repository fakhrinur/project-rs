import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Pages/login';
import DashboardPasien from './Pages/DashboardPasien';
import DashboardPetugas from './Pages/DashboardPetugas';
import DashboardDokter from './Pages/DashboardDokter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/pasien" element={<DashboardPasien namaPasien="Budi Santoso" />} />
        <Route path="/dashboard/petugas" element={<DashboardPetugas namaPetugas="Siti Rahma" />} />
        <Route path="/dashboard/dokter" element={<DashboardDokter namaDokter="dr. Andi Prasetyo" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;