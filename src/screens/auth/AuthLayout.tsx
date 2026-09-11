import type { ReactNode } from 'react';

/**
 * Shared shell for every pre-authentication screen (Architecture v1.3 §7.1) — these render
 * with no top bar, no league switcher, no nav (BRD §8.17's lead-in note), since an Anonymous
 * Visitor has no league context to show one for. One layout, not four ad hoc page shells.
 */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-dim)', textTransform: 'uppercase', marginBottom: 4 }}>
          Matchday Manager
        </div>
        <h1 style={{ fontSize: '1.35rem', marginBottom: 20 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
