import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Trash2 } from 'lucide-react'
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
import { EmptyState } from '@/components/shared/StateMessage'
import { applyApiError } from '@/lib/formErrors'
import { groupSchema, type GroupFormValues } from '../schemas'
import {
  useCreateGroup,
  useDeleteGroup,
  useGroups,
} from '../api/useGroups'

export function GroupManager({ stageId }: { stageId: number }) {
  const { data: groups, isLoading } = useGroups(stageId)
  const createGroup = useCreateGroup(stageId)
  const deleteGroup = useDeleteGroup(stageId)

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = async (values: GroupFormValues) => {
    try {
      await createGroup.mutateAsync({
        name: values.name,
      })
      toast.success('Grupo creado')
      form.reset({ name: '' })
    } catch (error) {
      applyApiError(error, form.setError, ['name'])
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteGroup.mutateAsync(id)
      toast.success('Grupo eliminado')
    } catch {
      toast.error('No se pudo eliminar el grupo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          La asignación de equipos a los grupos se realiza en la Fase 3. Aquí
          solo defines la estructura de grupos.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-3 rounded-md border p-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del grupo</FormLabel>
                <FormControl>
                  <Input placeholder="Grupo A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Agregar grupo
            </Button>
          </div>
        </form>
      </Form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando grupos…</p>
      ) : !groups || groups.length === 0 ? (
        <EmptyState title="Sin grupos" description="Agrega grupos a esta fase." />
      ) : (
        <ul className="divide-y rounded-md border">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-2 p-3"
            >
              <span className="text-sm font-medium">{group.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(group.id)}
                aria-label="Eliminar grupo"
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
