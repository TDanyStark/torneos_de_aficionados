import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useTeam } from '@/features/teams/api/useTeams'
import { useRoster } from '@/features/teams/api/useRoster'
import { RosterTable } from '@/features/teams/components/RosterTable'
import { TeamStatusBadge } from '@/features/teams/components/TeamStatusBadge'
import { useAuthStore } from '@/stores/authStore'

export function TeamDetailPage() {
  const { slug, teamId } = useParams<{ slug: string; teamId: string }>()
  const id = Number(teamId)

  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id ?? 0
  const team = useTeam(tournamentId, id)
  const roster = useRoster(id)

  // Single entry point for "my team": this public view detects whether the
  // current user manages THIS team — the owner delegate (delegate role bound to
  // this team) or an organizer of the tournament — and surfaces a "Gestionar"
  // shortcut instead of forcing a separate URL.
  const roles = useAuthStore((s) => s.roles)
  const userId = useAuthStore((s) => s.user?.id)
  const canManage =
    roles.some(
      (r) =>
        r.tournament_id === tournamentId &&
        ((r.role === 'delegate' && r.team_id === id) ||
          r.role === 'organizer'),
    ) ||
    (team.data?.delegate_user_id != null &&
      team.data.delegate_user_id === userId)

  useDocumentTitle(team.data?.name)

  if (tournament.isError || team.isError) {
    return <ErrorState message="Equipo no encontrado." />
  }

  // Single place for "my team": a manager (owner delegate or organizer) is sent
  // straight to the management surface instead of the public roster view.
  if (canManage) {
    return <Navigate to={`/t/${slug}/teams/${id}/manage`} replace />
  }

  const loading = tournament.isLoading || team.isLoading

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/t/${slug}?tab=equipos`}>
          <ArrowLeft className="size-4" />
          Equipos
        </Link>
      </Button>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : !team.data ? (
        <ErrorState message="Equipo no encontrado." />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    {team.data.logo_url ? (
                      <AvatarImage
                        src={team.data.logo_url}
                        alt={team.data.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      <Shield className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{team.data.name}</CardTitle>
                    {team.data.short_name ? (
                      <p className="text-muted-foreground text-sm">
                        {team.data.short_name}
                      </p>
                    ) : null}
                  </div>
                </div>
                <TeamStatusBadge status={team.data.status} />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantilla</CardTitle>
            </CardHeader>
            <CardContent>
              {roster.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : roster.isError ? (
                <ErrorState message="No se pudo cargar la plantilla." />
              ) : (
                <RosterTable players={roster.data ?? []} teamId={id} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
