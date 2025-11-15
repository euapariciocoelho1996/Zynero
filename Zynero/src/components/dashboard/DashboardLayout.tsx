import { useState } from 'react';
import { type User } from 'firebase/auth';
import type { ReactNode } from 'react';
import './DashboardLayout.css';

import ZyneroCarousel from '../carousel/carousel';
import { Sidebar } from '../sidebar/Sidebar';
import { IconMenu } from '../sidebar/icons';
import { WelcomeHeader } from '../welcome/WelcomeHeader';
import { PasswordManager } from '../password/PasswordManager';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}

export const DashboardLayout = ({ user, onLogout, children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="main-area">
        <header className="header-top">
          <button className="header-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <IconMenu />
          </button>

          <div className="header-user">
            <span className="user-email">{user.email}</span>
            <button onClick={onLogout} className="header-logout-btn">
              Sair
            </button>
          </div>
        </header>

        <main className="content-wrapper">
          <ZyneroCarousel />
          <PasswordManager />
          {children}
        </main>
      </div>
    </div>
  );
};
