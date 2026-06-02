import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { TournamentListPage } from '@/pages/TournamentListPage'
import { TournamentDetailPage } from '@/pages/TournamentDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TournamentWizardPage } from '@/pages/TournamentWizardPage'
import { TournamentEditPage } from '@/pages/TournamentEditPage'
import { TournamentRolesPage } from '@/pages/TournamentRolesPage'
import { TeamListPage } from '@/pages/TeamListPage'
import { TeamDetailPage } from '@/pages/TeamDetailPage'
import { TeamManagePage } from '@/pages/TeamManagePage'
import { RegistrationsInboxPage } from '@/pages/RegistrationsInboxPage'
import { PlayerHistoryPage } from '@/pages/PlayerHistoryPage'
import { SelfRegistrationPage } from '@/pages/SelfRegistrationPage'
import { FixturesPage } from '@/pages/FixturesPage'
import { StandingsPage } from '@/pages/StandingsPage'
import { BracketPage } from '@/pages/BracketPage'
import { StageFixturesPage } from '@/pages/StageFixturesPage'
import { PublicMatchPage } from '@/pages/PublicMatchPage'
import { RefereeMatchPage } from '@/pages/RefereeMatchPage'
import { TopScorersPage } from '@/pages/TopScorersPage'
import { DisciplinePage } from '@/pages/DisciplinePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  // Public self-registration — TOP-LEVEL, outside AppLayout and any auth guard.
  // The link carries both the tournament id and the registration code.
  {
    path: '/inscripcion/:tournamentId/:registrationCode',
    element: <SelfRegistrationPage />,
  },
  {
    path: '/inscripcion/:registrationCode',
    element: <SelfRegistrationPage />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <TournamentListPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/tournaments/:slug', element: <TournamentDetailPage /> },

      // Public team browsing (per tournament, by slug).
      { path: '/tournaments/:slug/teams', element: <TeamListPage /> },
      {
        path: '/tournaments/:slug/teams/:teamId',
        element: <TeamDetailPage />,
      },

      // Public fixtures / standings / bracket (per tournament, by slug).
      { path: '/tournaments/:slug/fixtures', element: <FixturesPage /> },
      { path: '/tournaments/:slug/standings', element: <StandingsPage /> },
      { path: '/tournaments/:slug/bracket', element: <BracketPage /> },

      // Public live match + statistics (Fase 5).
      { path: '/partido/:id', element: <PublicMatchPage /> },
      {
        path: '/tournaments/:slug/top-scorers',
        element: <TopScorersPage />,
      },
      { path: '/tournaments/:slug/cards', element: <DisciplinePage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/tournaments/new', element: <TournamentWizardPage /> },
          { path: '/tournaments/:id/edit', element: <TournamentEditPage /> },
          { path: '/tournaments/:id/roles', element: <TournamentRolesPage /> },

          // Organizer/delegate team & registration management (by tournament id).
          {
            path: '/tournaments/:id/teams/:teamId/manage',
            element: <TeamManagePage />,
          },
          {
            path: '/tournaments/:id/registrations',
            element: <RegistrationsInboxPage />,
          },
          {
            path: '/tournaments/:id/fixtures',
            element: <StageFixturesPage />,
          },
          { path: '/players/:id/history', element: <PlayerHistoryPage /> },

          // Referee live-match control (Fase 5). Auth required; referee /
          // organizer enforced server-side (403 surfaced in-page).
          {
            path: '/arbitro/partido/:id',
            element: <RefereeMatchPage />,
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
