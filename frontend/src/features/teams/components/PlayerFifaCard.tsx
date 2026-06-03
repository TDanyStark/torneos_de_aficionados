import { Crown, ShieldCheck, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamPlayer } from '../types'

interface PlayerFifaCardProps {
  player: TeamPlayer
}

/**
 * FIFA-style player card for the public roster view: a tall card with the shirt
 * number and position in the top-left, captain/delegate markers, a large photo
 * and the player name across the bottom. Purely presentational.
 */
export function PlayerFifaCard({ player }: PlayerFifaCardProps) {
  const initials = player.full_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border shadow-sm',
        'bg-gradient-to-b from-brand/15 via-background to-background',
      )}
    >
      {/* Top-left: shirt number + position */}
      <div className="absolute left-3 top-3 z-10 flex flex-col items-center leading-none">
        <span className="text-2xl font-extrabold tabular-nums">
          {player.shirt_number ?? '--'}
        </span>
        {player.position ? (
          <span className="text-muted-foreground mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {player.position}
          </span>
        ) : null}
      </div>

      {/* Top-right: role markers */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
        {player.is_captain === 1 ? (
          <span
            className="bg-brand text-brand-foreground inline-flex size-6 items-center justify-center rounded-full"
            title="Capitán"
            aria-label="Capitán"
          >
            <Crown className="size-3.5" />
          </span>
        ) : null}
        {player.is_delegate === 1 ? (
          <span
            className="bg-muted text-foreground inline-flex size-6 items-center justify-center rounded-full"
            title="Delegado"
            aria-label="Delegado"
          >
            <UserCog className="size-3.5" />
          </span>
        ) : null}
      </div>

      {/* Photo */}
      <div className="flex flex-1 items-end justify-center pt-8">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.full_name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="text-muted-foreground/40 flex h-full w-full items-center justify-center">
            <span className="text-4xl font-bold">{initials}</span>
          </div>
        )}
      </div>

      {/* Name footer */}
      <div className="bg-brand/90 text-brand-foreground px-2 py-2 text-center">
        <p className="truncate text-sm font-bold uppercase tracking-wide">
          {player.full_name}
        </p>
      </div>

      {/* Decorative crest watermark */}
      <ShieldCheck className="text-brand/5 pointer-events-none absolute -bottom-4 -right-4 size-24" />
    </div>
  )
}
