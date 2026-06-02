import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  ReactSelect,
  type SelectOption,
} from '@/components/shared/ReactSelect'
import { applyApiError } from '@/lib/formErrors'
import {
  createTournamentSchema,
  type CreateTournamentValues,
} from '@/features/tournaments/schemas'
import { createToPayload } from '@/features/tournaments/mappers'
import { useCreateTournament } from '@/features/tournaments/api/useTournaments'
import { useSports } from '@/features/tournaments/api/useSports'

/**
 * Low-friction tournament creation. Only asks for the sport and the name; the
 * backend seeds points/periods from `sport.default_config`. On success the user
 * is redirected to the edit view where everything else is optional.
 */
export function TournamentWizardPage() {
  const navigate = useNavigate()
  const createTournament = useCreateTournament()
  const { data: sports, isLoading: sportsLoading } = useSports()

  const sportOptions: SelectOption<number>[] = (sports ?? []).map((s) => ({
    value: s.id,
    label: s.name,
  }))

  const form = useForm<CreateTournamentValues>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: { sport_id: 0, name: '' },
    mode: 'onTouched',
  })

  const onSubmit = async (values: CreateTournamentValues) => {
    try {
      const created = await createTournament.mutateAsync(
        createToPayload(values),
      )
      navigate(`/tournaments/${created.id}/edit`)
    } catch (error) {
      applyApiError(error, form.setError, ['sport_id', 'name'])
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Crear torneo</h1>
        <p className="text-muted-foreground text-sm">
          Elige el deporte y un nombre. El resto lo configuras después.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo torneo</CardTitle>
          <CardDescription>
            Selecciona el deporte y ponle un nombre para empezar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <Controller
                control={form.control}
                name="sport_id"
                render={({ field, fieldState }) => {
                  const selected =
                    sportOptions.find((o) => o.value === field.value) ?? null
                  return (
                    <FormItem>
                      <FormLabel>Deporte</FormLabel>
                      <ReactSelect<SelectOption<number>>
                        isLoading={sportsLoading}
                        placeholder="Selecciona un deporte"
                        options={sportOptions}
                        value={selected}
                        onChange={(opt) =>
                          field.onChange(opt?.value ?? undefined)
                        }
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
                control={form.control}
                name="name"
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

              <Button
                type="submit"
                className="w-full"
                disabled={createTournament.isPending}
              >
                {createTournament.isPending ? 'Creando…' : 'Crear torneo'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
