import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/apiClient'

interface FinishMatchButtonProps {
  onFinish: () => Promise<void>
  finishing: boolean
  disabled?: boolean
}

/** Referee: finish + consolidate the match behind a confirmation dialog. */
export function FinishMatchButton({
  onFinish,
  finishing,
  disabled,
}: FinishMatchButtonProps) {
  const [open, setOpen] = useState(false)

  const confirm = async () => {
    try {
      await onFinish()
      toast.success('Partido finalizado')
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo finalizar el partido',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full" disabled={disabled}>
          <Flag className="size-4" />
          Finalizar partido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar partido</DialogTitle>
          <DialogDescription>
            Se consolidará el marcador final a partir de los goles registrados y
            el partido pasará a estado «Finalizado». Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={finishing}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={finishing}>
            {finishing ? <Loader2 className="size-4 animate-spin" /> : null}
            Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
