import { Link } from 'react-router-dom'
import { Settings2, Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import type { Team } from '../types'
import { TeamStatusBadge } from './TeamStatusBadge'

interface TeamCardProps {
  team: Team
  /** Tournament slug used to build the public detail link. */
  tournamentSlug: string
  /** Tournament id, used to resolve the current user's per-tournament role. */
  tournamentId: number
}

export function TeamCard({ team, tournamentSlug, tournamentId }: TeamCardProps) {
  // Detect whether the current user manages THIS team — the owner delegate
  // (delegate role bound to this team) or an organizer of the tournament. If so,
  // there is no separate public roster page for them: the card links straight to
  // the management surface ("my team" is a single place).
  const roles = useAuthStore((s) => s.roles)
  const userId = useAuthStore((s) => s.user?.id)
  const isMyTeam =
    roles.some(
      (r) =>
        r.tournament_id === tournamentId &&
        r.role === 'delegate' &&
        r.team_id === team.id,
    ) || (team.delegate_user_id != null && team.delegate_user_id === userId)
  const isOrganizer = roles.some(
    (r) => r.tournament_id === tournamentId && r.role === 'organizer',
  )
  const canManage = isMyTeam || isOrganizer

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              {team.logo_url ? (
                <AvatarImage src={team.logo_url} alt={team.name} />
              ) : null}
              <AvatarFallback>
                <Shield className="size-4" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-base">{team.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isMyTeam ? <Badge variant="secondary">Mi equipo</Badge> : null}
            <TeamStatusBadge status={team.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        {team.short_name ? <p>Abreviatura: {team.short_name}</p> : null}
      </CardContent>
      <CardFooter>
        {canManage ? (
          <Link
            to={`/t/${tournamentSlug}/teams/${team.id}/manage`}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <Settings2 className="size-4" />
            Gestionar equipo →
          </Link>
        ) : (
          <Link
            to={`/t/${tournamentSlug}/equipo/${team.id}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Ver plantilla →
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
