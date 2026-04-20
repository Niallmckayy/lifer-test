export default function BirdLogo({ className = '', size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 28 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="13" cy="14" rx="8" ry="5.5" fill="currentColor" />
      {/* Head */}
      <circle cx="20" cy="9" r="4.5" fill="currentColor" />
      {/* Beak */}
      <polygon points="24.5,8 28,9.2 24.5,10.4" fill="currentColor" />
      {/* Eye */}
      <circle cx="21.5" cy="8.2" r="1" fill="#0e0b07" />
      {/* Tail */}
      <polygon points="5.5,13.5 1,10 5,16.5" fill="currentColor" />
      {/* Wing hint */}
      <path d="M10 11.5 Q14 9 18 11" stroke="#0e0b07" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Legs */}
      <line x1="12" y1="19.5" x2="10" y2="22" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14.5" y1="19.5" x2="16.5" y2="22" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
