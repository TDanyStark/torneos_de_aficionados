import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="bg-background min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
