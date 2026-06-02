import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/StateMessage'
import { applyApiError } from '@/lib/formErrors'
import { stageSchema, type StageFormValues } from '../schemas'
import type { StageType } from '../types'
import {
  useCreateStage,
  useDeleteStage,
  useStages,
} from '../api/useStages'

const STAGE_TYPE_LABELS: Record<StageType, string> = {
  league: 'Liga',
  groups: 'Grupos',
  knockout: 'Eliminatoria',
}

export function StageManager({ tournamentId }: { tournamentId: number }) {
  const { data: stages, isLoading } = useStages(tournamentId)
  const createStage = useCreateStage(tournamentId)
  const deleteStage = useDeleteStage(tournamentId)

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: '',
      type: 'league',
      legs: '1',
    },
  })

  const onSubmit = async (values: StageFormValues) => {
    try {
      await createStage.mutateAsync({
        name: values.name,
        type: values.type,
        legs: Number(values.legs) === 2 ? 2 : 1,
      })
      toast.success('Fase creada')
      form.reset({
        name: '',
        type: 'league',
        legs: '1',
      })
    } catch (error) {
      applyApiError(error, form.setError, ['name', 'type', 'legs'])
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteStage.mutateAsync(id)
      toast.success('Fase eliminada')
    } catch {
      toast.error('No se pudo eliminar la fase')
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Fase de grupos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(STAGE_TYPE_LABELS) as StageType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {STAGE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partidos</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Ida</SelectItem>
                    <SelectItem value="2">Ida y vuelta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Agregar fase
            </Button>
          </div>
        </form>
      </Form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando fases…</p>
      ) : !stages || stages.length === 0 ? (
        <EmptyState
          title="Sin fases"
          description="Agrega al menos una fase para tu torneo."
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {stages.map((stage) => (
            <li
              key={stage.id}
              className="flex items-center justify-between gap-2 p-3"
            >
              <div className="text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground ml-2">
                  {STAGE_TYPE_LABELS[stage.type]} ·{' '}
                  {stage.legs === 2 ? 'Ida y vuelta' : 'Ida'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(stage.id)}
                aria-label="Eliminar fase"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
