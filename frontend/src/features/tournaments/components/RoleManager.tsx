import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, UserPlus } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/StateMessage'
import { applyApiError } from '@/lib/formErrors'
import type { TournamentRoleValue } from '../types'
import {
  useCreateRole,
  useDeleteRole,
  useTournamentRoles,
} from '../api/useRoles'

const ROLE_LABELS: Record<TournamentRoleValue, string> = {
  organizer: 'Organizador',
  referee: 'Árbitro',
  delegate: 'Delegado',
  player: 'Jugador',
}

const roleFormSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['referee', 'delegate']),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

export function RoleManager({ tournamentId }: { tournamentId: number }) {
  const { data: roles, isLoading } = useTournamentRoles(tournamentId)
  const createRole = useCreateRole(tournamentId)
  const deleteRole = useDeleteRole(tournamentId)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { email: '', role: 'referee' },
  })

  const onSubmit = async (values: RoleFormValues) => {
    try {
      await createRole.mutateAsync(values)
      toast.success('Rol asignado')
      form.reset({ email: '', role: values.role })
    } catch (error) {
      applyApiError(error, form.setError, ['email', 'role'])
    }
  }

  const onDelete = async (roleId: number) => {
    try {
      await deleteRole.mutateAsync(roleId)
      toast.success('Rol removido')
    } catch {
      toast.error('No se pudo remover el rol')
    }
  }

  return (
    <div className="space-y-5">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email del usuario</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="persona@correo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="min-w-36">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="referee">Árbitro</SelectItem>
                    <SelectItem value="delegate">Delegado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <UserPlus className="size-4" />
            Asignar
          </Button>
        </form>
      </Form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando roles…</p>
      ) : !roles || roles.length === 0 ? (
        <EmptyState
          title="Sin roles asignados"
          description="Designa árbitros o delegados por email."
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex items-center justify-between gap-2 p-3"
            >
              <div className="text-sm">
                <span className="font-medium">
                  {role.user_name ?? role.user_email ?? `Usuario #${role.user_id}`}
                </span>
                {role.user_email ? (
                  <span className="text-muted-foreground ml-2">
                    {role.user_email}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[role.role]}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(role.id)}
                  aria-label="Remover rol"
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
