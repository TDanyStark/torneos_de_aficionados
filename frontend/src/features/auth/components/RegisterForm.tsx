import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
import { authKeys, useRegister } from '../api/useAuth'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type RegisterValues = z.infer<typeof registerSchema>

const KNOWN_FIELDS = ['name', 'email', 'password'] as const

interface RegisterFormProps {
  /** Where to go after a successful register. Defaults to the create wizard. */
  redirectTo?: string
}

export function RegisterForm({
  redirectTo = '/tournaments/new',
}: RegisterFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const register = useRegister()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = async (values: RegisterValues) => {
    try {
      await register.mutateAsync(values)
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      applyApiError(error, form.setError, KNOWN_FIELDS)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Tu nombre"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </Form>
  )
}
