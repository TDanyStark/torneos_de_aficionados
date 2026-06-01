import { type Control, Controller, type FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ReactSelect,
  type SelectOption,
} from '@/components/shared/ReactSelect'
import { useSports } from '../api/useSports'

/**
 * Basics fields (name, sport, description, logo). Generic over the form values
 * so it can be embedded in the create wizard and the edit form alike.
 */
export function BasicsFields<T extends FieldValues>({
  control,
}: {
  control: Control<T>
}) {
  const { data: sports, isLoading } = useSports()
  const sportOptions: SelectOption<number>[] = (sports ?? []).map((s) => ({
    value: s.id,
    label: s.name,
  }))

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={'name' as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del torneo</FormLabel>
            <FormControl>
              <Input placeholder="Liga de Verano 2026" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Controller
        control={control}
        name={'sport_id' as never}
        render={({ field, fieldState }) => {
          const selected =
            sportOptions.find((o) => o.value === field.value) ?? null
          return (
            <FormItem>
              <FormLabel>Deporte</FormLabel>
              <ReactSelect<SelectOption<number>>
                isLoading={isLoading}
                placeholder="Selecciona un deporte"
                options={sportOptions}
                value={selected}
                onChange={(opt) => field.onChange(opt?.value ?? undefined)}
                onBlur={field.onBlur}
              />
              {fieldState.error ? (
                <p className="text-destructive text-sm">
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )
        }}
      />

      <FormField
        control={control}
        name={'description' as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Describe tu torneo (opcional)"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={'logo_url' as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logo (URL)</FormLabel>
            <FormControl>
              <Input placeholder="https://…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
