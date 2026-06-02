import { Link } from 'react-router-dom'
import { ArrowRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

/**
 * Public landing CTA that funnels visitors into organizing a tournament.
 * Logged-in users go straight to the create wizard; anonymous users are sent
 * to register first (which then redirects to the wizard).
 */
export function OrganizerCta() {
  const token = useAuthStore((s) => s.token)
  const target = token ? '/tournaments/new' : '/register'

  return (
    <section className="from-brand/10 border-brand/20 relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="text-brand size-6" />
            <h2 className="text-lg font-semibold sm:text-xl">
              ¿Eres organizador? Crea tu torneo aquí
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xl text-sm">
            Configura tu competición, gestiona equipos e inscripciones, y
            comparte un enlace para que los delegados se inscriban. Es gratis y
            abierto a cualquiera.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to={target}>
            Crear mi torneo
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
