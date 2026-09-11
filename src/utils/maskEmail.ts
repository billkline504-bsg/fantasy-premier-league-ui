// Implements BRD UIR-158's masked-email display (BR-015 — not shown to league members;
// masked here as an extra courtesy even on the user's own private-scope Profile screen).
// Matches the mock-up's pattern: first + last character of the local part kept, the rest
// replaced with a fixed run of bullets, domain shown in full.
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 2) return `${local[0]}•••${domain}`;
  return `${local[0]}••••${local[local.length - 1]}${domain}`;
}
