import { useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemeChoice } from './ThemeContext';

// Implements BRD UIR-010 (system/light/dark, persisted, shared by the top-bar switch
// and Profile's duplicate control per UIR-161) and Architecture v1.1 §4.2.

const STORAGE_KEY = 'matchday-theme';

function readStoredTheme(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back to system.
  }
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => readStoredTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  function setTheme(choice: ThemeChoice) {
    setThemeState(choice);
    try {
      if (choice === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, choice);
      }
    } catch {
      // Non-fatal — the in-memory choice for this session still applies.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
