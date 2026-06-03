import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CalendarDays,
  Heart,
  ListOrdered,
  Pencil,
  Share2,
  ShieldAlert,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useFollowStore } from '@/stores/followStore'
import { useAuthStore } from '@/stores/authStore'
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

  // Visitor/player "follow" — persisted in localStorage (no login needed).
  const isFollowing = useFollowStore((s) =>
    data ? s.isFollowing(data.id) : false,
  )
  const toggleFollow = useFollowStore((s) => s.toggle)

  // Organizer of THIS tournament (per-tournament role). Gates the "Editar"
  // action so management lives behind the single public link.
  const roles = useAuthStore((s) => s.roles)
  const isOrganizer = data
    ? roles.some((r) => r.tournament_id === data.id && r.role === 'organizer')
    : false

  const shareLink = async () => {
    if (!data) return
    const url = `${window.location.origin}/t/${data.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace del torneo copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

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

      {/* Actions: inscribe a team (when open), follow, and share — all from the
          single tournament link. */}
      <div className="flex flex-wrap gap-2">
        {data.registration_open && data.registration_code ? (
          <Button asChild size="sm">
            <Link to={`/inscripcion/${data.id}/${data.registration_code}`}>
              <UserPlus className="size-4" />
              Inscribir mi equipo
            </Link>
          </Button>
        ) : null}
        <Button
          variant={isFollowing ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            toggleFollow({
              id: data.id,
              slug: data.slug,
              name: data.name,
              logo_url: data.logo_url,
            })
          }
        >
          <Heart
            className={cn('size-4', isFollowing && 'fill-current')}
          />
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </Button>
        <Button variant="outline" size="sm" onClick={shareLink}>
          <Share2 className="size-4" />
          Compartir
        </Button>
        {isOrganizer ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/t/${data.slug}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
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
