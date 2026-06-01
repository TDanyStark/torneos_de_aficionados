import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { applyApiError } from '@/lib/formErrors'
import {
  basicsSchema,
  configSchema,
  tournamentFormSchema,
  type TournamentFormValues,
} from '@/features/tournaments/schemas'
import {
  DEFAULT_TOURNAMENT_FORM,
  formToPayload,
} from '@/features/tournaments/mappers'
import { useCreateTournament } from '@/features/tournaments/api/useTournaments'
import { useWizardStep } from '@/features/tournaments/hooks/useWizardStep'
import { WizardStepper } from '@/features/tournaments/components/WizardStepper'
import { BasicsFields } from '@/features/tournaments/components/BasicsFields'
import { ConfigFields } from '@/features/tournaments/components/ConfigFields'
import { StageManager } from '@/features/tournaments/components/StageManager'
import { StagePicker } from '@/features/tournaments/components/StagePicker'
import { GroupManager } from '@/features/tournaments/components/GroupManager'
import { AdvancementRuleManager } from '@/features/tournaments/components/AdvancementRuleManager'
import type { Tournament } from '@/features/tournaments/types'

const STEP_TITLES = [
  ['Datos básicos', 'Nombre, deporte y descripción del torneo.'],
  ['Configuración', 'Periodos, puntuación e inscripciones.'],
  ['Fases', 'Estructura competitiva del torneo.'],
  ['Grupos', 'Grupos por fase (asignación de equipos en Fase 3).'],
  ['Reglas de avance', 'Cómo clasifican y avanzan los equipos.'],
] as const

export function TournamentWizardPage() {
  const navigate = useNavigate()
  const { step, goTo, next, prev } = useWizardStep()
  const createTournament = useCreateTournament()

  const [created, setCreated] = useState<Tournament | null>(null)
  const [groupStageId, setGroupStageId] = useState<number | null>(null)
  const [ruleStageId, setRuleStageId] = useState<number | null>(null)

  const maxReached = created ? 5 : step <= 2 ? step : 2

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: DEFAULT_TOURNAMENT_FORM,
    mode: 'onTouched',
  })

  // Advance step 1 → 2 after validating only the basics fields.
  const handleStep1Next = async () => {
    const values = form.getValues()
    const parsed = basicsSchema.safeParse(values)
    if (!parsed.success) {
      await form.trigger(['name', 'sport_id', 'description', 'logo_url'])
      return
    }
    next()
  }

  // Create the tournament when leaving step 2.
  const handleStep2Next = async () => {
    const values = form.getValues()
    const parsed = configSchema.safeParse(values)
    if (!parsed.success) {
      await form.trigger([
        'periods_count',
        'points_win',
        'points_draw',
        'points_loss',
        'starts_at',
      ])
      return
    }
    if (created) {
      next()
      return
    }
    try {
      const tournament = await createTournament.mutateAsync(
        formToPayload(form.getValues()),
      )
      setCreated(tournament)
      toast.success('Torneo creado. Continúa configurando las fases.')
      next()
    } catch (error) {
      applyApiError(error, form.setError)
    }
  }

  const [title, description] = STEP_TITLES[step - 1]

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Crear torneo</h1>
        <p className="text-muted-foreground text-sm">
          Paso {step} de 5
        </p>
      </div>

      <WizardStepper step={step} maxReached={maxReached} onStepClick={goTo} />

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step <= 2 ? (
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
                {step === 1 ? (
                  <BasicsFields control={form.control} />
                ) : (
                  <ConfigFields control={form.control} />
                )}
              </form>
            </Form>
          ) : !created ? (
            <p className="text-muted-foreground text-sm">
              Completa los pasos anteriores primero.
            </p>
          ) : step === 3 ? (
            <StageManager tournamentId={created.id} />
          ) : step === 4 ? (
            <div className="space-y-4">
              <StagePicker
                tournamentId={created.id}
                value={groupStageId}
                onChange={setGroupStageId}
              />
              {groupStageId ? <GroupManager stageId={groupStageId} /> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <StagePicker
                tournamentId={created.id}
                value={ruleStageId}
                onChange={setRuleStageId}
              />
              {ruleStageId ? (
                <AdvancementRuleManager stageId={ruleStageId} />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prev}
          disabled={step === 1}
          type="button"
        >
          Atrás
        </Button>

        {step === 1 ? (
          <Button type="button" onClick={handleStep1Next}>
            Siguiente
          </Button>
        ) : step === 2 ? (
          <Button
            type="button"
            onClick={handleStep2Next}
            disabled={createTournament.isPending}
          >
            {createTournament.isPending ? 'Creando…' : 'Crear y continuar'}
          </Button>
        ) : step < 5 ? (
          <Button type="button" onClick={next}>
            Siguiente
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Finalizar
          </Button>
        )}
      </div>
    </div>
  )
}
