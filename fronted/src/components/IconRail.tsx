import { useState } from 'react';
import { LogOut } from 'lucide-react';
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
  const [hoverInfo, setHoverInfo] = useState<{ name: string; up: boolean } | null>(null);

  const handleEnter = (group: NavGroup, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const estHeight = 100 + group.items.length * 31;
    setHoverInfo({ name: group.name, up: rect.top + estHeight > window.innerHeight - 8 });
  };
  const handleLeave = () => setHoverInfo(null);

  const groups = NAVIGATION.filter(
    group => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  return (
    <aside className="icon-rail">
      <div className="rail-brand" title="AIMS — Accounting Information Management System">
        <img src="/favicon.svg" alt="" className="rail-brand-logo" />
        <div className="rail-brand-text">
          <span className="rail-brand-aim">AIM</span>
          <span className="rail-brand-s">S</span>
        </div>
      </div>

      <nav className="rail-nav">
        {groups.map(group => {
          const active = activePage.startsWith(group.name + '.');
          const Icon = group.icon;
          return (
            <div className="rail-item-wrap" key={group.name} onMouseEnter={e => handleEnter(group, e)} onMouseLeave={handleLeave}>
              <button
                className={'rail-item' + (active ? ' active' : '')}
                title={group.name}
                onClick={() => onNavigate(`${group.name}.Summary`)}
              >
                <Icon className="rail-icon" size={18} strokeWidth={1.8} />
                <span className="rail-label">{group.label.split(' ')[0]}</span>
              </button>
              <div className={'rail-flyout' + (hoverInfo?.name === group.name && hoverInfo.up ? ' fly-up' : '')}>
                <div className="flyout-title">
                  <Icon className="flyout-module-icon" size={15} strokeWidth={1.9} />
                  {group.label}
                </div>
                <button
                  className={'flyout-item' + (activePage === `${group.name}.Summary` || activePage === 'Overview.Dashboard' && group.name === 'Overview' ? ' active' : '')}
                  onClick={() => onNavigate(`${group.name}.Summary`)}
                >
                  Dashboard
                </button>
                {group.items.map(item => {
                  const key = `${group.name}.${item}`;
                  return (
                    <button
                      key={item}
                      className={'flyout-item' + (activePage === key ? ' active' : '')}
                      onClick={() => onNavigate(key)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="rail-footer">
        <button className="rail-logout" title="Sign out" onClick={onLogout}>
          <LogOut size={14} />
        </button>
        <div className="rail-user avatar small" title={currentUser.fullName}>
          {currentUser.avatar}
        </div>
      </div>
    </aside>
  );
}