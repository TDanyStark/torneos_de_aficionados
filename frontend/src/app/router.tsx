import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { TournamentListPage } from '@/pages/TournamentListPage'
import { TournamentPage } from '@/pages/TournamentPage'
import {
  LegacyTeamRedirect,
  LegacyTournamentRedirect,
} from '@/components/layout/LegacyTournamentRedirect'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TournamentWizardPage } from '@/pages/TournamentWizardPage'
import { TournamentEditPage } from '@/pages/TournamentEditPage'
import { TournamentRolesPage } from '@/pages/TournamentRolesPage'
import { TeamDetailPage } from '@/pages/TeamDetailPage'
import { TeamManagePage } from '@/pages/TeamManagePage'
import { RegistrationsInboxPage } from '@/pages/RegistrationsInboxPage'
import { TournamentTeamsPage } from '@/pages/TournamentTeamsPage'
import { PlayerHistoryPage } from '@/pages/PlayerHistoryPage'
import { SelfRegistrationPage } from '@/pages/SelfRegistrationPage'
import { BracketPage } from '@/pages/BracketPage'
import { StageFixturesPage } from '@/pages/StageFixturesPage'
import { PublicMatchPage } from '@/pages/PublicMatchPage'
import { RefereeMatchPage } from '@/pages/RefereeMatchPage'
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
      { path: '/', element: <HomePage /> },
      { path: '/torneos', element: <TournamentListPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },

      // Canonical public tournament hub (slug-based) with URL-state tabs.
      { path: '/t/:slug', element: <TournamentPage /> },
      { path: '/t/:slug/equipo/:teamId', element: <TeamDetailPage /> },

      // Public live match (Fase 5) — already canonical.
      { path: '/partido/:id', element: <PublicMatchPage /> },

      // Knockout bracket — kept reachable at its own slug path (not a primary
      // hub tab); the hub's Fixtures/Tabla cover league play.
      { path: '/tournaments/:slug/bracket', element: <BracketPage /> },

      // Authed organizer/delegate routes (by tournament id). Declared BEFORE the
      // legacy public `/tournaments/:slug/*` redirects so a numeric path like
      // `/tournaments/32/fixtures` resolves to the management page instead of
      // being shadowed by the same-shape legacy slug redirect (which would
      // forward to the slug-only public hub and 404).
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/tournaments/new', element: <TournamentWizardPage /> },
          { path: '/tournaments/:id/edit', element: <TournamentEditPage /> },
          { path: '/tournaments/:id/roles', element: <TournamentRolesPage /> },

          // Organizer/delegate team & registration management (by tournament id).
          // The teams list must precede the legacy `/tournaments/:slug/teams`
          // redirect so a numeric id resolves to this management page.
          {
            path: '/tournaments/:id/teams',
            element: <TournamentTeamsPage />,
          },
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

      // Legacy public slug routes → redirect to the canonical hub, preserving
      // slug/teamId and mapping to the right tab.
      {
        path: '/tournaments/:slug',
        element: <LegacyTournamentRedirect />,
      },
      {
        path: '/tournaments/:slug/fixtures',
        element: <LegacyTournamentRedirect tab="fixtures" />,
      },
      {
        path: '/tournaments/:slug/standings',
        element: <LegacyTournamentRedirect tab="tabla" />,
      },
      {
        path: '/tournaments/:slug/teams',
        element: <LegacyTournamentRedirect tab="equipos" />,
      },
      {
        path: '/tournaments/:slug/teams/:teamId',
        element: <LegacyTeamRedirect />,
      },
      {
        path: '/tournaments/:slug/top-scorers',
        element: <LegacyTournamentRedirect tab="goleadores" />,
      },
      {
        path: '/tournaments/:slug/cards',
        element: <LegacyTournamentRedirect tab="disciplina" />,
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
