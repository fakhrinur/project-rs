import { useState } from "react";

/**
 * Dashboard Petugas — Sistem Manajemen Rumah Sakit
 * -------------------------------------------------
 * Ditampilkan setelah petugas berhasil login.
 *
 * CARA PAKAI:
 * 1. Simpan sebagai src/Pages/DashboardPetugas.jsx
 * 2. Daftarkan route-nya di App.jsx, contoh:
 *      <Route path="/dashboard/petugas" element={<DashboardPetugas namaPetugas="Siti Rahma" />} />
 * 3. Ganti data `MENU_ITEMS` dan konten tiap menu sesuai kebutuhan nyata
 *    (mis. hasil fetch dari API data pasien, pendaftaran, dsb).
 */

const MENU_ITEMS = [
  { id: "data-pasien", label: "Data Pasien", icon: "users" },
  { id: "pendaftaran", label: "Pendaftaran", icon: "clipboard" },
  { id: "antrean", label: "Antrean", icon: "queue" },
  { id: "jadwal-dokter", label: "Jadwal Dokter", icon: "calendar" },
];

const ICONS = {
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 8.5C16.1 8.5 17 7.6 17 6.5C17 5.4 16.1 4.5 15 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 14.5C18.3 15 20 16.7 20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  queue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 19c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 19c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const CONTENT = {
  "data-pasien": {
    title: "Data Pasien",
    body: "Kelola data pasien: cari, tambah, dan perbarui data pribadi maupun data rekam medis dasar. Hubungkan bagian ini ke endpoint /api/pasien.",
  },
  pendaftaran: {
    title: "Pendaftaran",
    body: "Daftarkan kunjungan pasien baru: pilih poli, dokter, dan jadwal. Setelah submit, kirim data ke /api/pendaftaran.",
  },
  antrean: {
    title: "Antrean",
    body: "Pantau dan kelola antrean seluruh poli hari ini, termasuk memanggil nomor antrean berikutnya. Ambil data dari /api/antrean.",
  },
  "jadwal-dokter": {
    title: "Jadwal Dokter",
    body: "Lihat dan atur jadwal praktik seluruh dokter per poli dan hari, diambil dari /api/jadwal.",
  },
};

export default function DashboardPetugas({ namaPetugas = "Petugas" }) {
  const [activeMenu, setActiveMenu] = useState("data-pasien");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const active = CONTENT[activeMenu];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .menu-item { transition: background-color .15s ease, color .15s ease; }
        .menu-item:hover { background: rgba(255,255,255,0.08); }
        @media (max-width: 760px) {
          .sidebar { position: fixed; z-index: 20; height: 100%; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .menu-toggle { display: inline-flex !important; }
        }
      `}</style>

      <aside className="sidebar" style={{ ...styles.sidebar, ...(sidebarOpen ? { transform: "translateX(0)" } : {}) }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.crossMark} aria-hidden="true">
            <span style={styles.crossV} />
            <span style={styles.crossH} />
          </div>
          <div>
            <p style={styles.roleLabel}>Petugas</p>
            <p style={styles.userName}>{namaPetugas}</p>
          </div>
        </div>

        <p style={styles.navHeading}>Dashboard</p>
        <nav>
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === activeMenu;
            return (
              <button
                key={item.id}
                className="menu-item"
                onClick={() => {
                  setActiveMenu(item.id);
                  setSidebarOpen(false);
                }}
                style={{
                  ...styles.menuButton,
                  ...(isActive ? styles.menuButtonActive : {}),
                }}
              >
                <span style={{ color: isActive ? "#5FBFA9" : "#9FC0B8" }}>{ICONS[item.icon]}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <button style={styles.logoutBtn} type="button">
          Keluar
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.topBar}>
          <button
            className="menu-toggle"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen((v) => !v)}
            style={styles.menuToggle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20" stroke="#132A25" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="#132A25" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 18H20" stroke="#132A25" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <h1 style={styles.pageTitle}>{active.title}</h1>
            <p style={styles.pageSubtitle}>Selamat bertugas, {namaPetugas}.</p>
          </div>
        </header>

        <section style={styles.contentCard}>
          <p style={styles.contentBody}>{active.body}</p>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Manrope', sans-serif",
    background: "#F4F7F6",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: "#12352F",
    color: "#EAF3F0",
    padding: "28px 18px",
    display: "flex",
    flexDirection: "column",
    transition: "transform .2s ease",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  crossMark: {
    position: "relative",
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  crossV: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 3,
    height: 22,
    background: "#5FBFA9",
    transform: "translateX(-50%)",
    borderRadius: 2,
  },
  crossH: {
    position: "absolute",
    top: "50%",
    left: 0,
    height: 3,
    width: 22,
    background: "#5FBFA9",
    transform: "translateY(-50%)",
    borderRadius: 2,
  },
  roleLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: "#7FB8AB",
  },
  userName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
  },
  navHeading: {
    fontSize: 12,
    fontWeight: 700,
    color: "#7FB8AB",
    margin: "0 0 10px 4px",
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    marginBottom: 4,
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: "#D3E6E0",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'Manrope', sans-serif",
    cursor: "pointer",
    textAlign: "left",
  },
  menuButtonActive: {
    background: "rgba(95, 191, 169, 0.16)",
    color: "#FFFFFF",
    fontWeight: 700,
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "10px 12px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 8,
    color: "#EAF3F0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    minWidth: 0,
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  menuToggle: {
    display: "none",
    border: "1px solid #D7E1DE",
    background: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#132A25",
    margin: "0 0 4px 0",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#5C6B67",
    margin: 0,
  },
  contentCard: {
    background: "#FFFFFF",
    border: "1px solid #E3ECE9",
    borderRadius: 14,
    padding: 28,
    maxWidth: 640,
  },
  contentBody: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#374942",
    margin: 0,
  },
};