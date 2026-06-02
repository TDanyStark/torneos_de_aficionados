import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Trophy } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuthStore, useIsAdmin } from '@/stores/authStore'

export function AppHeader() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const clear = useAuthStore((s) => s.clear)
  const isAdmin = useIsAdmin()

  const onLogout = () => {
    clear()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Trophy className="text-brand size-5" />
          <span>Torneos</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/torneos">Torneos</Link>
          </Button>
          {token ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Mis torneos</Link>
              </Button>
              {isAdmin ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/ads" className="flex items-center gap-1.5">
                    <Megaphone className="size-4" />
                    <span className="hidden sm:inline">Publicidad</span>
                  </Link>
                </Button>
              ) : null}
              <ThemeToggle />
              <span className="text-muted-foreground ml-1 hidden text-sm sm:inline">
                {user?.name ?? user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="default" size="sm" asChild>
                <Link to="/login">Ingresar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
