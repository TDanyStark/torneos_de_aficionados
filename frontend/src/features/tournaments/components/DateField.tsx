import { type Control, type FieldValues, type Path } from 'react-hook-form'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, XIcon } from 'lucide-react'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const DATE_FORMAT = 'yyyy-MM-dd'

/**
 * Parse a `YYYY-MM-DD` string into a Date in LOCAL time. Avoids
 * `new Date('2026-06-01')` which parses as UTC midnight (shifts day in UTC-N).
 */
function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined
  const datePart = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return undefined
  const parsed = parse(datePart, DATE_FORMAT, new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

interface DateFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  description?: string
}

/**
 * Reusable date picker bound to a `YYYY-MM-DD` string form field. Used by
 * `starts_at` and `ends_at`.
 */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: DateFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = parseLocalDate((field.value as string) ?? '')
        return (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selected && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {selected
                      ? format(selected, "d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })
                      : 'Selecciona una fecha'}
                    {selected && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Limpiar fecha"
                        className="ml-auto inline-flex rounded-sm opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          field.onChange('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            field.onChange('')
                          }
                        }}
                      >
                        <XIcon className="size-4" />
                      </span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={es}
                  selected={selected}
                  onSelect={(date) =>
                    field.onChange(date ? format(date, DATE_FORMAT) : '')
                  }
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
