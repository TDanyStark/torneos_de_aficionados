import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Search, UserPlus } from 'lucide-react'
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePlayerLookup } from '../api/usePlayerLookup'
import { useAddPlayer } from '../api/useRoster'
import {
  addPlayerSchema,
  DEFAULT_ADD_PLAYER_FORM,
  type AddPlayerFormValues,
} from '../schemas'

interface AddPlayerFormProps {
  tournamentId: number
  teamId: number
  /** Tournament roster cap; null = unlimited. */
  rosterLimit: number | null
  /** Current number of players on the roster. */
  currentCount: number
}

const KNOWN_FIELDS = [
  'document_id',
  'full_name',
  'birthdate',
  'phone',
  'photo_url',
  'alias',
  'shirt_number',
] as const

/**
 * Add-player-by-cédula form. The document_id input drives a debounced lookup:
 * when the player already exists in the organizer pool, personal data is
 * autocompleted as read-only and only roster fields remain editable; otherwise
 * the full personal data is requested.
 */
export function AddPlayerForm({
  tournamentId,
  teamId,
  rosterLimit,
  currentCount,
}: AddPlayerFormProps) {
  const addPlayer = useAddPlayer(teamId)

  const isFull = rosterLimit != null && currentCount >= rosterLimit

  const form = useForm<AddPlayerFormValues>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: DEFAULT_ADD_PLAYER_FORM,
  })

  const documentId = useWatch({ control: form.control, name: 'document_id' })
  const debouncedDoc = useDebouncedValue(documentId, 450)
  const lookup = usePlayerLookup(tournamentId, debouncedDoc)

  const foundPlayer =
    lookup.data?.state === 'found' ? lookup.data.player : null
  const isFound = Boolean(foundPlayer)

  // Precarga read-only personal fields from the matched player.
  useEffect(() => {
    if (foundPlayer) {
      form.setValue('full_name', foundPlayer.full_name)
      form.setValue('birthdate', foundPlayer.birthdate ?? '')
      form.setValue('phone', foundPlayer.phone ?? '')
    }
  }, [foundPlayer, form])

  const onSubmit = async (values: AddPlayerFormValues) => {
    // For a NEW player, full_name is required.
    if (!isFound && (!values.full_name || values.full_name.trim() === '')) {
      form.setError('full_name', {
        type: 'manual',
        message: 'El nombre es obligatorio para un jugador nuevo',
      })
      return
    }

    try {
      await addPlayer.mutateAsync({
        document_id: values.document_id.trim(),
        shirt_number:
          values.shirt_number && values.shirt_number !== ''
            ? Number(values.shirt_number)
            : null,
        alias: values.alias?.trim() || null,
        is_captain: values.is_captain,
        is_delegate: values.is_delegate,
        // Personal fields are ignored by the backend when the player exists.
        ...(isFound
          ? {}
          : {
              full_name: values.full_name?.trim() || undefined,
              birthdate: values.birthdate?.trim() || null,
              phone: values.phone?.trim() || null,
              photo_url: values.photo_url?.trim() || null,
            }),
      })
      toast.success('Jugador agregado a la plantilla')
      form.reset(DEFAULT_ADD_PLAYER_FORM)
    } catch (error) {
      // 422 dup shirt maps to the shirt_number field.
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-md border p-4"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserPlus className="text-brand size-4" />
          Agregar jugador
        </div>

        {/* Cédula with live lookup feedback */}
        <FormField
          control={form.control}
          name="document_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className="pr-9"
                    placeholder="Escribe la cédula…"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
                  {lookup.isFetching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isFound ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </span>
              </div>
              {isFound ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Jugador encontrado: datos cargados automáticamente.
                </p>
              ) : debouncedDoc.trim().length >= 3 &&
                lookup.data?.state === 'notFound' ? (
                <p className="text-muted-foreground text-xs">
                  No registrado aún. Completa los datos del jugador.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Personal data — read-only when the player already exists */}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del jugador"
                    readOnly={isFound}
                    {...field}
                  />
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
                  <Input type="date" readOnly={isFound} {...field} />
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
                  <Input placeholder="Opcional" readOnly={isFound} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Podrás subir la foto del jugador desde la plantilla, una vez agregado.
        </p>

        {/* Roster data — always editable */}
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="flex flex-wrap gap-6">
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
                <FormLabel className="font-normal">Capitán</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_delegate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">Delegado</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {rosterLimit != null && !isFull ? (
          <p className="text-muted-foreground text-xs">
            Jugadores: {currentCount}/{rosterLimit}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isFull}
        >
          {isFull
            ? `Plantilla llena (${currentCount}/${rosterLimit})`
            : form.formState.isSubmitting
              ? 'Agregando…'
              : 'Agregar a la plantilla'}
        </Button>
      </form>
    </Form>
  )
}
