import { useEffect, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Settings, Layers, Flag, ClipboardList } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminTeamsPanel } from '@/features/teams/components/AdminTeamsPanel'
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
  is_public: 'inscripciones',
  slug: 'inscripciones',
}

/**
 * Maps each form field to the top-level edit tab that renders it. Used so a
 * blocked save can switch to the tab holding the first invalid field.
 */
const FIELD_TAB: Record<string, EditSection> = {
  name: 'info',
  sport_id: 'info',
  description: 'info',
  logo_url: 'info',
  starts_at: 'info',
  ends_at: 'info',
  rules: 'info',
  prize_first: 'info',
  prize_second: 'info',
  prize_third: 'info',
  prize_others: 'info',
  periods_count: 'info',
  points_win: 'info',
  points_draw: 'info',
  points_loss: 'info',
  suspension_red_card: 'info',
  suspension_double_yellow: 'info',
  is_public: 'info',
  registration_open: 'inscripciones',
  registration_info: 'inscripciones',
  roster_limit: 'inscripciones',
  slug: 'inscripciones',
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
  is_public: 'Visibilidad',
  slug: 'Enlace del torneo',
}

type EditSection = 'info' | 'fases' | 'arbitros' | 'inscripciones'

const EDIT_SECTIONS: EditSection[] = [
  'info',
  'fases',
  'arbitros',
  'inscripciones',
]

const SECTION_META: Record<EditSection, { label: string; icon: LucideIcon }> = {
  info: { label: 'Información y reglas', icon: Settings },
  fases: { label: 'Fases', icon: Layers },
  arbitros: { label: 'Árbitros', icon: Flag },
  inscripciones: { label: 'Inscripciones', icon: ClipboardList },
}

function parseSection(value: string | null): EditSection {
  return value && (EDIT_SECTIONS as string[]).includes(value)
    ? (value as EditSection)
    : 'info'
}

export function TournamentEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const roles = useAuthStore((s) => s.roles)
  const [openSections, setOpenSections] = useState<string[]>(['datos'])
  const [searchParams, setSearchParams] = useSearchParams()
  const section = parseSection(searchParams.get('section'))
  const setSection = (next: EditSection) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'info') params.delete('section')
        else params.set('section', next)
        // Reset list pagination when switching sections.
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...tournamentKeys.all, 'by-slug', slug],
    enabled: Boolean(slug),
    queryFn: () =>
      apiClient.get<Tournament>(`/tournaments/by-slug/${slug}`),
  })

  // The mutation targets the numeric id, resolved once the tournament loads.
  const tournamentId = tournament?.id ?? 0
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
      // The slug is editable. If it changed, the current URL is now stale —
      // forward to the new canonical edit URL so a refresh keeps working.
      if (updated.slug !== slug) {
        navigate(`/t/${updated.slug}/edit`, { replace: true })
      }
    } catch (error) {
      applyApiError(error, form.setError)
    }
  }

  // Surface validation failures so "Guardar" never silently does nothing:
  // open every section that holds an invalid field, and name the fields in the
  // toast so errors in collapsed sections (or fields without UI) are visible.
  const onInvalid = (errors: FieldErrors<TournamentFormValues>) => {
    const fields = Object.keys(errors)

    // Switch to the tab that holds the first invalid field, so the error is
    // never hidden behind another tab.
    const firstTab = fields.map((f) => FIELD_TAB[f]).find(Boolean)
    if (firstTab && firstTab !== section) setSection(firstTab)

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

      {/* Section tab bar — Información (the form) vs Equipos (unified teams +
          inscriptions panel). URL-driven via ?section= so it is shareable. */}
      <div
        role="tablist"
        aria-label="Secciones de edición"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {EDIT_SECTIONS.map((id) => {
          const { label, icon: Icon } = SECTION_META[id]
          const active = id === section
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* The form is always mounted so its react-hook-form state survives tab
          switches; only the visible cards change per tab. Fields are spread
          across the «Información y reglas» and «Inscripciones» tabs. */}
      <Form {...form}>
        <form
          id="tournament-edit-form"
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-5"
        >
          {/* 1 — Datos (always rendered open by default) */}
          <div className={section === 'info' ? 'space-y-5' : 'hidden'}>
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
              </Accordion>
            </CardContent>
          </Card>

          {/* Visibilidad pública del torneo. */}
          <Card>
            <CardHeader>
              <CardTitle>Visibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Listar públicamente</FormLabel>
                      <FormDescription>
                        Si lo activas, el torneo aparece en la lista pública de
                        /torneos. Si no, solo es accesible con el enlace que
                        compartas.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Listar públicamente"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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

          {/* TAB: Inscripciones — ajustes de inscripción + listado de equipos. */}
          <div className={section === 'inscripciones' ? 'space-y-5' : 'hidden'}>
            <Card>
              <CardHeader>
                <CardTitle>Ajustes de inscripción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enlace del torneo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="liga-espana-junio-2026"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Parte final del enlace público:{' '}
                        {`${window.location.origin}/t/`}
                        <strong>{field.value || 'tu-enlace'}</strong>. Cámbialo
                        si recibes spam.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registration_open"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Inscripciones abiertas</FormLabel>
                        <FormDescription>
                          Cuando están abiertas, aparece el botón «Inscribir mi
                          equipo» en el enlace del torneo.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          aria-label="Inscripciones abiertas"
                          checked={field.value}
                          onCheckedChange={field.onChange}
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
              </CardContent>
            </Card>

            <AdminTeamsPanel tournament={tournament} />
          </div>
        </form>
      </Form>

      {/* TAB: Fases — solo el organizador (dueño) del torneo. */}
      <div className={section === 'fases' ? 'space-y-5' : 'hidden'}>
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
        ) : (
          <p className="text-muted-foreground text-sm">
            Solo el organizador del torneo puede gestionar las fases.
          </p>
        )}
      </div>

      {/* TAB: Árbitros — solo el organizador (dueño) del torneo. */}
      <div className={section === 'arbitros' ? 'space-y-5' : 'hidden'}>
        {isOrganizer ? (
          <Card>
            <CardHeader>
              <CardTitle>Árbitros</CardTitle>
            </CardHeader>
            <CardContent>
              <RefereesManager tournamentId={tournament.id} />
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground text-sm">
            Solo el organizador del torneo puede gestionar los árbitros.
          </p>
        )}
      </div>

      {/* Sticky save bar — only on tabs that hold form fields (Información y
          reglas, Inscripciones); disabled until there are changes. */}
      {section === 'info' || section === 'inscripciones' ? (
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
      ) : null}
    </div>
  )
}
