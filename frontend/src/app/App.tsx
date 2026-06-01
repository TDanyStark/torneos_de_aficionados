import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import { applyTheme, useThemeStore } from '@/stores/themeStore'
import { AuthBootstrap } from './AuthBootstrap'
import { router } from './router'

export function App() {
  const mode = useThemeStore((s) => s.mode)

  // Apply persisted theme on mount and keep <html> in sync.
  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
