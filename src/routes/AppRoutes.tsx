import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../shell/AppShell';
import { RequireAuth, RequireLeagueAdministrator, RequireSystemAdministrator } from './guards';
import { useActiveLeague } from '../state/useActiveLeague';

import { LoginScreen } from '../screens/auth/LoginScreen';
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

// Implements the route table in Architecture v1.1 §5. Notably: /platform/* carries no
// :leagueId segment (§5.4, resolves BRD UIR-006a/UIR-151), and every route below the shell
// requires authentication (§7).

function RootRedirect() {
  const { activeLeagueId } = useActiveLeague();
  return <Navigate to={`/leagues/${activeLeagueId}/dashboard`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/no-access" element={<NoAccessScreen />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<RootRedirect />} />

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
