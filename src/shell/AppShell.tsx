import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <>
      <TopBar />
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 20px 64px' }}>
        <Outlet />
      </main>
    </>
  );
}
