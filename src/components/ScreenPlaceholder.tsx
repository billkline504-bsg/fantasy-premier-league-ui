// Honest scaffold stub: every screen route below actually renders and navigates, but its
// real content (per its BRD UIR range and Feature Behavior Spec) is not yet built. Replace
// each usage with the real screen as its feature is implemented — do not leave this in place
// and call the feature done.

export interface ScreenPlaceholderProps {
  title: string;
  uirRange: string;
  feature: string;
}

export function ScreenPlaceholder({ title, uirRange, feature }: ScreenPlaceholderProps) {
  return (
    <section>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{title}</h1>
      <p style={{ color: 'var(--ink-dim)', fontSize: '0.85rem' }}>
        Scaffold placeholder for <code>{feature}</code> ({uirRange}) — not yet implemented. See
        the Feature Behavior Specifications in <code>docs/aidlc/04-user-stories/</code>.
      </p>
    </section>
  );
}
