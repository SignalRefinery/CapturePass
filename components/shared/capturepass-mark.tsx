export function CapturePassMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="100%" height="100%" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="capturepass-mark-bg" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B5FFF" />
          <stop offset="1" stopColor="#0F4C81" />
        </linearGradient>
        <linearGradient id="capturepass-mark-ring" x1="6" y1="5" x2="18.5" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5B301" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="2.25" y="2.25" width="19.5" height="19.5" rx="6.5" fill="url(#capturepass-mark-bg)" />
      <path
        d="M7 4.75H5.75A1.5 1.5 0 0 0 4.25 6.25V7.5M4.25 16.5v1.25a1.5 1.5 0 0 0 1.5 1.5H7M17 4.75h1.25a1.5 1.5 0 0 1 1.5 1.5V7.5M19.75 16.5v1.25a1.5 1.5 0 0 1-1.5 1.5H17"
        stroke="url(#capturepass-mark-ring)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.55 8.2A4.9 4.9 0 1 0 14.55 15.8"
        stroke="#FFFFFF"
        strokeOpacity="0.94"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14.65" cy="12" r="1.25" fill="#F5B301" />
    </svg>
  );
}
