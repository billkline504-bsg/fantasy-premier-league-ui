import { createContext } from 'react';

export interface AuthUser {
  userId: string;
  username: string;
  isSystemAdministrator: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  /** BRD UIR-181: signs the new user in immediately — same session-application path as `login`. */
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
