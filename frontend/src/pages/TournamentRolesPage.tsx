import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/StateMessage'
import { RoleManager } from '@/features/tournaments/components/RoleManager'

export function TournamentRolesPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)

  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
    return <ErrorState message="Torneo inválido." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de roles</CardTitle>
          <CardDescription>
            Designa árbitros y delegados por correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleManager tournamentId={tournamentId} />
        </CardContent>
      </Card>
    </div>
  )
}
