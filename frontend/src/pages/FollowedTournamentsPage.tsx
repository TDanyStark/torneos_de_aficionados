import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ArchiveRestore, Heart, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { TournamentLogo } from '@/features/tournaments/components/TournamentLogo'
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge'
import {
  useFollowedTournaments,
  useSetFollowedVisibility,
} from '@/features/tournaments/api/useTournaments'
import { useFollowStore } from '@/stores/followStore'
import { useAuthStore } from '@/stores/authStore'
import { useArchivedFilter } from '@/features/tournaments/hooks/useArchivedFilter'
import type { TournamentStatus } from '@/features/tournaments/types'

type Relation = 'organizer' | 'delegate' | 'following'

interface Row {
  id: number
  slug: string
  name: string
  logo_url: string | null
  relations: Relation[]
  /** Tournament status — only known for member tournaments (from backend). */
  status: TournamentStatus | null
  sort: number
}

const RELATION_LABEL: Record<Relation, string> = {
  organizer: 'Organizador',
  delegate: 'Delegado',
  following: 'Siguiendo',
}

const RELATION_VARIANT: Record<
  Relation,
  'default' | 'secondary' | 'outline'
> = {
  organizer: 'default',
  delegate: 'secondary',
  following: 'outline',
}

/**
 * "Torneos que sigo": combined list of tournaments the user relates to — as
 * organizer or delegate (backend) and as a visitor/player following from the
 * public link (localStorage). Member tournaments can be archived from the feed
 * (non-destructive) and restored from the "Ver archivados" view, which is
 * driven by the URL (?archivados=1) so it's shareable and back/forward-aware.
 */
export function FollowedTournamentsPage() {
  const token = useAuthStore((s) => s.token)
  const isAuthed = Boolean(token)
  const { archived: showHidden, setArchived: setShowHidden } =
    useArchivedFilter()

  const visible = useFollowedTournaments(isAuthed, false)
  const hidden = useFollowedTournaments(isAuthed && showHidden, true)
  const setVisibility = useSetFollowedVisibility()

  const followed = useFollowStore((s) => s.followed)
  const unfollow = useFollowStore((s) => s.unfollow)

  // Active list = visible member tournaments merged with localStorage follows.
  const rows = useMemo<Row[]>(() => {
    const byId = new Map<number, Row>()

    for (const t of visible.data ?? []) {
      byId.set(t.id, {
        id: t.id,
        slug: t.slug,
        name: t.name,
        logo_url: t.logo_url,
        relations: [...t.my_roles],
        status: t.status,
        sort: new Date(t.updated_at).getTime() || 0,
      })
    }

    for (const f of followed) {
      const existing = byId.get(f.id)
      if (existing) {
        if (!existing.relations.includes('following')) {
          existing.relations.push('following')
        }
      } else {
        byId.set(f.id, {
          id: f.id,
          slug: f.slug,
          name: f.name,
          logo_url: f.logo_url,
          relations: ['following'],
          status: null,
          sort: f.followed_at,
        })
      }
    }

    return Array.from(byId.values()).sort((a, b) => b.sort - a.sort)
  }, [visible.data, followed])

  const hiddenRows = useMemo<Row[]>(
    () =>
      (hidden.data ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        logo_url: t.logo_url,
        relations: [...t.my_roles],
        status: t.status,
        sort: new Date(t.updated_at).getTime() || 0,
      })),
    [hidden.data],
  )

  const onHide = async (id: number) => {
    try {
      await setVisibility.mutateAsync({ id, hidden: true })
      // Also drop any local "follow" so the row truly leaves the active feed
      // (the merge would otherwise keep it via localStorage).
      unfollow(id)
      toast.success('Torneo archivado de tu lista')
    } catch {
      toast.error('No se pudo archivar el torneo')
    }
  }

  const onRestore = async (id: number) => {
    try {
      await setVisibility.mutateAsync({ id, hidden: false })
      toast.success('Torneo restaurado en tu lista')
    } catch {
      toast.error('No se pudo restaurar el torneo')
    }
  }

  const showSkeleton = isAuthed && visible.isLoading

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Heart className="text-brand size-6" />
          <h1 className="text-xl font-semibold">Torneos que sigo</h1>
        </div>
        {isAuthed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? (
              <>
                <ArchiveRestore className="size-4" />
                Ver activos
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Ver archivados
              </>
            )}
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">
        Torneos donde eres organizador o delegado, y los que sigues desde su
        enlace. Puedes archivar los que ya pasaron para no agobiarte; siempre
        podrás verlos y restaurarlos.
      </p>

      {showHidden ? (
        /* ---- Hidden view ---- */
        hidden.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : hidden.isError ? (
          <ErrorState message={hidden.error?.message} />
        ) : hiddenRows.length === 0 ? (
          <EmptyState
            title="No tienes torneos archivados"
            description="Cuando archives un torneo de tu lista, aparecerá aquí para restaurarlo."
          />
        ) : (
          <div className="space-y-3">
            {hiddenRows.map((row) => (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <TournamentLogo
                        name={row.name}
                        logoUrl={row.logo_url}
                        seed={row.id}
                      />
                      <CardTitle className="text-base">{row.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {row.status ? (
                        <TournamentStatusBadge status={row.status} />
                      ) : null}
                      {row.relations.map((rel) => (
                        <Badge key={rel} variant={RELATION_VARIANT[rel]}>
                          {RELATION_LABEL[rel]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/t/${row.slug}`}>Ver torneo</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={setVisibility.isPending}
                    onClick={() => onRestore(row.id)}
                  >
                    <RotateCcw className="size-4" />
                    Restaurar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      ) : /* ---- Active view ---- */
      showSkeleton ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : visible.isError ? (
        <ErrorState message={visible.error?.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Aún no sigues ningún torneo"
          description="Abre el enlace de un torneo y pulsa «Seguir», o crea uno como organizador."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isMember =
              row.relations.includes('organizer') ||
              row.relations.includes('delegate')
            const isFinished =
              row.status === 'finished' || row.status === 'archived'
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <TournamentLogo
                        name={row.name}
                        logoUrl={row.logo_url}
                        seed={row.id}
                      />
                      <CardTitle className="text-base">{row.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {row.status ? (
                        <TournamentStatusBadge status={row.status} />
                      ) : null}
                      {row.relations.map((rel) => (
                        <Badge key={rel} variant={RELATION_VARIANT[rel]}>
                          {RELATION_LABEL[rel]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Tu enlace:{' '}
                  <span className="font-mono">{`/t/${row.slug}`}</span>
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/t/${row.slug}`}>Ver torneo</Link>
                  </Button>
                  {isMember ? (
                    <Button
                      variant={isFinished ? 'outline' : 'ghost'}
                      size="sm"
                      disabled={setVisibility.isPending}
                      onClick={() => onHide(row.id)}
                    >
                      <Archive className="size-4" />
                      Archivar de mi lista
                    </Button>
                  ) : null}
                  {row.relations.includes('following') ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unfollow(row.id)}
                    >
                      Dejar de seguir
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
