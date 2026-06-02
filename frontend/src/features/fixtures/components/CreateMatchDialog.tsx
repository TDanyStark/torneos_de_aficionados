import { useMemo, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ReactSelect,
  type SelectOption,
} from '@/components/shared/ReactSelect'
import { ApiError } from '@/lib/apiClient'
import { useTeamList } from '@/features/teams/api/useTeams'
import type { CreateMatchPayload } from '../types'
import { useCreateMatch } from '../api/useManualFixtures'

interface CreateMatchDialogProps {
  tournamentId: number
  /** Stage that owns the round — part of the contract, not sent in the body. */
  stageId: number
  roundId: number
  /** Optional group scope for the new match (groups stages). */
  groupId?: number | null
  /** Called after a match is created successfully. */
  onCreated?: () => void
}

/**
 * Organizer action: manually create a match inside a round. Both teams are
 * optional (TBD allowed) but home === away is blocked client- and server-side.
 * Repeated pairings are allowed; after creating, the dialog stays open with
 * cleared selections so the organizer can add several matches in a row.
 */
export function CreateMatchDialog({
  tournamentId,
  roundId,
  groupId,
  onCreated,
}: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [homeId, setHomeId] = useState<number | null>(null)
  const [awayId, setAwayId] = useState<number | null>(null)
  const [venue, setVenue] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const createMatch = useCreateMatch(tournamentId)
  const teams = useTeamList(tournamentId, { page: 1, status: 'approved' })

  const options = useMemo<SelectOption<number>[]>(
    () =>
      (teams.data?.items ?? []).map((t) => ({
        value: t.id,
        label: t.short_name?.trim() || t.name,
      })),
    [teams.data],
  )

  const homeOption = options.find((o) => o.value === homeId) ?? null
  const awayOption = options.find((o) => o.value === awayId) ?? null

  const sameTeam = homeId != null && awayId != null && homeId === awayId

  const resetSelection = () => {
    setHomeId(null)
    setAwayId(null)
    setVenue('')
    setScheduledAt('')
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetSelection()
  }

  const submit = async (keepOpen: boolean) => {
    const payload: CreateMatchPayload & { roundId: number } = { roundId }
    if (homeId != null) payload.home_team_id = homeId
    if (awayId != null) payload.away_team_id = awayId
    if (groupId != null) payload.group_id = groupId
    if (venue.trim()) payload.venue = venue.trim()
    if (scheduledAt) payload.scheduled_at = scheduledAt

    try {
      await createMatch.mutateAsync(payload)
      toast.success('Partido creado')
      onCreated?.()
      if (keepOpen) {
        resetSelection()
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo crear el partido',
      )
    }
  }

  const busy = createMatch.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Crear partido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear partido</DialogTitle>
          <DialogDescription>
            Selecciona los equipos (puedes dejarlos por definir) y, si quieres,
            sede y horario. Puedes crear varios partidos seguidos, incluso el
            mismo cruce más de una vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Local</Label>
            <ReactSelect<SelectOption<number>>
              options={options}
              value={homeOption}
              onChange={(opt) => setHomeId(opt?.value ?? null)}
              isClearable
              isLoading={teams.isLoading}
              placeholder="Por definir"
              noOptionsMessage={() => 'Sin equipos aprobados'}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Visitante</Label>
            <ReactSelect<SelectOption<number>>
              options={options}
              value={awayOption}
              onChange={(opt) => setAwayId(opt?.value ?? null)}
              isClearable
              isLoading={teams.isLoading}
              placeholder="Por definir"
              noOptionsMessage={() => 'Sin equipos aprobados'}
            />
          </div>

          {sameTeam ? (
            <p className="text-destructive text-sm">
              El equipo local y el visitante no pueden ser el mismo.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="match-venue">Sede (opcional)</Label>
            <Input
              id="match-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ej. Cancha 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-datetime">Fecha y hora (opcional)</Label>
            <Input
              id="match-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cerrar
          </Button>
          <Button
            variant="secondary"
            onClick={() => submit(true)}
            disabled={busy || sameTeam}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Crear otro
          </Button>
          <Button onClick={() => submit(false)} disabled={busy || sameTeam}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
