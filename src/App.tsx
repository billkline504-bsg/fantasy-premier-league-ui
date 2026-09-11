import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './api/queryClient';
import { ThemeProvider } from './state/ThemeProvider';
import { AuthProvider } from './state/AuthProvider';
import { ActiveLeagueProvider } from './state/ActiveLeagueProvider';
import { AppRoutes } from './routes/AppRoutes';

// Provider order per Architecture v1.1 §3/§4: Query (server state) and Theme/Auth/ActiveLeague
// (global client state) wrap the router, since route guards and the shell both read from them.
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ActiveLeagueProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ActiveLeagueProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
