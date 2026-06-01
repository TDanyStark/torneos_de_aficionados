import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
        Anterior
      </Button>
      <span className="text-muted-foreground text-sm">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
