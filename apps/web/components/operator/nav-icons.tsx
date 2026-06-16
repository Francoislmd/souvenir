export function DashboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="11" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="15" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SessionsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 13a7.97 7.97 0 0 0 0-2l1.9-1.5-2-3.4-2.2.9a8 8 0 0 0-1.7-1L15 3.6h-4l-.4 2.4a8 8 0 0 0-1.7 1l-2.2-.9-2 3.4L6.6 11a7.97 7.97 0 0 0 0 2l-1.9 1.5 2 3.4 2.2-.9c.5.4 1.1.8 1.7 1L11 20.4h4l.4-2.4c.6-.2 1.2-.6 1.7-1l2.2.9 2-3.4-1.9-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
