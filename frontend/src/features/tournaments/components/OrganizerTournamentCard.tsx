import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Eye,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Tournament } from '../types'
import {
  useDeleteTournament,
  useSetTournamentFiled,
  useTournamentDeletionImpact,
} from '../api/useTournaments'
import { TournamentStatusBadge } from './TournamentStatusBadge'
import { TournamentLogo } from './TournamentLogo'

export function OrganizerTournamentCard({
  tournament,
  archived = false,
}: {
  tournament: Tournament
  /** When true the card is rendered in the "Archivados" view (shows Restaurar). */
  archived?: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const setFiled = useSetTournamentFiled()
  const deleteTournament = useDeleteTournament()
  // Only fetch the impact preview while the confirm dialog is open.
  const impact = useTournamentDeletionImpact(
    confirmOpen ? tournament.id : undefined,
  )

  const copyShareLink = async () => {
    // Single shareable link: the public tournament hub. Anyone with it can see
    // the tournament and (if registrations are open) inscribe their team.
    const link = `${window.location.origin}/t/${tournament.slug}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Enlace del torneo copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const onArchive = async () => {
    try {
      await setFiled.mutateAsync({ id: tournament.id, filed: true })
      toast.success('Torneo archivado')
    } catch {
      toast.error('No se pudo archivar el torneo')
    }
  }

  const onRestore = async () => {
    try {
      await setFiled.mutateAsync({ id: tournament.id, filed: false })
      toast.success('Torneo restaurado')
    } catch {
      toast.error('No se pudo restaurar el torneo')
    }
  }

  const onDelete = async () => {
    try {
      await deleteTournament.mutateAsync(tournament.id)
      toast.success('Torneo eliminado')
      setConfirmOpen(false)
    } catch {
      toast.error('No se pudo eliminar el torneo')
    }
  }

  const counts = impact.data?.impact

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <TournamentLogo
              name={tournament.name}
              logoUrl={tournament.logo_url}
              seed={tournament.id}
            />
            <CardTitle className="text-base">{tournament.name}</CardTitle>
          </div>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        <p className="line-clamp-2">
          {tournament.description ?? 'Sin descripción'}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/t/${tournament.slug}`}>
            <Eye className="size-4" />
            Ver torneo
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/t/${tournament.slug}/edit`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={copyShareLink}>
          <Share2 className="size-4" />
          Compartir
        </Button>

        {archived ? (
          <Button
            variant="outline"
            size="sm"
            disabled={setFiled.isPending}
            onClick={onRestore}
          >
            <ArchiveRestore className="size-4" />
            Restaurar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={setFiled.isPending}
            onClick={onArchive}
          >
            <Archive className="size-4" />
            Archivar
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          Eliminar
        </Button>
      </CardFooter>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{tournament.name}»?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Esta acción es irreversible. Se borrará{' '}
                  <strong>todo</strong> lo asociado al torneo: equipos, partidos,
                  goles y tarjetas, inscripciones, y las fotos de equipos y
                  jugadores.
                </p>
                {impact.isLoading ? (
                  <p className="text-muted-foreground text-sm">
                    Calculando lo que se eliminará…
                  </p>
                ) : counts ? (
                  <ul className="text-muted-foreground list-inside list-disc text-sm">
                    <li>{counts.teams} equipo(s)</li>
                    <li>{counts.players} jugador(es) del roster</li>
                    <li>{counts.matches} partido(s)</li>
                    <li>{counts.events} evento(s) (goles/tarjetas)</li>
                  </ul>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTournament.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void onDelete()
              }}
              disabled={deleteTournament.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteTournament.isPending ? 'Eliminando…' : 'Eliminar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
