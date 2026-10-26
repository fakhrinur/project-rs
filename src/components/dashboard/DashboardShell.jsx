import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import Icon from './icons'
import { colors } from './ui'

export default function DashboardShell({
  roleLabel,
  title,
  subtitle,
  menus,
  activeMenu,
  onMenuChange,
  children,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const selectMenu = (id) => {
    onMenuChange(id)
    setSidebarOpen(false)
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes rs-spin { to { transform: rotate(360deg); } }
        .menu-item { transition: background-color .15s ease, color .15s ease; }
        .menu-item:hover { background: rgba(255,255,255,0.08); }
        .hover-row:hover { background: #F8FBFA; }
        @media (max-width: 860px) {
          .sidebar { position: fixed; z-index: 30; height: 100%; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .menu-toggle { display: inline-flex !important; }
          .dash-main { padding: 20px 16px !important; }
        }
      `}</style>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          style={styles.backdrop}
        />
      )}

      <aside
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        style={styles.sidebar}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.crossMark} aria-hidden="true">
            <span style={styles.crossV} />
            <span style={styles.crossH} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={styles.roleLabel}>{roleLabel}</p>
            <p style={styles.userName}>{user?.nama ?? user?.username ?? '-'}</p>
          </div>
        </div>

        <p style={styles.navHeading}>Dashboard</p>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {menus.map((item) => {
            const isActive = item.id === activeMenu

            return (
              <button
                key={item.id}
                type="button"
                className="menu-item"
                onClick={() => selectMenu(item.id)}
                style={{
                  ...styles.menuButton,
                  ...(isActive ? styles.menuButtonActive : {}),
                }}
              >
                <span style={{ color: isActive ? colors.accent : '#9FC0B8', display: 'flex' }}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
          <Icon name="logout" />
          Keluar
        </button>
      </aside>

      <main className="dash-main" style={styles.main}>
        <header style={styles.topBar}>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen((value) => !value)}
            style={styles.menuToggle}
          >
            <Icon name="menu" size={20} />
          </button>
          <div>
            <h1 style={styles.pageTitle}>{title}</h1>
            <p style={styles.pageSubtitle}>{subtitle}</p>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: colors.bg,
    fontFamily: "'Manrope', sans-serif",
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 24, 21, 0.45)',
    zIndex: 25,
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: colors.brand,
    color: '#EAF3F0',
    padding: '28px 18px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform .2s ease',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 26,
    paddingBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  crossMark: {
    position: 'relative',
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  crossV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 3,
    height: 22,
    background: colors.accent,
    transform: 'translateX(-50%)',
    borderRadius: 2,
  },
  crossH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 3,
    width: 22,
    background: colors.accent,
    transform: 'translateY(-50%)',
    borderRadius: 2,
  },
  roleLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: '#7FB8AB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  userName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  navHeading: {
    fontSize: 12,
    fontWeight: 700,
    color: '#7FB8AB',
    margin: '0 0 10px 4px',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    marginBottom: 4,
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#D3E6E0',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'Manrope', sans-serif",
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuButtonActive: {
    background: 'rgba(95, 191, 169, 0.16)',
    color: '#FFFFFF',
    fontWeight: 700,
  },
  logoutBtn: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 8,
    color: '#EAF3F0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '30px 36px 48px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 22,
  },
  menuToggle: {
    display: 'none',
    border: `1px solid ${colors.lineSoft}`,
    background: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.ink,
  },
  pageTitle: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 26,
    fontWeight: 700,
    color: colors.ink,
    margin: '0 0 4px 0',
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.muted,
    margin: 0,
  },
}
