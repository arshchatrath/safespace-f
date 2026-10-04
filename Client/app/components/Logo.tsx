// SafeSpace mark: a soft enclosure with a resting dot — a "space" holding something small and safe.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M16 3.5c7.6 0 12.5 4.6 12.5 12.3 0 7.9-5.1 12.7-12.5 12.7S3.5 23.7 3.5 15.8C3.5 8.1 8.4 3.5 16 3.5Z"
        fill="currentColor"
      />
      <circle cx="19.5" cy="18.5" r="4" fill="#D9774B" />
    </svg>
  )
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7 text-pine" />
      <span className="font-display text-[1.35rem] font-medium leading-none tracking-tight">
        SafeSpace<span className="text-clay">.</span>
      </span>
    </span>
  )
}
