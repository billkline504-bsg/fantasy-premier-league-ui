import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, setAccessToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthUser } from './AuthContext';

// Implements Architecture v1.1 §7 (Authentication & Session Handling). BRD DEC-UI-007 defers
// designing a real login/registration screen — §7.1 assumes a minimal, unstyled placeholder
// form instead (screens/auth/LoginScreen), which is what this provider backs. Replace both
// wholesale once a real BRD/UIR pass covers auth.

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

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isRestoringSession, login, logout }),
    [user, isRestoringSession, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
