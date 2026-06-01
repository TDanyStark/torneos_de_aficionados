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
import { Form } from '@/components/ui/form'
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
import { BasicsFields } from '@/features/tournaments/components/BasicsFields'
import { ConfigFields } from '@/features/tournaments/components/ConfigFields'
import type { Tournament } from '@/features/tournaments/types'

export function TournamentEditPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const navigate = useNavigate()

  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...tournamentKeys.all, 'by-id', tournamentId],
    enabled: Number.isFinite(tournamentId) && tournamentId > 0,
    queryFn: () => apiClient.get<Tournament>(`/tournaments/${tournamentId}`),
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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold">Editar torneo</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Datos básicos</CardTitle>
            </CardHeader>
            <CardContent>
              <BasicsFields control={form.control} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigFields control={form.control} />
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
    </div>
  )
}
