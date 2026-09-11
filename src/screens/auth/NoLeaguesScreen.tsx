import { AuthLayout } from './AuthLayout';

/** Implements BRD UIR-177's second sentence: an authenticated user with zero League memberships. */
export function NoLeaguesScreen() {
  return (
    <AuthLayout title="No Leagues Yet">
      <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
        You're not a member of any league yet — ask a League Administrator to send you an invitation.
      </p>
    </AuthLayout>
  );
}
