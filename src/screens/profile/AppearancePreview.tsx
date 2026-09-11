import { useCurrentUser, useProfileIcons } from '../../api/hooks/useIdentity';
import { useMyMembership } from '../../api/hooks/useLeagueSeason';
import type { League } from '../../api/types';
import { LoadingState } from '../../components/LoadingState';

// Implements BRD UIR-167 (BR-277): recomputes live as the user changes their username,
// default icon, or any league-specific override elsewhere on this screen — because this reads
// from the same TanStack Query cache those mutations update (Architecture §4.1), no extra
// wiring is needed for that to just work.

function AppearancePreviewRow({ league }: { league: League }) {
  const membership = useMyMembership(league.leagueId);
  const profileIcons = useProfileIcons();
  const currentUser = useCurrentUser();

  if (membership.isPending || profileIcons.isPending || currentUser.isPending) {
    return <LoadingState label={`Loading ${league.name}…`} />;
  }
  if (!membership.data || !currentUser.data) return null;

  const icon = profileIcons.data?.find((i) => i.profileIconId === membership.data!.effectiveIconId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon && (
        <img src={icon.assetIdentifier} alt="" width={32} height={32} style={{ borderRadius: '50%' }} />
      )}
      <div>
        <b style={{ display: 'block' }}>{currentUser.data.username}</b>
        <small style={{ color: 'var(--ink-dim)' }}>{league.name}</small>
      </div>
    </div>
  );
}

export function AppearancePreview({ leagues }: { leagues: League[] }) {
  return (
    <section className="card">
      <div style={{ padding: '16px 20px 0' }}>
        <h3 style={{ fontSize: '1.05rem' }}>How You'll Appear (BR-277)</h3>
      </div>
      <div style={{ display: 'flex', gap: 28, padding: '16px 20px', flexWrap: 'wrap' }}>
        {leagues.map((league) => (
          <AppearancePreviewRow key={league.leagueId} league={league} />
        ))}
      </div>
    </section>
  );
}
