import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { TournamentListPage } from '@/pages/TournamentListPage'
import { TournamentDetailPage } from '@/pages/TournamentDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TournamentWizardPage } from '@/pages/TournamentWizardPage'
import { TournamentEditPage } from '@/pages/TournamentEditPage'
import { TournamentRolesPage } from '@/pages/TournamentRolesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <TournamentListPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/tournaments/:slug', element: <TournamentDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/tournaments/new', element: <TournamentWizardPage /> },
          { path: '/tournaments/:id/edit', element: <TournamentEditPage /> },
          { path: '/tournaments/:id/roles', element: <TournamentRolesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
