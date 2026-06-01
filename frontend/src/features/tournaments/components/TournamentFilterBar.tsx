import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  ReactSelect,
  type SelectOption,
} from '@/components/shared/ReactSelect'
import { useSports } from '../api/useSports'
import type { TournamentFilters, TournamentStatus } from '../types'
import { TOURNAMENT_STATUS_LABELS } from './TournamentStatusBadge'

const STATUS_OPTIONS: SelectOption<TournamentStatus>[] = (
  Object.keys(TOURNAMENT_STATUS_LABELS) as TournamentStatus[]
).map((value) => ({ value, label: TOURNAMENT_STATUS_LABELS[value] }))

interface Props {
  filters: TournamentFilters
  onChange: (patch: Partial<TournamentFilters>) => void
}

export function TournamentFilterBar({ filters, onChange }: Props) {
  const { data: sports } = useSports()
  const [search, setSearch] = useState(filters.q ?? '')

  // Debounce the free-text search into the URL.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((filters.q ?? '') !== search) {
        onChange({ q: search || undefined })
      }
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const sportOptions: SelectOption<number>[] = (sports ?? []).map((s) => ({
    value: s.id,
    label: s.name,
  }))
  const selectedSport =
    sportOptions.find((o) => o.value === filters.sport) ?? null
  const selectedStatus =
    STATUS_OPTIONS.find((o) => o.value === filters.status) ?? null

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="relative sm:col-span-1">
        <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar torneo…"
          className="pl-8"
        />
      </div>
      <ReactSelect<SelectOption<number>>
        placeholder="Deporte"
        isClearable
        options={sportOptions}
        value={selectedSport}
        onChange={(opt) => onChange({ sport: opt?.value })}
      />
      <ReactSelect<SelectOption<TournamentStatus>>
        placeholder="Estado"
        isClearable
        options={STATUS_OPTIONS}
        value={selectedStatus}
        onChange={(opt) => onChange({ status: opt?.value })}
      />
    </div>
  )
}
