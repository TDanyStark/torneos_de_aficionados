import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTournamentList } from '@/features/tournaments/api/useTournaments'
import { TournamentCard } from '@/features/tournaments/components/TournamentCard'
import { TournamentCardSkeleton } from '@/features/tournaments/components/TournamentCardSkeleton'
import { OrganizerCta } from '@/features/tournaments/components/OrganizerCta'

const FEATURED_LIMIT = 6

/**
 * Public landing page at `/`. Brand hero + search box (lands on the `/torneos`
 * listing with `?q=` URL state), a strip of the most recent tournaments, and
 * the organizer CTA. Global header/footer/sidebar ad slots come from AppLayout.
 * Mobile-first: every section stacks on small screens.
 */
export function HomePage() {
  useDocumentTitle(
    undefined,
    'Sigue tus torneos de fútbol aficionado en vivo: fixtures, tablas, goleadores y partidos en directo.',
  )

  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data, isLoading, isError, error } = useTournamentList({ page: 1 })
  const featured = data?.items.slice(0, FEATURED_LIMIT) ?? []

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/torneos?q=${encodeURIComponent(q)}` : '/torneos')
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="from-brand/15 border-brand/20 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-6 sm:p-10">
        <div className="max-w-2xl space-y-3">
          <div className="text-brand flex items-center gap-2">
            <Trophy className="size-6" />
            <span className="text-sm font-medium tracking-wide uppercase">
              Torneos de Aficionados
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Sigue tus torneos de fútbol aficionado en vivo
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Fixtures, tablas de posiciones, goleadores y partidos en directo.
            Todo en un solo lugar, desde tu celular.
          </p>

          {/* Search box → lands on the listing with URL state. */}
          <form
            onSubmit={onSearch}
            role="search"
            className="flex flex-col gap-2 pt-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar un torneo..."
                aria-label="Buscar torneo"
                className="pl-9"
              />
            </div>
            <Button type="submit" className="shrink-0">
              Buscar
            </Button>
          </form>
        </div>
      </section>

      {/* Featured / recent tournaments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold sm:text-xl">
            Torneos recientes
          </h2>
          <Link
            to="/torneos"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Ver todos
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error.message} />
        ) : featured.length === 0 ? (
          <EmptyState
            title="Aún no hay torneos"
            description="Sé el primero en crear uno y compartirlo."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </section>

      {/* Organizer funnel */}
      <OrganizerCta />
    </div>
  )
}
