import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { apiClient } from '@/lib/apiClient'
import { applyApiError } from '@/lib/formErrors'
import {
  tournamentFormSchema,
  type TournamentFormValues,
} from '@/features/tournaments/schemas'
import {
  DEFAULT_TOURNAMENT_FORM,
  formToPayload,
  tournamentToForm,
} from '@/features/tournaments/mappers'
import {
  tournamentKeys,
  useUpdateTournament,
} from '@/features/tournaments/api/useTournaments'
import { DateField } from '@/features/tournaments/components/DateField'
import { LogoUploader } from '@/features/tournaments/components/LogoUploader'
import { StageManager } from '@/features/tournaments/components/StageManager'
import { TournamentAdsPanel } from '@/features/ads/components/TournamentAdsPanel'
import { useAuthStore, useIsAdmin } from '@/stores/authStore'
import type { Tournament } from '@/features/tournaments/types'

export function TournamentEditPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const roles = useAuthStore((s) => s.roles)

  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...tournamentKeys.all, 'by-id', tournamentId],
    enabled: Number.isFinite(tournamentId) && tournamentId > 0,
    queryFn: () =>
      apiClient.get<Tournament>(`/tournaments/by-id/${tournamentId}`),
  })

  const update = useUpdateTournament(tournamentId)

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: DEFAULT_TOURNAMENT_FORM,
  })

  useEffect(() => {
    if (tournament) form.reset(tournamentToForm(tournament))
  }, [tournament, form])

  const onSubmit = async (values: TournamentFormValues) => {
    try {
      await update.mutateAsync(formToPayload(values))
      toast.success('Torneo actualizado')
      navigate('/dashboard')
    } catch (error) {
      applyApiError(error, form.setError)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !tournament) {
    return <ErrorState message="No se pudo cargar el torneo." />
  }

  // Only the tournament organizer (owner) manages stages.
  const isOrganizer = roles.some(
    (r) => r.tournament_id === tournament.id && r.role === 'organizer',
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold">Editar torneo</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* 1 — Datos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Logo</FormLabel>
                <LogoUploader
                  tournamentId={tournament.id}
                  logoUrl={tournament.logo_url}
                  slug={tournament.slug}
                />
              </div>

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

              <FormField
                control={form.control}
                name="description"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  control={form.control}
                  name="starts_at"
                  label="Fecha de inicio"
                  description="Fecha de inicio del torneo (opcional)."
                />
                <DateField
                  control={form.control}
                  name="ends_at"
                  label="Fecha de finalización"
                  description="Fecha de cierre del torneo (opcional)."
                />
              </div>
            </CardContent>
          </Card>

          {/* 2 — Reglas y premios */}
          <Card>
            <CardHeader>
              <CardTitle>Reglas y premios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reglamento</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Reglas del torneo (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="prize_first"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premio 1.° lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej. Trofeo + $500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prize_second"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premio 2.° lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej. Medallas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prize_third"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premio 3.° lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej. Medallas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prize_others"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otros premios</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="p. ej. Goleador, Fair Play"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3 — Puntuación */}
          <Card>
            <CardHeader>
              <CardTitle>Puntuación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="periods_count"
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
                  control={form.control}
                  name="points_win"
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
                  control={form.control}
                  name="points_draw"
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
                  control={form.control}
                  name="points_loss"
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
            </CardContent>
          </Card>

          {/* 4 — Disciplina (suspensiones) */}
          <Card>
            <CardHeader>
              <CardTitle>Disciplina (suspensiones)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="suspension_red_card"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Suspensión por tarjeta roja</FormLabel>
                      <FormDescription>
                        El jugador expulsado cumple suspensión automática.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Suspensión por tarjeta roja"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suspension_double_yellow"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>
                        Suspensión por doble amarilla seguida
                      </FormLabel>
                      <FormDescription>
                        Dos amarillas en el mismo partido implican suspensión.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Suspensión por doble amarilla seguida"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 5 — Inscripciones */}
          <Card>
            <CardHeader>
              <CardTitle>Inscripciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="registration_open"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Inscripciones cerradas</FormLabel>
                      <FormDescription>
                        Al activarlo, los equipos no podrán inscribirse en el
                        torneo.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Inscripciones cerradas"
                        checked={!field.value}
                        onCheckedChange={(closed) => field.onChange(!closed)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registration_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Información para inscritos</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Costo, requisitos, sede… (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Form>

      {/* Publicidad — solo administradores de la plataforma. */}
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Publicidad</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentAdsPanel tournamentId={tournament.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
