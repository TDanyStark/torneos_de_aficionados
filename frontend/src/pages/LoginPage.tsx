import { Navigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div className="mx-auto max-w-sm pt-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <Trophy className="text-brand size-8" />
          </div>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa para gestionar tus torneos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
