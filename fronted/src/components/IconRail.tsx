import { useState, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { NAVIGATION, type NavGroup } from '../navigation';
import type { UserData } from '../Login';

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  modules: string[];
  currentUser: UserData;
  onLogout: () => void;
  /** Optional badge counts for modules, e.g. { Sales: 3, Procurement: 1 } */
  moduleBadgeCounts?: Record<string, number>;
}

export default function IconRail({ activePage, onNavigate, modules, currentUser, onLogout, moduleBadgeCounts }: Props) {
  const [hoveredGroup, setHoveredGroup] = useState<NavGroup | null>(null);
  const timeoutRef = useRef<any>(null);

  const groups = NAVIGATION.filter(
    group => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  const handleMouseEnter = (group: NavGroup) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredGroup(group);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredGroup(null);
    }, 200);
  };

  const handlePopoverEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handlePopoverLeave = () => {
    setHoveredGroup(null);
  };

  const handleModuleClick = (group: NavGroup) => {
    if (group.name === 'Overview') {
      onNavigate('Overview.Overview');
    } else {
      onNavigate(`${group.name}.Summary`);
    }
  };

  return (
    <div className="floating-dock-container">
      {/* Floating Island Dock */}
      <aside className="floating-island-dock">
        <div className="dock-brand" title="AMS — ERP Portal">
          <div className="dock-logo-mark">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)" fillOpacity="0.15"/>
              <path d="M8 22L12 10L16 18L20 10L24 22" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="dock-brand-text">AMS</span>
        </div>

        <nav className="dock-nav">
          {groups.map(group => {
            const active = activePage.startsWith(group.name + '.');
            const Icon = group.icon;
            const isHovered = hoveredGroup?.name === group.name;

            return (
              <div
                className="dock-item-wrap"
                key={group.name}
                onMouseEnter={() => handleMouseEnter(group)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={'dock-item' + (active ? ' active' : '')}
                  onClick={() => handleModuleClick(group)}
                  title={group.label}
                >
                  <Icon className="dock-icon" size={16} strokeWidth={1.8} />
                  <span className="dock-label">{group.short}</span>
                  {moduleBadgeCounts?.[group.name] ? (
                    <span className="dock-badge">{moduleBadgeCounts[group.name]}</span>
                  ) : null}
                </button>

                {/* Floating Speech-Bubble Submenu */}
                {isHovered && (
                  <div
                    className="dock-popover"
                    onMouseEnter={handlePopoverEnter}
                    onMouseLeave={handlePopoverLeave}
                  >
                    <div className="popover-header">
                      <span className="popover-title">{group.label}</span>
                    </div>
                    <div className="popover-nav-items">
                      {group.name === 'Overview' ? (
                        <button
                          className={'popover-nav-item' + (activePage === 'Overview.Overview' ? ' active' : '')}
                          onClick={() => onNavigate('Overview.Overview')}
                        >
                          Overview Dashboard
                        </button>
                      ) : (
                        <>
                          <button
                            className={'popover-nav-item' + (activePage === `${group.name}.Summary` ? ' active' : '')}
                            onClick={() => onNavigate(`${group.name}.Summary`)}
                          >
                            Summary Cockpit
                          </button>
                          {group.items.map(item => {
                            const key = `${group.name}.${item}`;
                            return (
                              <button
                                key={item}
                                className={'popover-nav-item' + (activePage === key ? ' active' : '')}
                                onClick={() => onNavigate(key)}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="dock-footer">
          <div className="dock-user avatar small" title={currentUser.fullName}>
            {currentUser.avatar}
          </div>
          <button className="dock-logout" title="Sign out" onClick={onLogout}>
            <LogOut size={14} />
            <span className="dock-logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}