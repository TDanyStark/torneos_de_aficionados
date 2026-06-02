import { Link, Navigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useAuthStore } from '@/stores/authStore'

export function RegisterPage() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/tournaments/new" replace />

  return (
    <div className="mx-auto max-w-sm pt-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <Trophy className="text-brand size-8" />
          </div>
          <CardTitle>Crea tu cuenta</CardTitle>
          <CardDescription>
            Regístrate para organizar torneos y gestionar tus equipos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
