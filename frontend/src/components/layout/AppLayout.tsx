import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AdSlot } from '@/components/shared/ads/AdSlot'

export function AppLayout() {
  return (
    <div className="bg-background min-h-screen">
      <AppHeader />

      {/* Global header ad — renders nothing when no slot is sold/available. */}
      <div className="mx-auto max-w-5xl px-4 pt-4 empty:hidden">
        <AdSlot placement="header" />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Sidebar is desktop-only; mobile keeps the single-column layout. */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
          <div className="min-w-0">
            <Outlet />
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <AdSlot placement="sidebar" />
            </div>
          </aside>
        </div>
      </main>

      {/* Global footer ad. */}
      <div className="mx-auto max-w-5xl px-4 pb-8 empty:hidden">
        <AdSlot placement="footer" />
      </div>
    </div>
  )
}
