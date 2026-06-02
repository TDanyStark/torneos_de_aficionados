import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { applyApiError } from '@/lib/formErrors'
import { useCreateRegistration } from '../api/useRegistrations'
import {
  DEFAULT_SELF_REGISTRATION_FORM,
  selfRegistrationSchema,
  type SelfRegistrationFormValues,
} from '../schemas'
import type { Registration } from '../types'

interface SelfRegistrationFormProps {
  tournamentId: number
  registrationCode: string
  onSuccess: (registration: Registration) => void
}

const KNOWN_FIELDS = [
  'team_name',
  'short_name',
  'logo_url',
  'coach_name',
  'document_id',
  'full_name',
  'birthdate',
  'phone',
  'alias',
  'shirt_number',
  'position',
] as const

/**
 * Public self-registration form. Team data plus an optional "register me also
 * as a player" checkbox that reveals the delegate's player fields. The
 * registration_code is carried in the body and validated server-side.
 *
 * NOTE: the cédula lookup endpoint requires an organizer/delegate role, which
 * the self-registering user does not yet have, so no lookup is performed here —
 * the backend reuses-or-creates the player by cédula on submit.
 */
export function SelfRegistrationForm({
  tournamentId,
  registrationCode,
  onSuccess,
}: SelfRegistrationFormProps) {
  const createRegistration = useCreateRegistration(tournamentId)

  const form = useForm<SelfRegistrationFormValues>({
    resolver: zodResolver(selfRegistrationSchema),
    defaultValues: DEFAULT_SELF_REGISTRATION_FORM,
  })

  const isPlayer = useWatch({ control: form.control, name: 'is_player' })

  const onSubmit = async (values: SelfRegistrationFormValues) => {
    if (isPlayer) {
      if (!values.document_id || values.document_id.trim() === '') {
        form.setError('document_id', {
          type: 'manual',
          message: 'La cédula es obligatoria para inscribirte como jugador',
        })
        return
      }
      if (!values.full_name || values.full_name.trim() === '') {
        form.setError('full_name', {
          type: 'manual',
          message: 'Tu nombre completo es obligatorio',
        })
        return
      }
    }

    try {
      const registration = await createRegistration.mutateAsync({
        registration_code: registrationCode,
        team_name: values.team_name.trim(),
        short_name: values.short_name?.trim() || null,
        logo_url: values.logo_url?.trim() || null,
        coach_name: values.coach_name?.trim() || null,
        is_player: isPlayer,
        ...(isPlayer
          ? {
              document_id: values.document_id?.trim(),
              full_name: values.full_name?.trim(),
              birthdate: values.birthdate?.trim() || null,
              phone: values.phone?.trim() || null,
              alias: values.alias?.trim() || null,
              shirt_number:
                values.shirt_number && values.shirt_number !== ''
                  ? Number(values.shirt_number)
                  : null,
              position: values.position?.trim() || null,
              is_captain: values.is_captain,
            }
          : {}),
      })
      toast.success('Inscripción enviada. Espera la aprobación del organizador.')
      onSuccess(registration)
    } catch (error) {
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Datos del equipo</h3>
          <FormField
            control={form.control}
            name="team_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del equipo</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del equipo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="short_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abreviatura</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="coach_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entrenador</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_player"
          render={({ field }) => (
            <FormItem className="bg-muted/50 flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </FormControl>
              <div>
                <FormLabel className="font-medium">
                  Quiero inscribirme también como jugador
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Se agregará tu perfil al roster del equipo como delegado-jugador.
                </p>
              </div>
            </FormItem>
          )}
        />

        {isPlayer ? (
          <div className="space-y-3 rounded-md border p-4">
            <h3 className="text-sm font-semibold">Tus datos de jugador</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="document_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu cédula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shirt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dorsal</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="Ej. 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Mediocampista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_captain"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Soy capitán del equipo
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Enviando…' : 'Enviar inscripción'}
        </Button>
      </form>
    </Form>
  )
}
