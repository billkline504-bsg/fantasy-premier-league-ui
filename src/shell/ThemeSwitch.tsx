import { useTheme } from '../state/useTheme';
import type { ThemeChoice } from '../state/ThemeContext';

// Implements BRD UIR-010. Rendered both in the top bar and (a second instance of the exact
// same component, per UIR-161) inside Profile — the two are two views of one stored value,
// never independently stateful.

const CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="group" aria-label="Theme" style={{ display: 'flex', gap: 2 }}>
      {CHOICES.map((choice) => (
        <button
          key={choice.value}
          type="button"
          aria-pressed={theme === choice.value}
          title={choice.label}
          onClick={() => setTheme(choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
