import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import {
  applyTheme,
  subscribeSystemTheme,
  useThemeStore,
} from '@/stores/themeStore'
import { AuthBootstrap } from './AuthBootstrap'
import { router } from './router'

export function App() {
  const mode = useThemeStore((s) => s.mode)

  // Apply persisted theme on mount and keep <html> in sync.
  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  // Follow the OS color scheme live while in `system` mode (registered once).
  useEffect(
    () => subscribeSystemTheme(() => useThemeStore.getState().mode),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
