const icons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  queue: (
    <>
      <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 19c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 19c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9V13L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 8.5C16.1 8.5 17 7.6 17 6.5C17 5.4 16.1 4.5 15 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 14.5C18.3 15 20 16.7 20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3V11C5 14 7.5 16 10 16C12.5 16 15 14 15 11V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 16V18C10 20 11.5 21 13.5 21C16 21 18 19 18 16.5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 3H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 3H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="9" width="19" height="6.5" rx="3.25" transform="rotate(-45 12 12.25)" stroke="currentColor" strokeWidth="2" />
      <path d="M9.2 15.3L14.8 9.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4H6a2 2 0 00-2 2v12a2 2 0 002 2h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 10-2.5 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 5v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  check: (
    <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  close: (
    <>
      <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
}

export default function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name] ?? null}
    </svg>
  )
}
