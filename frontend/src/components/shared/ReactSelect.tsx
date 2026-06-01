import Select, {
  type GroupBase,
  type Props as SelectProps,
} from 'react-select'
import { cn } from '@/lib/utils'

export interface SelectOption<TValue = string | number> {
  value: TValue
  label: string
}

/**
 * react-select styled to match the shadcn/Tailwind theme using `unstyled` +
 * the classNames API so it inherits the oklch CSS variables (light/dark).
 */
export function ReactSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectProps<Option, IsMulti, Group>) {
  return (
    <Select<Option, IsMulti, Group>
      unstyled
      classNamePrefix="rs"
      classNames={{
        control: ({ isFocused }) =>
          cn(
            'flex min-h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors',
            'border-input',
            isFocused && 'border-ring ring-ring/50 ring-[3px]',
          ),
        valueContainer: () => 'gap-1',
        placeholder: () => 'text-muted-foreground',
        input: () => 'text-foreground',
        singleValue: () => 'text-foreground',
        multiValue: () =>
          'bg-secondary text-secondary-foreground rounded-sm px-1 my-0.5',
        multiValueRemove: () =>
          'hover:bg-destructive/20 hover:text-destructive rounded-sm px-0.5',
        indicatorsContainer: () => 'gap-1 text-muted-foreground',
        dropdownIndicator: () => 'p-1',
        clearIndicator: () => 'p-1 hover:text-destructive',
        indicatorSeparator: () => 'bg-border',
        menu: () =>
          'mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden z-50',
        menuList: () => 'p-1',
        option: ({ isFocused, isSelected }) =>
          cn(
            'cursor-pointer rounded-sm px-2 py-1.5 text-sm',
            isFocused && 'bg-accent text-accent-foreground',
            isSelected && 'bg-primary text-primary-foreground',
          ),
        noOptionsMessage: () => 'text-muted-foreground p-2 text-sm',
      }}
      {...props}
    />
  )
}
