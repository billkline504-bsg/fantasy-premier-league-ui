// `Club` carries no crest/color field (API Consumption Specification pattern established for
// ProfileIcon applies here too — only {clubId, name, shortName} exists), so this renders a
// plain neutral badge rather than the mock-up's hardcoded per-club hex colors.
export function ClubBadge({ shortName }: { shortName: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 36,
        padding: '2px 8px',
        borderRadius: 999,
        background: 'var(--surface-2)',
        border: '1px solid var(--line-strong)',
        fontWeight: 700,
        fontSize: '0.72rem',
      }}
    >
      {shortName}
    </span>
  );
}
