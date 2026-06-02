import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import type { TeamFilters, TeamStatus } from '../types'
import { TEAM_STATUS_LABELS } from './TeamStatusBadge'

interface TeamFilterBarProps {
  filters: TeamFilters
  onChange: (patch: Partial<TeamFilters>) => void
}

const STATUS_OPTIONS: SelectOption<TeamStatus>[] = (
  Object.keys(TEAM_STATUS_LABELS) as TeamStatus[]
).map((value) => ({ value, label: TEAM_STATUS_LABELS[value] }))

export function TeamFilterBar({ filters, onChange }: TeamFilterBarProps) {
  const selectedStatus =
    STATUS_OPTIONS.find((o) => o.value === filters.status) ?? null

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Buscar equipo…"
          defaultValue={filters.q ?? ''}
          onChange={(e) => onChange({ q: e.target.value || undefined })}
        />
      </div>
      <div className="w-full sm:w-56">
        <ReactSelect<SelectOption<TeamStatus>>
          isClearable
          placeholder="Estado"
          options={STATUS_OPTIONS}
          value={selectedStatus}
          onChange={(opt) => onChange({ status: opt?.value })}
        />
      </div>
    </div>
  )
}
