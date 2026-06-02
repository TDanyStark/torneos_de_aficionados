import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import type { Group } from '@/features/tournaments/types'

interface GroupSelectProps {
  groups: Group[]
  value: number | undefined
  onChange: (groupId: number | undefined) => void
  /** Whether an "all groups" clearable option is allowed. */
  clearable?: boolean
  placeholder?: string
}

/** URL-driven group selector shared by calendar and standings views. */
export function GroupSelect({
  groups,
  value,
  onChange,
  clearable = true,
  placeholder = 'Todos los grupos',
}: GroupSelectProps) {
  const options: SelectOption<number>[] = groups.map((g) => ({
    value: g.id,
    label: g.name,
  }))
  const selected = options.find((o) => o.value === value) ?? null

  return (
    <div className="w-full sm:w-56">
      <ReactSelect<SelectOption<number>>
        isClearable={clearable}
        placeholder={placeholder}
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt?.value)}
      />
    </div>
  )
}
