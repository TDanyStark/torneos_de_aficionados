import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { applyApiError } from '@/lib/formErrors'
import { useUpdateTeam } from '../api/useTeams'
import { teamSchema, type TeamFormValues } from '../schemas'
import type { Team } from '../types'

const KNOWN_FIELDS = ['name', 'short_name', 'logo_url', 'coach_name'] as const

export function TeamEditForm({ team }: { team: Team }) {
  const updateTeam = useUpdateTeam(team.id)

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team.name,
      short_name: team.short_name ?? '',
      logo_url: team.logo_url ?? '',
    },
  })

  const onSubmit = async (values: TeamFormValues) => {
    try {
      await updateTeam.mutateAsync({
        name: values.name,
        short_name: values.short_name?.trim() || null,
        logo_url: values.logo_url?.trim() || null,
      })
      toast.success('Equipo actualizado')
    } catch (error) {
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Nombre del equipo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo (URL)</FormLabel>
              <FormControl>
                <Input placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  )
}
