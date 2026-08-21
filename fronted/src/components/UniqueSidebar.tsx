import { useState, useRef } from 'react';
import { NAVIGATION, type NavGroup } from '../navigation';
import type { UserData } from '../Login';
import './UniqueSidebar.css';

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  modules: string[];
  currentUser: UserData;
  onLogout: () => void;
  moduleBadgeCounts?: Record<string, number>;
}

export default function UniqueSidebar({
  activePage,
  onNavigate,
  modules,
  currentUser: _currentUser,
  onLogout,
  moduleBadgeCounts,
}: Props) {
  const [hoveredPopover, setHoveredPopover] = useState<{ top: number; label: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = NAVIGATION.filter(
    (group) => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, group: NavGroup) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredPopover({ top: rect.top + rect.height / 2, label: group.label });
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHoveredPopover(null), 120);
  };

  const handleModuleClick = (group: NavGroup) => {
    if (group.name === 'Overview') {
      onNavigate('Overview.Overview');
    } else {
      onNavigate(`${group.name}.Summary`);
    }
  };

  return (
    <aside className="unique-sidebar">
      {/* Brand logo & title — lowered down with comfortable margin */}
      <div className="unique-brand">
        <div className="unique-logo-mark">🧾</div>
        <div className="unique-brand-lines">
          <span className="unique-brand-text">AMS</span>
          <span className="unique-brand-sub">ERP</span>
        </div>
      </div>

      {/* Navigation container — Fixed non-scrolling layout */}
      <nav className="unique-nav">
        {groups.map((group) => {
          const active = activePage.startsWith(group.name + '.');
          const Icon = group.icon;
          return (
            <div
              className="unique-item-wrap"
              key={group.moduleId}
              onMouseEnter={(e) => handleMouseEnter(e, group)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={'unique-item' + (active ? ' active' : '')}
                onClick={() => handleModuleClick(group)}
                title={group.label}
              >
                <div className="unique-icon-circle">
                  <Icon className="unique-icon" size={16} strokeWidth={1.9} />
                </div>
                <span className="unique-label">{group.short}</span>
                {moduleBadgeCounts?.[group.moduleId] ? (
                  <span className="unique-badge">{moduleBadgeCounts[group.moduleId]}</span>
                ) : null}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Floating Hover Popover — Fixed positioned outside */}
      {hoveredPopover && (
        <div
          className="unique-popover"
          style={{ top: hoveredPopover.top }}
        >
          <div className="popover-header">{hoveredPopover.label}</div>
        </div>
      )}

      {/* Footer / Logout */}
      <div className="unique-footer">
        <button className="unique-logout" onClick={onLogout}>
          <span className="unique-logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
