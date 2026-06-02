import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, Info, LogIn, Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/StateMessage'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { SelfRegistrationForm } from '@/features/teams/components/SelfRegistrationForm'
import { apiClient } from '@/lib/apiClient'
import { tournamentKeys } from '@/features/tournaments/api/useTournaments'
import type { Tournament } from '@/features/tournaments/types'
import { useAuthStore } from '@/stores/authStore'
import type { Registration } from '@/features/teams/types'

/**
 * Public self-registration page reached from a shared organizer link.
 *
 * The link carries BOTH the tournament id and the registration code
 * (/inscripcion/:tournamentId/:registrationCode) because the backend
 * POST /tournaments/{id}/registrations requires the tournament id and there
 * is no public endpoint to resolve a code → tournament. The legacy
 * /inscripcion/:registrationCode route renders an "incomplete link" notice.
 *
 * The page is top-level (no auth guard) so anyone can open it, but submitting
 * requires being logged in; otherwise we prompt login and return here.
 */
export function SelfRegistrationPage() {
  const { tournamentId, registrationCode } = useParams<{
    tournamentId?: string
    registrationCode: string
  }>()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const [done, setDone] = useState<Registration | null>(null)

  const numericTournamentId = Number(tournamentId)
  const hasTournamentContext =
    Boolean(tournamentId) &&
    Number.isFinite(numericTournamentId) &&
    numericTournamentId > 0

  // The /tournaments/by-id/{id} endpoint is authed, so we only fetch the
  // tournament (to surface registration_info) once the user is logged in.
  const tournamentQuery = useQuery({
    queryKey: [...tournamentKeys.all, 'by-id', numericTournamentId],
    enabled: hasTournamentContext && Boolean(token),
    queryFn: () =>
      apiClient.get<Tournament>(`/tournaments/by-id/${numericTournamentId}`),
  })

  const registrationInfo = tournamentQuery.data?.registration_info?.trim()

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Trophy className="text-brand size-5" />
            <span>Torneos</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {!hasTournamentContext ? (
          <ErrorState message="El enlace de inscripción está incompleto. Pide al organizador que comparta el enlace completo del torneo." />
        ) : done ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mb-2 flex justify-center">
                <CheckCircle2 className="size-10 text-emerald-500" />
              </div>
              <CardTitle>¡Inscripción enviada!</CardTitle>
              <CardDescription>
                Tu equipo «{done.team_name}» quedó en revisión. El organizador
                la aprobará o rechazará pronto.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/">Ir al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !token ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Inicia sesión para inscribirte</CardTitle>
              <CardDescription>
                Necesitas una cuenta para inscribir tu equipo. Inicia sesión o
                regístrate y volverás aquí automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link
                  to="/login"
                  state={{ from: location.pathname + location.search }}
                >
                  <LogIn className="size-4" />
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to="/register"
                  state={{ from: location.pathname + location.search }}
                >
                  Crear cuenta
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inscribe tu equipo</CardTitle>
              <CardDescription>
                Completa los datos del equipo. Opcionalmente puedes inscribirte
                también como jugador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrationInfo ? (
                <div className="bg-muted/50 text-muted-foreground mb-5 flex gap-3 rounded-md border p-3 text-sm">
                  <Info className="text-brand mt-0.5 size-4 shrink-0" />
                  <p className="whitespace-pre-line">{registrationInfo}</p>
                </div>
              ) : null}
              <SelfRegistrationForm
                tournamentId={numericTournamentId}
                registrationCode={registrationCode ?? ''}
                onSuccess={setDone}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
