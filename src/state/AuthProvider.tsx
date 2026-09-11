import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, setAccessToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthUser } from './AuthContext';

// Implements Architecture v1.3 §7 (Authentication & Session Handling). BRD v1.4 §8.17–8.20 now
// designs Login, Register, Forgot/Reset Password, and Accept League Invitation in full — this
// provider backs Login (`login`) and Register (`register`); the other two flows are stateless
// mutations that don't need session access (see `usePasswordReset.ts`/`useInvitation.ts`).

const REFRESH_TOKEN_STORAGE_KEY = 'matchday-refresh-token';

// §7.2: refresh token in localStorage is an accepted interim tradeoff given the backend's
// bearer-only auth today (no httpOnly cookie option exists yet) — revisit if/when the
// backend's standing-by cookie-flow middleware activates.

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const applySession = useCallback((tokens: AuthTokenResponse) => {
    setAccessToken(tokens.accessToken);
    try {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
    } catch {
      // Non-fatal — the session still works for the remainder of this tab's lifetime.
    }
    setUser(tokens.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    try {
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    let storedRefreshToken: string | null = null;
    try {
      storedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (!storedRefreshToken) return false;
    try {
      const { data } = await apiRequest<AuthTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: storedRefreshToken },
      });
      applySession(data);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [applySession, clearSession]);

  // §7.3: a 401 from any request triggers one refresh attempt before surfacing the error.
  useEffect(() => {
    setUnauthorizedHandler(refresh);
    return () => setUnauthorizedHandler(null);
  }, [refresh]);

  // Attempt to restore a session from a stored refresh token on first load, so a page
  // reload doesn't force a re-login every time.
  useEffect(() => {
    refresh().finally(() => setIsRestoringSession(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const { data } = await apiRequest<AuthTokenResponse>('/auth/login', {
        method: 'POST',
        body: { usernameOrEmail, password },
      });
      applySession(data);
    },
    [applySession],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await apiRequest<AuthTokenResponse>('/auth/register', {
        method: 'POST',
        body: { username, email, password },
      });
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isRestoringSession, login, register, logout }),
    [user, isRestoringSession, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
