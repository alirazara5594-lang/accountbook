import { useState } from 'react';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { NAVIGATION, type NavGroup } from '../navigation';
import type { UserData } from '../Login';

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  modules: string[];
  currentUser: UserData;
  onLogout: () => void;
}

export default function IconRail({ activePage, onNavigate, modules, currentUser, onLogout }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<NavGroup | null>(null);

  const groups = NAVIGATION.filter(
    group => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  // Determine active group based on activePage
  const activeGroupName = activePage.split('.')[0] || 'Overview';
  const activeGroup = selectedGroup || groups.find(g => g.name === activeGroupName) || groups[0];

  const handleModuleClick = (group: NavGroup) => {
    setSelectedGroup(group);
    setIsCollapsed(false); // Auto-expand submenu when a primary module is clicked
    
    // Navigate directly to the module's summary page
    if (group.name === 'Overview') {
      onNavigate('Overview.Overview');
    } else {
      onNavigate(`${group.name}.Summary`);
    }
  };

  return (
    <div className="double-rail-container">
      {/* Primary Slim Icon Rail */}
      <aside className="primary-rail">
        <div className="rail-brand" title="AMS — Accounting Management System">
          <div className="rail-brand-logo-mark">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)" fillOpacity="0.15"/>
              <path d="M8 22L12 10L16 18L20 10L24 22" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <nav className="rail-nav">
          {groups.map(group => {
            const active = activeGroup.name === group.name;
            const Icon = group.icon;
            return (
              <button
                key={group.name}
                className={'rail-item' + (active ? ' active' : '')}
                title={group.label}
                onClick={() => handleModuleClick(group)}
              >
                <Icon className="rail-icon" size={18} strokeWidth={1.8} />
                <span className="rail-short-label">{group.short}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-footer">
          <div className="rail-user avatar small" title={currentUser.fullName}>
            {currentUser.avatar}
          </div>
          <button className="rail-logout" title="Sign out" onClick={onLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Secondary Sliding Submenu Panel */}
      <aside className={'secondary-rail' + (isCollapsed ? ' collapsed' : '')}>
        <div className="secondary-header">
          <span className="secondary-title">{activeGroup.label}</span>
        </div>

        <div className="secondary-nav-items">
          {activeGroup.name === 'Overview' ? (
            <button
              className={'secondary-nav-item' + (activePage === 'Overview.Overview' ? ' active' : '')}
              onClick={() => onNavigate('Overview.Overview')}
            >
              Overview Dashboard
            </button>
          ) : (
            <>
              <button
                className={'secondary-nav-item' + (activePage === `${activeGroup.name}.Summary` ? ' active' : '')}
                onClick={() => onNavigate(`${activeGroup.name}.Summary`)}
              >
                Summary Cockpit
              </button>
              {activeGroup.items.map(item => {
                const key = `${activeGroup.name}.${item}`;
                return (
                  <button
                    key={item}
                    className={'secondary-nav-item' + (activePage === key ? ' active' : '')}
                    onClick={() => onNavigate(key)}
                  >
                    {item}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Collapse Toggle Handle */}
        <button
          className="secondary-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </div>
  );
}