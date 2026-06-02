import { useRef, useState } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormSetValue,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Camera,
  ImageIcon,
  Loader2Icon,
  Plus,
  Trash2,
  UploadIcon,
} from 'lucide-react'
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
import {
  useCreateRegistration,
  useUploadRegistrationLogo,
  useUploadRegistrationPhoto,
} from '../api/useRegistrations'
import {
  DEFAULT_SELF_REGISTRATION_FORM,
  DEFAULT_SELF_REGISTRATION_PLAYER,
  selfRegistrationSchema,
  type SelfRegistrationFormValues,
} from '../schemas'
import type { Registration } from '../types'

interface SelfRegistrationFormProps {
  tournamentId: number
  registrationCode: string
  onSuccess: (registration: Registration) => void
}

const KNOWN_FIELDS = ['team_name', 'short_name', 'logo_url', 'coach_name'] as const

export function SelfRegistrationForm({
  tournamentId,
  registrationCode,
  onSuccess,
}: SelfRegistrationFormProps) {
  const createRegistration = useCreateRegistration(tournamentId)
  const uploadLogo = useUploadRegistrationLogo(tournamentId)

  const form = useForm<SelfRegistrationFormValues>({
    resolver: zodResolver(selfRegistrationSchema),
    defaultValues: DEFAULT_SELF_REGISTRATION_FORM,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  })

  const logoUrl = useWatch({ control: form.control, name: 'logo_url' })
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.')
      return
    }
    uploadLogo.mutate(
      { file, code: registrationCode },
      {
        onSuccess: (data) => {
          form.setValue('logo_url', data.logo_url, { shouldDirty: true })
          toast.success('Logo subido')
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'No se pudo subir el logo',
          )
        },
      },
    )
  }

  const onSubmit = async (values: SelfRegistrationFormValues) => {
    try {
      const registration = await createRegistration.mutateAsync({
        registration_code: registrationCode,
        team_name: values.team_name.trim(),
        short_name: values.short_name?.trim() || null,
        logo_url: values.logo_url?.trim() || null,
        coach_name: values.coach_name?.trim() || null,
        players: values.players.map((p) => ({
          document_id: p.document_id.trim(),
          full_name: p.full_name.trim(),
          birthdate: p.birthdate?.trim() || null,
          phone: p.phone?.trim() || null,
          alias: p.alias?.trim() || null,
          shirt_number:
            p.shirt_number && p.shirt_number !== ''
              ? Number(p.shirt_number)
              : null,
          position: p.position?.trim() || null,
          photo_url: p.photo_url?.trim() || null,
          is_captain: p.is_captain,
        })),
      })
      toast.success('Inscripción enviada. Espera la aprobación del organizador.')
      onSuccess(registration)
    } catch (error) {
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Team data */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Datos del equipo</h3>

          {/* Team logo uploader (optional, 398x398) */}
          <div className="flex items-center gap-4">
            <div className="bg-muted relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo del equipo"
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="text-muted-foreground size-7" />
              )}
              {uploadLogo.isPending && (
                <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
                  <Loader2Icon className="size-5 animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadLogo.isPending}
                onClick={() => logoInputRef.current?.click()}
              >
                <UploadIcon className="size-4" />
                {logoUrl ? 'Cambiar logo' : 'Subir logo (opcional)'}
              </Button>
              <p className="text-muted-foreground text-xs">
                Se recorta a 398×398 px automáticamente.
              </p>
            </div>
          </div>

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
        </div>

        {/* Roster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Jugadores ({fields.length})
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...DEFAULT_SELF_REGISTRATION_PLAYER })}
            >
              <Plus className="size-4" />
              Agregar jugador
            </Button>
          </div>

          {form.formState.errors.players?.root ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.players.root.message}
            </p>
          ) : null}

          {fields.map((field, index) => (
            <RosterPlayerFields
              key={field.id}
              control={form.control}
              setValue={form.setValue}
              index={index}
              tournamentId={tournamentId}
              registrationCode={registrationCode}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

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

interface RosterPlayerFieldsProps {
  control: Control<SelfRegistrationFormValues>
  setValue: UseFormSetValue<SelfRegistrationFormValues>
  index: number
  tournamentId: number
  registrationCode: string
  canRemove: boolean
  onRemove: () => void
}

function RosterPlayerFields({
  control,
  setValue,
  index,
  tournamentId,
  registrationCode,
  canRemove,
  onRemove,
}: RosterPlayerFieldsProps) {
  const uploadPhoto = useUploadRegistrationPhoto(tournamentId)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.')
      return
    }
    uploadPhoto.mutate(
      { file, code: registrationCode },
      {
        onSuccess: (data) => {
          setPreview(data.photo_url)
          setValue(`players.${index}.photo_url`, data.photo_url, {
            shouldDirty: true,
          })
          toast.success('Foto subida')
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'No se pudo subir la foto',
          )
        },
      },
    )
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {preview ? (
              <img
                src={preview}
                alt="Foto del jugador"
                className="size-full object-cover"
              />
            ) : (
              <Camera className="text-muted-foreground size-6" />
            )}
            {uploadPhoto.isPending && (
              <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
                <Loader2Icon className="size-5 animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadPhoto.isPending}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera className="size-4" />
              {preview ? 'Cambiar foto' : 'Foto (opcional)'}
            </Button>
          </div>
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label="Eliminar jugador"
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name={`players.${index}.document_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input placeholder="Cédula del jugador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`players.${index}.full_name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del jugador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`players.${index}.shirt_number`}
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
          control={control}
          name={`players.${index}.position`}
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
        <FormField
          control={control}
          name={`players.${index}.birthdate`}
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
          control={control}
          name={`players.${index}.phone`}
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
          control={control}
          name={`players.${index}.alias`}
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

      <FormField
        control={control}
        name={`players.${index}.is_captain`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
            </FormControl>
            <FormLabel className="font-normal">Capitán del equipo</FormLabel>
          </FormItem>
        )}
      />
    </div>
  )
}
