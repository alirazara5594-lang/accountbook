import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [hoveredGroup, setHoveredGroup] = useState<NavGroup | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const groups = NAVIGATION.filter(
    (group) => !modules || modules.length === 0 || modules.includes(group.moduleId)
  );

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, groups.length]);

  const scrollUp = () => {
    navRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  };

  const scrollDown = () => {
    navRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
  };

  const handleMouseEnter = (group: NavGroup) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredGroup(group);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHoveredGroup(null), 200);
  };

  const handlePopoverEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handlePopoverLeave = () => setHoveredGroup(null);

  const handleModuleClick = (group: NavGroup) => {
    if (group.name === 'Overview') {
      onNavigate('Overview.Overview');
    } else {
      onNavigate(`${group.name}.Summary`);
    }
  };

  return (
    <aside className="unique-sidebar">
      <div className="unique-brand">
        <div className="unique-logo-mark">🧾</div>
        <div className="unique-brand-lines">
          <span className="unique-brand-text">AMS</span>
          <span className="unique-brand-sub">ERP</span>
        </div>
      </div>

      {/* Scroll Up Button */}
      {canScrollUp && (
        <button className="unique-scroll-btn unique-scroll-up" onClick={scrollUp} title="Scroll up">
          <ChevronUp size={14} />
        </button>
      )}

      <nav className="unique-nav" ref={navRef as React.RefObject<HTMLElement>}>
        {groups.map((group) => {
          const active = activePage.startsWith(group.name + '.');
          const Icon = group.icon;
          return (
            <div
              className="unique-item-wrap"
              key={group.moduleId}
              onMouseEnter={() => handleMouseEnter(group)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={'unique-item' + (active ? ' active' : '')}
                onClick={() => handleModuleClick(group)}
                title={group.label}
              >
                <div className="unique-icon-circle">
                  <Icon className="unique-icon" size={18} strokeWidth={1.8} />
                </div>
                <span className="unique-label">{group.short}</span>
                {moduleBadgeCounts?.[group.moduleId] ? (
                  <span className="unique-badge">{moduleBadgeCounts[group.moduleId]}</span>
                ) : null}
              </button>

              {hoveredGroup?.moduleId === group.moduleId && (
                <div
                  className="unique-popover"
                  onMouseEnter={handlePopoverEnter}
                  onMouseLeave={handlePopoverLeave}
                >
                  <div className="popover-header">{group.label}</div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Scroll Down Button */}
      {canScrollDown && (
        <button className="unique-scroll-btn unique-scroll-down" onClick={scrollDown} title="Scroll down">
          <ChevronDown size={14} />
        </button>
      )}

      <div className="unique-footer">
        <button className="unique-logout" onClick={onLogout}>
          <span className="unique-logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
