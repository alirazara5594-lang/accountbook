import { LogOut } from 'lucide-react';
import { NAVIGATION } from '../navigation';
import type { UserData } from '../Login';

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  modules: string[];
  currentUser: UserData;
  onLogout: () => void;
}

export default function IconRail({ activePage, onNavigate, modules, currentUser, onLogout }: Props) {
  const groups = NAVIGATION.filter(
    group => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  return (
    <aside className="icon-rail">
      <div className="rail-brand" title="ACFIN">
        <b>AC</b>
        <span>FIN</span>
      </div>

      <nav className="rail-nav">
        {groups.map(group => {
          const active = activePage.startsWith(group.name + '.');
          return (
            <div className="rail-item-wrap" key={group.name}>
              <button
                className={'rail-item' + (active ? ' active' : '')}
                title={group.name}
                onClick={() => onNavigate(`${group.name}.Summary`)}
              >
                <span className="rail-icon">{group.icon}</span>
              </button>
              <div className="rail-flyout">
                <div className="flyout-title">
                  <span className="flyout-module-icon">{group.icon}</span>
                  {group.name}
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

      <div className="rail-bottom">
        <div className="rail-user avatar small" title={currentUser.fullName}>
          {currentUser.avatar}
        </div>
        <button className="rail-logout" title="Sign out" onClick={onLogout}>
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}