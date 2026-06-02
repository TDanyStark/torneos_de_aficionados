import { useState } from 'react'
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/StateMessage'
import { ApiError } from '@/lib/apiClient'
import type { Referee } from '../types'
import {
  useCreateReferee,
  useDeleteReferee,
  useReferees,
  useUpdateReferee,
} from '../api/useReferees'

interface RefereesManagerProps {
  tournamentId: number
}

/**
 * Organizer-only management of the tournament's referee directory: add by
 * name, inline rename and delete (deleting auto-clears the referee from any
 * matches where it was assigned). Mounted as an "Árbitros" card on the
 * tournament edit page.
 */
export function RefereesManager({ tournamentId }: RefereesManagerProps) {
  const referees = useReferees(tournamentId)
  const createReferee = useCreateReferee(tournamentId)
  const updateReferee = useUpdateReferee(tournamentId)
  const deleteReferee = useDeleteReferee(tournamentId)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [refereeToDelete, setRefereeToDelete] = useState<Referee | null>(null)

  const onAdd = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await createReferee.mutateAsync({ name })
      toast.success('Árbitro agregado')
      setNewName('')
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo agregar el árbitro',
      )
    }
  }

  const startEdit = (referee: Referee) => {
    setEditingId(referee.id)
    setEditingName(referee.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const onSaveEdit = async (refereeId: number) => {
    const name = editingName.trim()
    if (!name) return
    try {
      await updateReferee.mutateAsync({ refereeId, payload: { name } })
      toast.success('Árbitro actualizado')
      cancelEdit()
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo actualizar el árbitro',
      )
    }
  }

  const onConfirmDelete = async () => {
    if (!refereeToDelete) return
    try {
      await deleteReferee.mutateAsync(refereeToDelete.id)
      toast.success('Árbitro eliminado')
      setRefereeToDelete(null)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el árbitro',
      )
    }
  }

  const list = referees.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="new-referee-name"
            className="text-muted-foreground block text-xs font-medium"
          >
            Nombre del árbitro
          </label>
          <Input
            id="new-referee-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAdd()
              }
            }}
            placeholder="Ej. Juan Pérez"
          />
        </div>
        <Button
          type="button"
          onClick={onAdd}
          disabled={createReferee.isPending || newName.trim().length === 0}
        >
          {createReferee.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Agregar
        </Button>
      </div>

      {referees.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : list.length === 0 ? (
        <EmptyState
          title="Sin árbitros"
          description="Agrega árbitros para poder asignarlos a los partidos."
        />
      ) : (
        <ul className="space-y-2">
          {list.map((referee) => {
            const isEditing = editingId === referee.id
            return (
              <li
                key={referee.id}
                className="bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-2"
              >
                {isEditing ? (
                  <>
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onSaveEdit(referee.id)
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelEdit()
                        }
                      }}
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Guardar"
                      disabled={
                        updateReferee.isPending ||
                        editingName.trim().length === 0
                      }
                      onClick={() => onSaveEdit(referee.id)}
                    >
                      {updateReferee.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Cancelar"
                      disabled={updateReferee.isPending}
                      onClick={cancelEdit}
                    >
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="truncate text-sm font-medium">
                      {referee.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Renombrar ${referee.name}`}
                        onClick={() => startEdit(referee)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-8"
                        aria-label={`Eliminar ${referee.name}`}
                        onClick={() => setRefereeToDelete(referee)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={refereeToDelete != null}
        onOpenChange={(next) => {
          if (!next) setRefereeToDelete(null)
        }}
        title="Eliminar árbitro"
        description="Se quitará de los partidos donde esté asignado."
        confirmLabel="Eliminar"
        destructive
        loading={deleteReferee.isPending}
        onConfirm={onConfirmDelete}
      />
    </div>
  )
}
