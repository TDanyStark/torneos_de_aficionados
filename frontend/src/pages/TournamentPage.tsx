import { useParams } from 'react-router-dom'
import {
  CalendarDays,
  ListOrdered,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useStages } from '@/features/tournaments/api/useStages'
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge'
import { PhaseSelector } from '@/features/tournaments/components/PhaseSelector'
import { useStageParam } from '@/features/tournaments/hooks/useStageParam'
import { useActiveStage } from '@/features/tournaments/hooks/useActiveStage'
import {
  TOURNAMENT_TABS,
  useTournamentTabs,
  type TournamentTab,
} from '@/features/tournaments/hooks/useTournamentTabs'
import { ResumenPanel } from '@/features/tournaments/components/ResumenPanel'
import { FixturesPanel } from '@/features/fixtures/components/FixturesPanel'
import { TablaPanel } from '@/features/fixtures/components/TablaPanel'
import { EquiposPanel } from '@/features/teams/components/EquiposPanel'
import { GoleadoresPanel } from '@/features/live/components/GoleadoresPanel'
import { DisciplinaPanel } from '@/features/live/components/DisciplinaPanel'

const TAB_META: Record<TournamentTab, { label: string; icon: LucideIcon }> = {
  resumen: { label: 'Resumen', icon: Trophy },
  fixtures: { label: 'Fixtures', icon: CalendarDays },
  tabla: { label: 'Tabla', icon: ListOrdered },
  equipos: { label: 'Equipos', icon: Users },
  goleadores: { label: 'Goleadores', icon: Trophy },
  disciplina: { label: 'Disciplina', icon: ShieldAlert },
}

/**
 * Public tournament hub at `/t/:slug`. Resolves the tournament by slug and
 * renders one of the extracted feature panels based on the `?tab=` URL state.
 * Mobile-first: the tab bar scrolls horizontally on small screens and the
 * content stacks below it.
 */
export function TournamentPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError, error } = useTournamentDetail(slug)
  const { tab, setTab } = useTournamentTabs()

  // Single source of truth for stages: lifted here so the phase selector and
  // the phase-aware panels (Fixtures/Tabla) share one resolved active stage.
  const stages = useStages(data?.id || undefined)
  const { stageId: urlStageId, setStageId } = useStageParam()
  const { stageId: activeStageId } = useActiveStage(stages.data, urlStageId)
  const hasMultipleStages = (stages.data ?? []).length > 1

  // Lightweight SEO: keep the document title in sync with the tournament and
  // the active tab (e.g. "Liga Barrial · Fixtures").
  useDocumentTitle(
    data?.name ? `${data.name} · ${TAB_META[tab].label}` : undefined,
    data?.description ?? undefined,
  )

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message={error?.message ?? 'Torneo no encontrado.'} />
  }

  if (!data) {
    return (
      <EmptyState
        title="Torneo no encontrado"
        description="No encontramos un torneo con esa dirección."
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {data.logo_url ? (
            <img
              src={data.logo_url}
              alt={data.name}
              className="size-10 rounded object-cover"
            />
          ) : (
            <Trophy className="text-brand size-7" />
          )}
          <h1 className="text-2xl font-semibold">{data.name}</h1>
        </div>
        <TournamentStatusBadge status={data.status} />
      </div>

      {/* Phase selector — only shown for multi-stage tournaments. Scopes the
          fixtures/standings views to the selected stage. */}
      {hasMultipleStages && activeStageId != null ? (
        <PhaseSelector
          stages={stages.data ?? []}
          value={activeStageId}
          onChange={(id) => setStageId(id)}
        />
      ) : null}

      {/* Horizontally scrollable, accessible tab bar (mobile-first). */}
      <div
        role="tablist"
        aria-label="Secciones del torneo"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {TOURNAMENT_TABS.map((id) => {
          const { label, icon: Icon } = TAB_META[id]
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        {tab === 'resumen' ? <ResumenPanel tournament={data} /> : null}
        {tab === 'fixtures' ? (
          <FixturesPanel
            tournament={data}
            stageId={hasMultipleStages ? (activeStageId ?? undefined) : undefined}
          />
        ) : null}
        {tab === 'tabla' ? (
          <TablaPanel
            tournament={data}
            stageId={hasMultipleStages ? (activeStageId ?? undefined) : undefined}
          />
        ) : null}
        {tab === 'equipos' ? <EquiposPanel tournament={data} /> : null}
        {tab === 'goleadores' ? <GoleadoresPanel tournament={data} /> : null}
        {tab === 'disciplina' ? <DisciplinaPanel tournament={data} /> : null}
      </div>
    </div>
  )
}
