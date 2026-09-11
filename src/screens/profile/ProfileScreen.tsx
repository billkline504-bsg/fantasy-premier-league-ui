import { useMyLeagues } from '../../api/hooks/useLeagueSeason';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { SystemProfileSection } from './SystemProfileSection';
import { LeagueSeasonProfileCard } from './LeagueSeasonProfileCard';
import { AppearancePreview } from './AppearancePreview';

// Implements BRD UIR-157–172 / Feature Behavior Specs (Phase 1) F-UI-001.1 & F-UI-001.2.

export function ProfileScreen() {
  const myLeagues = useMyLeagues();

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Profile</h1>
      </div>

      <SystemProfileSection />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '26px 0 14px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>User Season League Profile</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-dim)', margin: '3px 0 0' }}>
            Set independently per League (BR-007, BR-009) — changing one never touches another.
          </p>
        </div>
        <span className="scope-badge league">League-specific</span>
      </div>

      {myLeagues.isPending && <LoadingState label="Loading your leagues…" />}
      {myLeagues.error && <ErrorState error={myLeagues.error} onRetry={() => myLeagues.refetch()} />}
      {myLeagues.data && myLeagues.data.length === 0 && (
        <EmptyState>You aren't a member of any League yet.</EmptyState>
      )}

      {myLeagues.data?.map((league) => (
        <LeagueSeasonProfileCard key={league.leagueId} league={league} />
      ))}

      {myLeagues.data && myLeagues.data.length > 0 && <AppearancePreview leagues={myLeagues.data} />}
    </div>
  );
}
