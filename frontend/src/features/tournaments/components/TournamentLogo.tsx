import { cn, gradientFor } from '@/lib/utils'

interface TournamentLogoProps {
  name: string
  logoUrl?: string | null
  /** Extra seed entropy (e.g. tournament id) for the gradient fallback. */
  seed?: string | number
  className?: string
}

/**
 * Renders the tournament logo, or a deterministic gradient block with the
 * tournament initial when no logo exists.
 */
export function TournamentLogo({
  name,
  logoUrl,
  seed,
  className,
}: TournamentLogoProps) {
  const base =
    'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md'

  if (logoUrl) {
    return (
      <div className={cn(base, className)}>
        <img
          src={logoUrl}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const gradient = gradientFor(`${seed ?? ''}${name}`)

  return (
    <div
      className={cn(
        base,
        'bg-gradient-to-br font-semibold text-white',
        gradient,
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}
