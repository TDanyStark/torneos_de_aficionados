import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { EmptyState } from '@/components/shared/StateMessage'
import { applyApiError } from '@/lib/formErrors'
import {
  advancementRuleSchema,
  type AdvancementRuleFormValues,
} from '../schemas'
import {
  useAdvancementRules,
  useCreateAdvancementRule,
  useDeleteAdvancementRule,
} from '../api/useAdvancementRules'
import { useGroups } from '../api/useGroups'
import { useStages } from '../api/useStages'

interface AdvancementRuleManagerProps {
  stageId: number
  tournamentId: number
}

export function AdvancementRuleManager({
  stageId,
  tournamentId,
}: AdvancementRuleManagerProps) {
  const { data: rules, isLoading } = useAdvancementRules(stageId)
  const { data: groups } = useGroups(stageId)
  const { data: stages } = useStages(tournamentId)
  const createRule = useCreateAdvancementRule(stageId)
  const deleteRule = useDeleteAdvancementRule(stageId)

  const form = useForm<AdvancementRuleFormValues>({
    resolver: zodResolver(advancementRuleSchema),
    defaultValues: {
      group_id: null,
      qualifies_count: '1',
      eliminates_count: '0',
      target_stage_id: null,
    },
  })

  const groupOptions: SelectOption<number>[] = (groups ?? []).map((g) => ({
    value: g.id,
    label: g.name,
  }))
  const stageOptions: SelectOption<number>[] = (stages ?? [])
    .filter((s) => s.id !== stageId)
    .map((s) => ({ value: s.id, label: s.name }))

  const groupName = (id: number | null): string | null =>
    id == null ? null : (groupOptions.find((o) => o.value === id)?.label ?? null)
  const stageName = (id: number | null): string | null =>
    id == null ? null : (stageOptions.find((o) => o.value === id)?.label ?? null)

  const onSubmit = async (values: AdvancementRuleFormValues) => {
    try {
      await createRule.mutateAsync({
        group_id: values.group_id,
        qualifies_count: Number(values.qualifies_count),
        eliminates_count: Number(values.eliminates_count),
        target_stage_id: values.target_stage_id,
      })
      toast.success('Regla creada')
      form.reset({
        group_id: null,
        qualifies_count: '1',
        eliminates_count: '0',
        target_stage_id: null,
      })
    } catch (error) {
      applyApiError(error, form.setError, [
        'group_id',
        'qualifies_count',
        'eliminates_count',
        'target_stage_id',
      ])
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteRule.mutateAsync(id)
      toast.success('Regla eliminada')
    } catch {
      toast.error('No se pudo eliminar la regla')
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
            name="qualifies_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clasifican</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormDescription>Equipos que avanzan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eliminates_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eliminan</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormDescription>Equipos eliminados.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo</FormLabel>
                <ReactSelect<SelectOption<number>>
                  isClearable
                  placeholder="Toda la fase"
                  options={groupOptions}
                  value={
                    groupOptions.find((o) => o.value === field.value) ?? null
                  }
                  onChange={(opt) => field.onChange(opt?.value ?? null)}
                />
                <FormDescription>
                  Déjalo en «Toda la fase» para aplicar a todos los grupos.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="target_stage_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fase destino</FormLabel>
                <ReactSelect<SelectOption<number>>
                  isClearable
                  placeholder="Sin destino"
                  options={stageOptions}
                  value={
                    stageOptions.find((o) => o.value === field.value) ?? null
                  }
                  onChange={(opt) => field.onChange(opt?.value ?? null)}
                />
                <FormDescription>
                  Fase a la que avanzan los equipos clasificados.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Agregar regla
            </Button>
          </div>
        </form>
      </Form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando reglas…</p>
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          title="Sin reglas"
          description="Define cómo avanzan los equipos."
        />
      ) : (
        <ul className="divide-y rounded-md border">
          {rules.map((rule) => {
            const group = groupName(rule.group_id)
            const target = stageName(rule.target_stage_id)
            return (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-2 p-3 text-sm"
              >
                <span>
                  Clasifican <strong>{rule.qualifies_count}</strong>, eliminan{' '}
                  <strong>{rule.eliminates_count}</strong>
                  {group ? ` · ${group}` : ' · toda la fase'}
                  {target ? ` → ${target}` : ''}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(rule.id)}
                  aria-label="Eliminar regla"
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
