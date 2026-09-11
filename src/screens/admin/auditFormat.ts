import type { AdminActionType } from '../../api/types';

/**
 * `AdministrativeAction.beforeState`/`afterState` are `additionalProperties: true` — literally
 * untyped JSON — and there is no per-`actionType` schema documenting which keys to expect
 * (API Consumption Specification v1.9 §2.3p). Rather than hardcoding field names this client
 * can't confirm against the running API, the "plain-language summary" BRD UIR-127/131/132 call
 * for is generated generically: every top-level key that differs between the two objects is
 * rendered as `key: before → after`. This degrades gracefully for every `actionType`, including
 * ones with no documented convention at all, and the full untyped objects remain available
 * verbatim in the row's expanded detail (UIR-020/128) as ground truth either way.
 */
export function summarizeChange(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string {
  const beforeObj = before ?? {};
  const afterObj = after ?? {};
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  const changed: string[] = [];
  for (const key of keys) {
    const b = beforeObj[key];
    const a = afterObj[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changed.push(`${key}: ${formatValue(b)} → ${formatValue(a)}`);
    }
  }
  return changed.length > 0 ? changed.join(', ') : 'No recorded change.';
}

function formatValue(value: unknown): string {
  if (value === undefined) return '—';
  if (value === null) return 'none';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const ACTION_TYPE_LABELS: Record<AdminActionType, string> = {
  RosterCorrection: 'Roster Correction',
  ScoreOverride: 'Score Override',
  ScoreOverrideUndo: 'Score Override Undo',
  ReplacementEligibilityGranted: 'Replacement Eligibility Granted',
  SeasonEndingInjuryDeclared: 'Season-Ending Injury Declared',
  DraftTimerExtended: 'Draft Timer Extended',
  ConfigurationChanged: 'Configuration Changed',
  Other: 'Other',
};

export function actionTypeLabel(actionType: AdminActionType): string {
  return ACTION_TYPE_LABELS[actionType] ?? actionType;
}
