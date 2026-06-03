import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, Crown, Pencil, RotateCcw, UserCog } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/StateMessage'
import { cn } from '@/lib/utils'
import { useUpdateTeamPlayer } from '../api/useRoster'
import type { TeamPlayer } from '../types'

interface RosterTableProps {
  players: TeamPlayer[]
  teamId: number
  /** Tournament slug — used to build the per-player edit link. */
  tournamentSlug?: string
  /** When true, the organizer can reject/re-accept players from the row. */
  canModerate?: boolean
  /** When true (organizer or owner delegate), the row shows an edit button. */
  canEdit?: boolean
}

export function RosterTable({
  players,
  teamId,
  tournamentSlug,
  canModerate = false,
  canEdit = false,
}: RosterTableProps) {
  const updatePlayer = useUpdateTeamPlayer(teamId)
  const [rejectTarget, setRejectTarget] = useState<TeamPlayer | null>(null)
  const [reason, setReason] = useState('')

  if (players.length === 0) {
    return (
      <EmptyState
        title="Plantilla vacía"
        description="Aún no hay jugadores en este equipo."
      />
    )
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    const trimmed = reason.trim()
    if (trimmed === '') {
      toast.error('Indica el motivo del rechazo.')
      return
    }
    try {
      await updatePlayer.mutateAsync({
        teamPlayerId: rejectTarget.id,
        payload: { status: 'rejected', rejection_reason: trimmed },
      })
      toast.success('Jugador rechazado')
      setRejectTarget(null)
      setReason('')
    } catch {
      toast.error('No se pudo rechazar el jugador')
    }
  }

  const reaccept = async (player: TeamPlayer) => {
    try {
      await updatePlayer.mutateAsync({
        teamPlayerId: player.id,
        payload: { status: 'active' },
      })
      toast.success('Jugador readmitido')
    } catch {
      toast.error('No se pudo readmitir el jugador')
    }
  }

  return (
    <>
      <ul className="divide-y rounded-md border">
        {players.map((p) => {
          const rejected = p.status === 'rejected'
          return (
            <li
              key={p.id}
              className={cn(
                'flex items-center gap-3 p-3',
                rejected && 'bg-destructive/5',
              )}
            >
              <Avatar className="size-10 shrink-0">
                {p.photo_url ? (
                  <AvatarImage src={p.photo_url} alt={p.full_name} />
                ) : null}
                <AvatarFallback>
                  {p.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Dorsal */}
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  p.shirt_number != null
                    ? 'bg-muted'
                    : 'text-muted-foreground border border-dashed',
                )}
                aria-label="Dorsal"
              >
                {p.shirt_number ?? '—'}
              </span>

              {/* Nombre + cédula */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium">
                    {p.full_name}
                  </span>
                  {p.is_captain === 1 ? (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                      <Crown className="size-3" />
                    </Badge>
                  ) : null}
                  {p.is_delegate === 1 ? (
                    <Badge variant="outline" className="gap-1 px-1.5 py-0">
                      <UserCog className="size-3" />
                    </Badge>
                  ) : null}
                  {rejected ? (
                    <Badge variant="destructive" className="gap-1 px-1.5 py-0">
                      <Ban className="size-3" />
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  Cédula {p.document_id}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex shrink-0 items-center gap-1">
                {canModerate ? (
                  rejected ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Readmitir jugador"
                      title="Readmitir"
                      onClick={() => reaccept(p)}
                      disabled={updatePlayer.isPending}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Rechazar jugador"
                      title="Rechazar"
                      onClick={() => {
                        setRejectTarget(p)
                        setReason('')
                      }}
                    >
                      <Ban className="text-destructive size-4" />
                    </Button>
                  )
                ) : null}

                {canEdit && tournamentSlug ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/t/${tournamentSlug}/teams/${teamId}/players/${p.id}/edit`}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </Link>
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar jugador</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo de{' '}
              <strong>{rejectTarget?.full_name}</strong>. El delegado verá este
              motivo. Puedes readmitirlo después.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. La cédula no coincide con el jugador."
            rows={3}
            maxLength={255}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null)
                setReason('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updatePlayer.isPending}
            >
              Rechazar jugador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
