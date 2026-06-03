import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
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
import { useFollowedTournaments } from '@/features/tournaments/api/useTournaments'
import { useFollowStore } from '@/stores/followStore'
import { useAuthStore } from '@/stores/authStore'

type Relation = 'organizer' | 'delegate' | 'following'

interface Row {
  id: number
  slug: string
  name: string
  logo_url: string | null
  relations: Relation[]
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
 * "Torneos que sigo": single combined list of tournaments the user relates to —
 * as organizer or delegate (from the backend, when logged in) and as a
 * visitor/player following from the public link (localStorage, no login). Each
 * row shows badges for every relationship the user holds.
 */
export function FollowedTournamentsPage() {
  const token = useAuthStore((s) => s.token)
  const { data, isLoading, isError, error } = useFollowedTournaments(
    Boolean(token),
  )
  const followed = useFollowStore((s) => s.followed)
  const unfollow = useFollowStore((s) => s.unfollow)

  const rows = useMemo<Row[]>(() => {
    const byId = new Map<number, Row>()

    // Member tournaments (organizer/delegate) from the backend.
    for (const t of data ?? []) {
      const relations: Relation[] = [...t.my_roles]
      byId.set(t.id, {
        id: t.id,
        slug: t.slug,
        name: t.name,
        logo_url: t.logo_url,
        relations,
        sort: new Date(t.updated_at).getTime() || 0,
      })
    }

    // Visitor/player follows from localStorage (merge, add the badge).
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
          sort: f.followed_at,
        })
      }
    }

    return Array.from(byId.values()).sort((a, b) => b.sort - a.sort)
  }, [data, followed])

  const showSkeleton = Boolean(token) && isLoading

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Heart className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Torneos que sigo</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Torneos donde eres organizador o delegado, y los que sigues desde su
        enlace. Los que sigues como visitante se guardan en este dispositivo.
      </p>

      {showSkeleton ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Aún no sigues ningún torneo"
          description="Abre el enlace de un torneo y pulsa «Seguir», o crea uno como organizador."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
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
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/t/${row.slug}`}>Ver torneo</Link>
                </Button>
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
          ))}
        </div>
      )}
    </div>
  )
}
