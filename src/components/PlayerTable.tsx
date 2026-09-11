import { useEffect, useState, type ReactNode } from 'react';
import type { Position } from '../api/types';

// Implements BRD UIR-015 (position filter + search, applied together) and UIR-016 (sortable
// columns, toggling ascending/descending, one visible indicator on the active column) —
// Architecture v1.2 §9's "one shared component, not one ad hoc implementation per screen".
//
// Deliberately data-source-agnostic: this component only tracks and emits filter/sort/search
// *state* via `onFilterChange`; the caller decides whether to apply it server-side (as Draft
// Board does, since `getDraftPlayerPool` takes these exact three params) or client-side. The
// `sort` value's "-key for descending" convention matches the backend's own `sortQuery`
// parameter format (05-api-specification), so callers hitting a real endpoint can pass it
// straight through with no translation.

export interface PlayerTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

export interface PlayerTableFilterState {
  position: Position | 'all';
  search: string;
  sort: string | null;
}

export interface PlayerTableProps<T> {
  rows: T[];
  columns: PlayerTableColumn<T>[];
  getRowKey: (row: T) => string;
  filter: PlayerTableFilterState;
  onFilterChange: (next: PlayerTableFilterState) => void;
  rowClassName?: (row: T) => string;
  emptyMessage?: ReactNode;
  'aria-label': string;
}

const POSITIONS: { value: Position | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Gk', label: 'GK' },
  { value: 'Def', label: 'DEF' },
  { value: 'Mid', label: 'MID' },
  { value: 'Fwd', label: 'FWD' },
];

export function PlayerTable<T>({
  rows,
  columns,
  getRowKey,
  filter,
  onFilterChange,
  rowClassName,
  emptyMessage,
  'aria-label': ariaLabel,
}: PlayerTableProps<T>) {
  // Search is debounced locally so every keystroke doesn't trigger a re-fetch when a caller
  // applies this server-side; position/sort changes are immediate (no typing involved).
  const [searchInput, setSearchInput] = useState(filter.search);
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== filter.search) onFilterChange({ ...filter, search: searchInput });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [activeSortKey, activeSortDir] = filter.sort?.startsWith('-')
    ? [filter.sort.slice(1), -1 as const]
    : [filter.sort, 1 as const];

  function handleSortClick(key: string) {
    const nextDir = activeSortKey === key && activeSortDir === 1 ? -1 : 1;
    onFilterChange({ ...filter, sort: nextDir === -1 ? `-${key}` : key });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div role="group" aria-label="Filter by position" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={filter.position === p.value}
              onClick={() => onFilterChange({ ...filter, position: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search players…"
          aria-label={`Search ${ariaLabel}`}
          style={{ marginLeft: 'auto', minWidth: 200 }}
        />
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
                  style={{
                    textAlign: col.align ?? 'left',
                    padding: '9px 12px',
                    color: 'var(--ink-dim)',
                    cursor: col.sortable ? 'pointer' : undefined,
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {col.sortable && activeSortKey === col.key && (activeSortDir === 1 ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className={rowClassName?.(row)} style={{ borderTop: '1px solid var(--line)' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? 'left', padding: '9px 12px' }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && emptyMessage && (
          <div style={{ padding: '16px 20px', color: 'var(--ink-dim)', fontSize: '0.85rem' }}>{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
