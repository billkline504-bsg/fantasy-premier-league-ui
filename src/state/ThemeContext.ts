import { createContext } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeChoice;
  setTheme: (choice: ThemeChoice) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
