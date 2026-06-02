import { useEffect, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { StagePanelManager } from '@/features/tournaments/components/StagePanelManager'
import { RefereesManager } from '@/features/tournaments/components/RefereesManager'
import { TournamentAdsPanel } from '@/features/ads/components/TournamentAdsPanel'
import { useAuthStore, useIsAdmin } from '@/stores/authStore'
import type { Tournament } from '@/features/tournaments/types'

/**
 * Accordion section keys. "datos" is open by default; the rest collapse.
 * Used both for the Accordion value and to expand the section that holds the
 * first validation error when a save is blocked.
 */
type SectionKey =
  | 'datos'
  | 'reglas'
  | 'puntuacion'
  | 'disciplina'
  | 'inscripciones'

/** Maps each form field to the accordion section that renders it. */
const FIELD_SECTION: Record<string, SectionKey> = {
  name: 'datos',
  description: 'datos',
  starts_at: 'datos',
  ends_at: 'datos',
  rules: 'reglas',
  prize_first: 'reglas',
  prize_second: 'reglas',
  prize_third: 'reglas',
  prize_others: 'reglas',
  periods_count: 'puntuacion',
  points_win: 'puntuacion',
  points_draw: 'puntuacion',
  points_loss: 'puntuacion',
  suspension_red_card: 'disciplina',
  suspension_double_yellow: 'disciplina',
  registration_open: 'inscripciones',
  registration_info: 'inscripciones',
  roster_limit: 'inscripciones',
}

/** Human-readable label per field, used in the validation error toast. */
const FIELD_LABEL: Record<string, string> = {
  name: 'Nombre del torneo',
  sport_id: 'Deporte',
  description: 'Descripción',
  logo_url: 'Logo',
  starts_at: 'Fecha de inicio',
  ends_at: 'Fecha de finalización',
  rules: 'Reglamento',
  prize_first: 'Premio 1.° lugar',
  prize_second: 'Premio 2.° lugar',
  prize_third: 'Premio 3.° lugar',
  prize_others: 'Otros premios',
  periods_count: 'Periodos',
  points_win: 'Pts. victoria',
  points_draw: 'Pts. empate',
  points_loss: 'Pts. derrota',
  suspension_red_card: 'Suspensión por tarjeta roja',
  suspension_double_yellow: 'Suspensión por doble amarilla',
  registration_open: 'Inscripciones',
  registration_info: 'Información para inscritos',
  roster_limit: 'Límite de inscritos por equipo',
}

export function TournamentEditPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const roles = useAuthStore((s) => s.roles)
  const [openSections, setOpenSections] = useState<string[]>(['datos'])

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
      const updated = await update.mutateAsync(formToPayload(values))
      toast.success('Torneo actualizado')
      // Stay on the page and re-baseline the form so isDirty resets to false.
      form.reset(tournamentToForm(updated))
    } catch (error) {
      applyApiError(error, form.setError)
    }
  }

  // Surface validation failures so "Guardar" never silently does nothing:
  // open every section that holds an invalid field, and name the fields in the
  // toast so errors in collapsed sections (or fields without UI) are visible.
  const onInvalid = (errors: FieldErrors<TournamentFormValues>) => {
    const fields = Object.keys(errors)

    const sections = fields
      .map((f) => FIELD_SECTION[f])
      .filter((s): s is SectionKey => Boolean(s))
    if (sections.length > 0) {
      setOpenSections((prev) => Array.from(new Set([...prev, ...sections])))
    }

    const labels = fields.map((f) => FIELD_LABEL[f] ?? f)
    toast.error(
      labels.length > 0
        ? `Revisa: ${labels.join(', ')}.`
        : 'Revisa los campos marcados antes de guardar.',
    )
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

  // Only the tournament organizer (owner) manages stages. Roles are per
  // tournament: this checks the organizer role for THIS tournament only.
  const isOrganizer = roles.some(
    (r) => r.tournament_id === tournament.id && r.role === 'organizer',
  )

  const isDirty = form.formState.isDirty
  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <h1 className="text-xl font-semibold">Editar torneo</h1>
      </div>

      <Form {...form}>
        <form
          id="tournament-edit-form"
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-5"
        >
          {/* 1 — Datos (always rendered open by default) */}
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

          {/* Collapsible sections */}
          <Card>
            <CardContent className="py-0">
              <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
              >
                {/* 2 — Reglas y premios */}
                <AccordionItem value="reglas">
                  <AccordionTrigger>Reglas y premios</AccordionTrigger>
                  <AccordionContent className="space-y-4">
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
                              <Input
                                placeholder="p. ej. Trofeo + $500"
                                {...field}
                              />
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
                  </AccordionContent>
                </AccordionItem>

                {/* 3 — Puntuación */}
                <AccordionItem value="puntuacion">
                  <AccordionTrigger>Puntuación</AccordionTrigger>
                  <AccordionContent className="space-y-4">
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
                  </AccordionContent>
                </AccordionItem>

                {/* 4 — Disciplina (suspensiones) */}
                <AccordionItem value="disciplina">
                  <AccordionTrigger>Disciplina (suspensiones)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
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
                              Dos amarillas en el mismo partido implican
                              suspensión.
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
                  </AccordionContent>
                </AccordionItem>

                {/* 5 — Inscripciones */}
                <AccordionItem value="inscripciones">
                  <AccordionTrigger>Inscripciones</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="registration_open"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <FormLabel>Inscripciones cerradas</FormLabel>
                            <FormDescription>
                              Al activarlo, los equipos no podrán inscribirse en
                              el torneo.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              aria-label="Inscripciones cerradas"
                              checked={!field.value}
                              onCheckedChange={(closed) =>
                                field.onChange(!closed)
                              }
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
                    <FormField
                      control={form.control}
                      name="roster_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Límite de inscritos por equipo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={100}
                              placeholder="Sin límite"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Entre 5 y 100, o vacío para sin límite.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Fases — solo el organizador (dueño) del torneo. */}
      {isOrganizer ? (
        <Card>
          <CardHeader>
            <CardTitle>Fases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StageManager tournamentId={tournament.id} />
            <div className="border-t pt-6">
              <StagePanelManager tournamentId={tournament.id} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Árbitros — solo el organizador (dueño) del torneo. */}
      {isOrganizer ? (
        <Card>
          <CardHeader>
            <CardTitle>Árbitros</CardTitle>
          </CardHeader>
          <CardContent>
            <RefereesManager tournamentId={tournament.id} />
          </CardContent>
        </Card>
      ) : null}

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

      {/* Sticky save bar — always visible, disabled until there are changes. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <span className="text-muted-foreground text-sm">
            {isDirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}
          </span>
          <Button
            type="submit"
            form="tournament-edit-form"
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
