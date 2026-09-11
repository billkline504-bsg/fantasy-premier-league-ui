import { useState } from 'react';
import { Tabs } from '../../components/Tabs';
import { EplTableView } from './EplTableView';
import { EplFixturesView } from './EplFixturesView';

// Implements BRD UIR-074–080 (F-UI-001.3/F-UI-001.4). UIR-074: content here must not change
// when the active league switches (see api/hooks/useEpl.ts for how "current season" is
// resolved without actually depending on which league is active for its *value*, only its
// *lookup mechanism* — API Consumption Specification v1.2 §2.3d).

type View = 'table' | 'fixtures';

export function EplScreen() {
  const [view, setView] = useState<View>('table');

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
          Premier League · not scoped to any Fantasy League (BR-329, BR-335)
        </div>
        <h1 style={{ fontSize: '1.5rem' }}>EPL</h1>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs<View>
          aria-label="EPL view"
          items={[
            { value: 'table', label: 'Table' },
            { value: 'fixtures', label: 'Fixtures' },
          ]}
          activeValue={view}
          onChange={setView}
        />
      </div>

      {view === 'table' ? <EplTableView /> : <EplFixturesView />}
    </div>
  );
}
