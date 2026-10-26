/* eslint-disable react-refresh/only-export-components */
export const colors = {
  brand: '#12352F',
  accent: '#5FBFA9',
  accentDark: '#2F8F7E',
  ink: '#132A25',
  muted: '#5C6B67',
  line: '#E3ECE9',
  lineSoft: '#D7E1DE',
  bg: '#F4F7F6',
  danger: '#C0533B',
}

export const ui = {
  card: {
    background: '#FFFFFF',
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    padding: 20,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.lineSoft}`,
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    color: colors.ink,
    background: '#FBFDFC',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Source Serif 4', serif",
    fontSize: 18,
    fontWeight: 700,
    color: colors.ink,
    margin: '0 0 4px 0',
  },
  muted: {
    fontSize: 13,
    color: colors.muted,
    margin: 0,
    lineHeight: 1.6,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
}

const STATUS_STYLES = {
  menunggu: { background: '#FFF4E0', color: '#946200' },
  dipanggil: { background: '#E7F1FF', color: '#1F5FA8' },
  diperiksa: { background: '#EAF6F2', color: '#237363' },
  selesai: { background: '#E8F5EA', color: '#2E7D32' },
  batal: { background: '#FBEAE7', color: '#B2402A' },
  lunas: { background: '#E8F5EA', color: '#2E7D32' },
  belum_bayar: { background: '#FFF4E0', color: '#946200' },
}

export function Badge({ children }) {
  const tone = STATUS_STYLES[children] ?? { background: '#EEF3F1', color: colors.muted }

  return (
    <span
      style={{
        ...tone,
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {String(children ?? '-').replace('_', ' ')}
    </span>
  )
}

export function Card({ title, subtitle, actions, children, style }) {
  return (
    <section style={{ ...ui.card, ...style }}>
      {(title || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: children ? 16 : 0,
            flexWrap: 'wrap',
          }}
        >
          <div>
            {title && <h3 style={ui.title}>{title}</h3>}
            {subtitle && <p style={ui.muted}>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Button({ children, variant = 'primary', style, ...props }) {
  const variants = {
    primary: {
      background: colors.brand,
      color: '#FFFFFF',
      border: '1px solid transparent',
    },
    accent: {
      background: colors.accentDark,
      color: '#FFFFFF',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'transparent',
      color: colors.brand,
      border: `1px solid ${colors.lineSoft}`,
    },
    danger: {
      background: 'transparent',
      color: colors.danger,
      border: '1px solid #EBD3CD',
    },
  }

  return (
    <button
      type="button"
      style={{
        padding: '9px 14px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "'Manrope', sans-serif",
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function Loading({ text = 'Memuat data...' }) {
  return (
    <div style={{ ...ui.row, padding: '22px 0', color: colors.muted, fontSize: 13 }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${colors.lineSoft}`,
          borderTopColor: colors.accentDark,
          display: 'inline-block',
          animation: 'rs-spin .8s linear infinite',
        }}
      />
      {text}
    </div>
  )
}

export function ErrorNote({ message, onRetry }) {
  if (!message) return null

  return (
    <div
      style={{
        background: '#FDF2F0',
        border: '1px solid #F1D5CF',
        color: '#8E3B27',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="danger" onClick={onRetry} style={{ padding: '6px 10px' }}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}

export function Empty({ text = 'Belum ada data.' }) {
  return (
    <div
      style={{
        padding: '26px 18px',
        textAlign: 'center',
        color: colors.muted,
        fontSize: 13,
        background: '#F8FBFA',
        border: `1px dashed ${colors.lineSoft}`,
        borderRadius: 10,
      }}
    >
      {text}
    </div>
  )
}

export function Field({ label, htmlFor, children, style }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', ...style }}>
      <span style={ui.label}>{label}</span>
      {children}
    </label>
  )
}

export function Table({ columns, rows, empty = 'Belum ada data.' }) {
  if (!rows || rows.length === 0) return <Empty text={empty} />

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          minWidth: 620,
          borderCollapse: 'collapse',
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderBottom: `1px solid ${colors.line}`,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: colors.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key ?? row.id ?? index} className="hover-row">
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #F0F5F3',
                    color: '#374942',
                    verticalAlign: 'middle',
                  }}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
