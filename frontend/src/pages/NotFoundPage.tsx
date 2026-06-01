import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-brand text-5xl font-bold">404</p>
      <p className="text-muted-foreground">Página no encontrada.</p>
      <Button asChild>
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  )
}
