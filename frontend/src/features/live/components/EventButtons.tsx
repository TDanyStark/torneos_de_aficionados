import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { LiveMatch, RecordableEventType, RecordEventPayload } from '../types'
import { eventIcon } from './eventMeta'
import { RecordEventDialog } from './RecordEventDialog'

interface EventButtonsProps {
  snapshot: LiveMatch
  nameOf: (teamId: number | null | undefined) => string
  onRecord: (payload: RecordEventPayload) => Promise<void>
  recording: boolean
  /** Disabled when there's no running period (cannot record events). */
  disabled: boolean
}

interface Selection {
  type: RecordableEventType
  teamId: number
}

/**
 * Big mobile-first action buttons. Goals are per-team (Local / Visitante);
 * autogol and cards open a team picker via two-step (team chosen on the button).
 * Pressing a button opens the RecordEventDialog pre-seeded with type + team.
 */
export function EventButtons({
  snapshot,
  nameOf,
  onRecord,
  recording,
  disabled,
}: EventButtonsProps) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const { home_team_id, away_team_id } = snapshot.match

  const open = (type: RecordableEventType, teamId: number | null) => {
    if (teamId == null) return
    setSelection({ type, teamId })
  }

  const homeId = home_team_id ?? 0
  const awayId = away_team_id ?? 0

  const TeamPair = ({
    type,
    label,
  }: {
    type: RecordableEventType
    label: string
  }) => (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5"
          disabled={disabled || homeId === 0}
          onClick={() => open(type, home_team_id)}
        >
          {eventIcon(type, 'size-5')}
          <span className="max-w-full truncate text-xs">
            {nameOf(home_team_id)}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5"
          disabled={disabled || awayId === 0}
          onClick={() => open(type, away_team_id)}
        >
          {eventIcon(type, 'size-5')}
          <span className="max-w-full truncate text-xs">
            {nameOf(away_team_id)}
          </span>
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TeamPair type="goal" label="Gol" />
        <TeamPair type="own_goal" label="Autogol" />
        <TeamPair type="yellow_card" label="Tarjeta amarilla" />
        <TeamPair type="red_card" label="Tarjeta roja" />
      </CardContent>

      {selection ? (
        <RecordEventDialog
          open={selection != null}
          onOpenChange={(next) => {
            if (!next) setSelection(null)
          }}
          snapshot={snapshot}
          eventType={selection.type}
          teamId={selection.teamId}
          onSubmit={onRecord}
          submitting={recording}
        />
      ) : null}
    </Card>
  )
}
