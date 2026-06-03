import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Ban, Crown, RotateCcw, Trash2, UserCog } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { ErrorState } from '@/components/shared/StateMessage'
import { applyApiError } from '@/lib/formErrors'
import { useAuthStore } from '@/stores/authStore'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import {
  useTeamPlayer,
  useUpdateTeamPlayer,
  useDeleteTeamPlayer,
  useUploadTeamPlayerPhoto,
} from '@/features/teams/api/useRoster'
import {
  editTeamPlayerSchema,
  type EditTeamPlayerFormValues,
} from '@/features/teams/schemas'

const KNOWN_FIELDS = [
  'shirt_number',
  'position',
  'is_captain',
  'is_delegate',
] as const

/**
 * Dedicated per-player editor (route `/t/:slug/teams/:teamId/players/:teamPlayerId/edit`).
 * Replaces the dense in-row editing that used to live in the roster list. Only
 * the roster fields the backend can mutate are editable (shirt number, position,
 * captain, delegate, photo); name and cédula are read-only by design. Organizers
 * additionally get moderation (reject / re-accept) and removal.
 */
export function PlayerEditPage() {
  const { slug, teamId, teamPlayerId } = useParams<{
    slug: string
    teamId: string
    teamPlayerId: string
  }>()
  const navigate = useNavigate()

  const tournament = useTournamentDetail(slug)
  const numericTeamId = Number(teamId)
  const numericPlayerId = Number(teamPlayerId)

  const { player, isLoading, isError } = useTeamPlayer(
    numericTeamId > 0 ? numericTeamId : undefined,
    numericPlayerId,
  )

  const updatePlayer = useUpdateTeamPlayer(numericTeamId)
  const deletePlayer = useDeleteTeamPlayer(numericTeamId)
  const uploadPhoto = useUploadTeamPlayerPhoto(numericTeamId)

  const tournamentId = tournament.data?.id ?? 0
  const registrationOpen = tournament.data?.registration_open ?? true

  // Organizers moderate (reject/re-accept) and may edit after registrations
  // close; delegates may only edit roster data while registrations are open.
  const isOrganizer = useAuthStore((s) =>
    s.roles.some(
      (r) => r.tournament_id === tournamentId && r.role === 'organizer',
    ),
  )
  const canEdit = isOrganizer || registrationOpen

  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const form = useForm<EditTeamPlayerFormValues>({
    resolver: zodResolver(editTeamPlayerSchema),
    defaultValues: {
      shirt_number: '',
      position: '',
      is_captain: false,
      is_delegate: false,
    },
  })

  useEffect(() => {
    if (player) {
      form.reset({
        shirt_number:
          player.shirt_number != null ? String(player.shirt_number) : '',
        position: player.position ?? '',
        is_captain: player.is_captain === 1,
        is_delegate: player.is_delegate === 1,
      })
    }
  }, [player, form])

  if (isLoading || tournament.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !player || numericPlayerId <= 0) {
    return <ErrorState message="No se pudo cargar el jugador." />
  }

  const rejected = player.status === 'rejected'
  const backToTeam = `/t/${slug}/teams/${teamId}/manage`

  const onSubmit = async (values: EditTeamPlayerFormValues) => {
    try {
      const shirt = values.shirt_number?.trim()
      await updatePlayer.mutateAsync({
        teamPlayerId: player.id,
        payload: {
          shirt_number: shirt ? Number(shirt) : null,
          position: values.position?.trim() || null,
          is_captain: values.is_captain,
          is_delegate: values.is_delegate,
        },
      })
      toast.success('Jugador actualizado')
      form.reset(values)
    } catch (error) {
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  const confirmReject = async () => {
    const trimmed = reason.trim()
    if (trimmed === '') {
      toast.error('Indica el motivo del rechazo.')
      return
    }
    try {
      await updatePlayer.mutateAsync({
        teamPlayerId: player.id,
        payload: { status: 'rejected', rejection_reason: trimmed },
      })
      toast.success('Jugador rechazado')
      setRejectOpen(false)
      setReason('')
    } catch {
      toast.error('No se pudo rechazar el jugador')
    }
  }

  const reaccept = async () => {
    try {
      await updatePlayer.mutateAsync({
        teamPlayerId: player.id,
        payload: { status: 'active' },
      })
      toast.success('Jugador readmitido')
    } catch {
      toast.error('No se pudo readmitir el jugador')
    }
  }

  const onDelete = async () => {
    try {
      await deletePlayer.mutateAsync(player.id)
      toast.success('Jugador retirado de la plantilla')
      navigate(backToTeam)
    } catch {
      toast.error('No se pudo retirar el jugador')
    }
  }

  const isDirty = form.formState.isDirty
  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="-ml-2 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={backToTeam}>Volver a la plantilla</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{player.full_name}</h1>
        {player.is_captain === 1 ? (
          <Badge variant="secondary" className="gap-1">
            <Crown className="size-3" />
            Capitán
          </Badge>
        ) : null}
        {player.is_delegate === 1 ? (
          <Badge variant="outline" className="gap-1">
            <UserCog className="size-3" />
            Delegado
          </Badge>
        ) : null}
        {rejected ? (
          <Badge variant="destructive" className="gap-1">
            <Ban className="size-3" />
            Rechazado
          </Badge>
        ) : null}
      </div>

      {/* Identity — read-only. The backend exposes no endpoint to change a
          player's name or cédula once created. */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader
            currentUrl={player.photo_url}
            label={`Foto de ${player.full_name}`}
            shape="circle"
            capture
            disabled={!canEdit}
            upload={async (file) => {
              const res = await uploadPhoto.mutateAsync({
                teamPlayerId: player.id,
                file,
              })
              return res.photo_url
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Nombre</p>
              <p className="text-sm font-medium">{player.full_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Cédula</p>
              <p className="text-sm font-medium">{player.document_id}</p>
            </div>
            {player.alias ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Alias</p>
                <p className="text-sm font-medium">{player.alias}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Roster data — editable. */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de plantilla</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id="player-edit-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="shirt_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dorsal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={999}
                          placeholder="Sin dorsal"
                          readOnly={!canEdit}
                          {...field}
                        />
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
                        <Input
                          placeholder="p. ej. Delantero"
                          readOnly={!canEdit}
                          {...field}
                        />
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
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Capitán</FormLabel>
                      <FormDescription>
                        Marca al jugador como capitán del equipo.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Capitán"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_delegate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Delegado</FormLabel>
                      <FormDescription>
                        El delegado puede gestionar la inscripción del equipo.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        aria-label="Delegado"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Moderation + removal — organizer only. */}
      {isOrganizer ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Moderación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejected ? (
              <div className="space-y-3">
                {player.rejection_reason ? (
                  <p className="text-destructive text-sm">
                    Motivo del rechazo: {player.rejection_reason}
                  </p>
                ) : null}
                <Button
                  variant="outline"
                  onClick={reaccept}
                  disabled={updatePlayer.isPending}
                >
                  <RotateCcw className="size-4" />
                  Readmitir jugador
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setReason('')
                  setRejectOpen(true)
                }}
              >
                <Ban className="text-destructive size-4" />
                Rechazar jugador
              </Button>
            )}

            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-3 text-sm">
                Retirar al jugador lo quita de esta plantilla. Esta acción no se
                puede deshacer.
              </p>
              <Button
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Retirar de la plantilla
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Sticky save bar — only when the user can edit. */}
      {canEdit ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
            <span className="text-muted-foreground text-sm">
              {isDirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}
            </span>
            <Button
              type="submit"
              form="player-edit-form"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRejectOpen(false)
            setReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar jugador</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo de{' '}
              <strong>{player.full_name}</strong>. El delegado verá este motivo.
              Puedes readmitirlo después.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. La cédula no coincide con el jugador."
            rows={3}
            maxLength={255}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false)
                setReason('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updatePlayer.isPending}
            >
              Rechazar jugador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Retirar a este jugador?"
        description="Se quitará de la plantilla del equipo. Esta acción no se puede deshacer."
        confirmLabel="Sí, retirar"
        cancelLabel="Cancelar"
        destructive
        loading={deletePlayer.isPending}
        onConfirm={onDelete}
      />
    </div>
  )
}
