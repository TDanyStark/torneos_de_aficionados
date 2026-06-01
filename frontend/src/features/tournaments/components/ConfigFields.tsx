import { type Control, type FieldValues } from 'react-hook-form'
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

/** Configuration fields (periods, points, registration toggles, start). */
export function ConfigFields<T extends FieldValues>({
  control,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de inicio</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
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
