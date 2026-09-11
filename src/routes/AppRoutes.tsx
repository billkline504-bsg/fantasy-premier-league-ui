import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../shell/AppShell';
import { RequireAnonymous, RequireAuth, RequireLeagueAdministrator, RequireSystemAdministrator } from './guards';
import { PostAuthRedirect } from '../components/PostAuthRedirect';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { AcceptInvitationScreen } from '../screens/auth/AcceptInvitationScreen';
import { NoLeaguesScreen } from '../screens/auth/NoLeaguesScreen';
import { NoAccessScreen } from '../screens/errors/NoAccessScreen';
import { NotFoundScreen } from '../screens/errors/NotFoundScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { LineupScreen } from '../screens/lineup/LineupScreen';
import { SquadScreen } from '../screens/squad/SquadScreen';
import { TableScreen } from '../screens/league/TableScreen';
import { ScheduleScreen } from '../screens/league/ScheduleScreen';
import { EplScreen } from '../screens/league/EplScreen';
import { PredictionsScreen } from '../screens/league/PredictionsScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { DraftBoardScreen } from '../screens/draft/DraftBoardScreen';
import { MakeupPicksScreen } from '../screens/draft/MakeupPicksScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { AuditLogScreen } from '../screens/admin/AuditLogScreen';
import { ScoreCorrectionsScreen } from '../screens/admin/ScoreCorrectionsScreen';
import { SecurityScreen } from '../screens/platform/SecurityScreen';
import { UsernameDisplayPolicyScreen } from '../screens/platform/UsernameDisplayPolicyScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

// Implements the route table in Architecture v1.3 §5. Notably: /platform/* carries no
// :leagueId segment (§5.4, resolves BRD UIR-006a/UIR-151), every route below the shell
// requires authentication (§7), and the auth/onboarding routes added in v1.3 (§5.6) sit
// entirely outside the shell, since an Anonymous Visitor has no league context to show one for.

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireAnonymous>
            <LoginScreen />
          </RequireAnonymous>
        }
      />
      <Route
        path="/register"
        element={
          <RequireAnonymous>
            <RegisterScreen />
          </RequireAnonymous>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RequireAnonymous>
            <ForgotPasswordScreen />
          </RequireAnonymous>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RequireAnonymous>
            <ResetPasswordScreen />
          </RequireAnonymous>
        }
      />
      <Route path="/invite/:token" element={<AcceptInvitationScreen />} />
      <Route
        path="/no-leagues"
        element={
          <RequireAuth>
            <NoLeaguesScreen />
          </RequireAuth>
        }
      />
      <Route path="/no-access" element={<NoAccessScreen />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<PostAuthRedirect />} />

        <Route path="/leagues/:leagueId">
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="lineup" element={<LineupScreen />} />
          <Route path="squad" element={<SquadScreen />} />
          <Route path="table" element={<TableScreen />} />
          <Route path="schedule" element={<ScheduleScreen />} />
          <Route path="epl" element={<EplScreen />} />
          <Route path="predictions" element={<PredictionsScreen />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="draft" element={<DraftBoardScreen />} />
          <Route path="draft/makeup" element={<MakeupPicksScreen />} />
          <Route path="messages" element={<MessagesScreen />} />
          <Route
            path="admin/audit"
            element={
              <RequireLeagueAdministrator>
                <AuditLogScreen />
              </RequireLeagueAdministrator>
            }
          />
          <Route
            path="admin/corrections"
            element={
              <RequireLeagueAdministrator>
                <ScoreCorrectionsScreen />
              </RequireLeagueAdministrator>
            }
          />
        </Route>

        <Route path="/profile" element={<ProfileScreen />} />

        <Route
          path="/platform/security"
          element={
            <RequireSystemAdministrator>
              <SecurityScreen />
            </RequireSystemAdministrator>
          }
        />
        <Route
          path="/platform/username-policy"
          element={
            <RequireSystemAdministrator>
              <UsernameDisplayPolicyScreen />
            </RequireSystemAdministrator>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}
