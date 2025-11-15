// src/components/layout/Sidebar.tsx
import { IconClose, IconVault, IconSettings } from '../sidebar/icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Zynero</h3>

        <button className="sidebar-close-btn" onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <nav className="sidebar-nav">
        <a href="#" className="nav-link active">
          <IconVault />
          <span>Meu Cofre</span>
        </a>

        <a href="#" className="nav-link">
          <IconSettings />
          <span>Configurações</span>
        </a>
      </nav>
    </aside>
  );
};
