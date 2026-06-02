import { type Control, type FieldValues } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
 * Parse a `YYYY-MM-DD` string into a Date in LOCAL time. We deliberately avoid
 * `new Date('2026-06-01')` because that parses as UTC midnight, which shifts to
 * the previous day in negative timezones (e.g. America/Bogota, UTC-5).
 */
function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined
  // Normalize values that may include a time/`T` component (e.g. from backend).
  const datePart = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return undefined
  const parsed = parse(datePart, DATE_FORMAT, new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** Configuration fields (periods, points, registration toggles, start). */
export function ConfigFields<T extends FieldValues>({
  control,
}: {
  control: Control<T>
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={'periods_count' as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Periodos</FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} />
            </FormControl>
            <FormDescription>
              Número de tiempos por partido (ej. 2 mitades).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-3 gap-3">
        <FormField
          control={control}
          name={'points_win' as never}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pts. victoria</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={'points_draw' as never}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pts. empate</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={'points_loss' as never}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pts. derrota</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={'starts_at' as never}
        render={({ field }) => {
          const selected = parseLocalDate(field.value ?? '')
          return (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de inicio</FormLabel>
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
              <FormDescription>
                Fecha de inicio del torneo (opcional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )
        }}
      />

      <FormField
        control={control}
        name={'registration_open' as never}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border p-3">
            <div>
              <FormLabel>Inscripciones abiertas</FormLabel>
              <FormDescription>
                Permite que los equipos se inscriban.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={'allow_late_registration' as never}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border p-3">
            <div>
              <FormLabel>Inscripción tardía</FormLabel>
              <FormDescription>
                Permite inscribirse después del inicio.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
