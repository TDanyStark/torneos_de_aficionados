import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, Crown, RotateCcw, Shield, Trash2, UserCog } from 'lucide-react'
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
import { ImageUploader } from '@/components/shared/ImageUploader'
import { EmptyState } from '@/components/shared/StateMessage'
import { cn } from '@/lib/utils'
import {
  useUpdateTeamPlayer,
  useUploadTeamPlayerPhoto,
} from '../api/useRoster'
import type { TeamPlayer } from '../types'

interface RosterTableProps {
  players: TeamPlayer[]
  teamId: number
  /** When true, the organizer can reject/re-accept and remove players. */
  canModerate?: boolean
  /** When true (organizer or owner delegate), per-row photo upload is shown. */
  canEdit?: boolean
  /**
   * When true, the player name links to the organizer-only history page. The
   * delegate cannot access that endpoint (other-tournament data), so for them
   * the name renders as plain text with the roster data shown inline.
   */
  canViewHistory?: boolean
  /** When provided, renders a remove action per row (management view). */
  onRemove?: (teamPlayerId: number) => void
  removingId?: number | null
}

export function RosterTable({
  players,
  teamId,
  canModerate = false,
  canEdit = false,
  canViewHistory = false,
  onRemove,
  removingId,
}: RosterTableProps) {
  const updatePlayer = useUpdateTeamPlayer(teamId)
  const uploadPhoto = useUploadTeamPlayerPhoto(teamId)
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
                'flex flex-col gap-3 p-3 sm:flex-row sm:items-center',
                rejected && 'bg-destructive/5',
              )}
            >
              <div className="flex flex-1 items-center gap-3">
                <Avatar className="size-9">
                  {p.photo_url ? (
                    <AvatarImage src={p.photo_url} alt={p.full_name} />
                  ) : null}
                  <AvatarFallback>
                    {p.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {canViewHistory ? (
                      <Link
                        to={`/players/${p.player_id}/history`}
                        className="hover:text-brand truncate text-sm font-medium underline-offset-2 hover:underline"
                      >
                        {p.full_name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {p.full_name}
                      </span>
                    )}
                    {p.is_captain === 1 ? (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="size-3" />
                        Capitán
                      </Badge>
                    ) : null}
                    {p.is_delegate === 1 ? (
                      <Badge variant="outline" className="gap-1">
                        <UserCog className="size-3" />
                        Delegado
                      </Badge>
                    ) : null}
                    {rejected ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="size-3" />
                        Rechazado
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Cédula {p.document_id}
                    {p.position ? ` · ${p.position}` : ''}
                    {` · Alias: ${p.alias ?? '—'}`}
                  </p>
                  {rejected && p.rejection_reason ? (
                    <p className="text-destructive mt-1 text-xs">
                      Motivo: {p.rejection_reason}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {p.shirt_number != null ? (
                    <span className="bg-muted flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                      {p.shirt_number}
                    </span>
                  ) : (
                    <Shield className="text-muted-foreground size-4" />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <ImageUploader
                    currentUrl={p.photo_url}
                    label={`Foto de ${p.full_name}`}
                    shape="circle"
                    size="sm"
                    capture
                    upload={async (file) => {
                      const res = await uploadPhoto.mutateAsync({
                        teamPlayerId: p.id,
                        file,
                      })
                      return res.photo_url
                    }}
                  />
                ) : null}

                {canModerate ? (
                  rejected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reaccept(p)}
                      disabled={updatePlayer.isPending}
                    >
                      <RotateCcw className="size-4" />
                      Readmitir
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectTarget(p)
                        setReason('')
                      }}
                    >
                      <Ban className="text-destructive size-4" />
                      Rechazar
                    </Button>
                  )
                ) : null}

                {onRemove ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar jugador"
                    disabled={removingId === p.id}
                    onClick={() => onRemove(p.id)}
                  >
                    <Trash2 className="text-destructive size-4" />
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
