// Implements BRD UIR-179: a live, continuous strength *estimate*, never a fixed composition
// checklist. BR-285 specifies the backend evaluates strength via its own estimation mechanism
// with a 12-character effective-length floor — this client cannot reproduce that exact
// algorithm, so this is a simpler, illustrative heuristic (length + character-class variety +
// a small common-password blocklist) meant only to give the user useful live feedback, not to
// guarantee agreement with the backend's own verdict. The backend's response remains
// authoritative regardless of what this estimate shows.

export type PasswordStrengthLevel = 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  level: PasswordStrengthLevel;
  label: string;
  /** BR-285's one stated concrete floor — the minimum this client actually gates submission on. */
  meetsMinimumLength: boolean;
}

const LEVELS: { level: PasswordStrengthLevel; label: string }[] = [
  { level: 'very-weak', label: 'Very weak' },
  { level: 'weak', label: 'Weak' },
  { level: 'fair', label: 'Fair' },
  { level: 'good', label: 'Good' },
  { level: 'strong', label: 'Strong' },
];

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456789012', 'qwertyuiop12',
  'letmein12345', 'iloveyou1234', 'welcome12345', 'admin12345678', '12345678901234',
]);

const MINIMUM_LENGTH = 12;

export function estimatePasswordStrength(password: string): PasswordStrengthResult {
  const meetsMinimumLength = password.length >= MINIMUM_LENGTH;

  if (password.length === 0) {
    return { score: 0, ...LEVELS[0], meetsMinimumLength };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { score: 0, ...LEVELS[0], meetsMinimumLength };
  }

  let variety = 0;
  if (/[a-z]/.test(password)) variety++;
  if (/[A-Z]/.test(password)) variety++;
  if (/[0-9]/.test(password)) variety++;
  if (/[^A-Za-z0-9]/.test(password)) variety++;

  let score: 0 | 1 | 2 | 3 | 4;
  if (password.length < 8) {
    score = variety >= 3 ? 1 : 0;
  } else if (password.length < 12) {
    score = variety >= 3 ? 2 : 1;
  } else if (password.length < 16) {
    score = variety >= 3 ? 3 : 2;
  } else {
    score = variety >= 2 ? 4 : 3;
  }

  return { score, ...LEVELS[score], meetsMinimumLength };
}
