import { Link, NavLink, Outlet } from 'react-router-dom';
import { BackupControls } from './BackupControls';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <Link to="/">Q · Notes</Link>
            <span className="brand-subtitle">Marginalia for the Qur&apos;an</span>
          </div>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end>
            Surahs
          </NavLink>
          <NavLink to="/notes">All notes</NavLink>
          <NavLink to="/topics">Topics</NavLink>
          <NavLink to="/bookmarks">Bookmarks</NavLink>
        </nav>
        <div className="header-spacer" />
        <ThemeToggle />
        <BackupControls />
      </header>
      <div className="header-divider" aria-hidden="true" />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
