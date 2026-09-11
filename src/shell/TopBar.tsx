import { useRef, useState } from 'react';
import styles from './TopBar.module.css';
import { PrimaryNav } from './PrimaryNav';
import { LeagueSwitcher } from './LeagueSwitcher';
import { ThemeSwitch } from './ThemeSwitch';
import { ProfileChip } from './ProfileChip';
import { OffCanvasMenu } from './OffCanvasMenu';

// Implements BRD UIR-001: the persistent top bar every screen renders inside.

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <span className={styles.brand}>MATCHDAY MANAGER</span>
        <LeagueSwitcher />
        <div className={styles.desktopNav}>
          <PrimaryNav />
        </div>
        <ThemeSwitch />
        <ProfileChip />
        <button
          ref={menuTriggerRef}
          type="button"
          className={styles.menuTrigger}
          aria-label="Open navigation menu"
          onClick={() => setIsMenuOpen(true)}
        >
          ☰
        </button>
      </div>
      <OffCanvasMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={menuTriggerRef} />
    </header>
  );
}
