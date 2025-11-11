import React, { useState, useRef, useEffect } from 'react';
import { CubeIcon, CheckboxIcon, BookIcon, ContactsIcon, BarChartIcon, DotsVerticalIcon, LightBulbIcon, SettingsIcon } from './icons';
import Button from './Button';

export type ActiveTab = 'lots' | 'opgaver' | 'oversigt' | 'handbook' | 'kontakter' | 'ai_tools' | 'settings';

interface NavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const NavButton: React.FC<{
  tab: ActiveTab;
  label: string;
  icon: React.ReactNode;
  activeTab: ActiveTab;
  onClick: (tab: ActiveTab) => void;
  className?: string;
}> = ({ tab, label, icon, activeTab, onClick, className = '' }) => {
  const isActive = activeTab === tab;
  return (
    <Button
      sound="navigation"
      onClick={() => onClick(tab)}
      className={`flex-1 flex items-center justify-center p-3 md:p-4 font-semibold transition-colors duration-200 border-b-4 ${
        isActive ? 'text-white border-white' : 'text-red-200 hover:text-white border-transparent'
      } ${className}`}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
};


const Nav: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const allTabs: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'lots', label: 'Lots', icon: <CubeIcon className="w-5 h-5 mr-2" /> },
    { tab: 'oversigt', label: 'Oversigt', icon: <BarChartIcon className="w-5 h-5 mr-2" /> },
    { tab: 'opgaver', label: 'Opgaver', icon: <CheckboxIcon className="w-5 h-5 mr-2" /> },
    { tab: 'handbook', label: 'Håndbog', icon: <BookIcon className="w-5 h-5 mr-2" /> },
    { tab: 'kontakter', label: 'Kontakter', icon: <ContactsIcon className="w-5 h-5 mr-2" /> },
    { tab: 'ai_tools', label: 'AI Redskaber', icon: <LightBulbIcon className="w-5 h-5 mr-2" /> },
    { tab: 'settings', label: 'Indstillinger', icon: <SettingsIcon className="w-5 h-5 mr-2" /> },
  ];

  const primaryTabs = allTabs.slice(0, 3); // Lots, Oversigt, Opgaver
  const secondaryTabs = allTabs.slice(3); // The rest

  const isMoreTabActive = secondaryTabs.some(t => t.tab === activeTab);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <nav className="bg-[#C00000] flex shadow-md sticky top-0 z-20">
      {/* Desktop View: All tabs visible */}
      <div className="hidden md:flex w-full">
        {allTabs.map(({ tab, label, icon }) => (
          <NavButton key={tab} tab={tab} label={label} icon={icon} activeTab={activeTab} onClick={handleTabClick} />
        ))}
      </div>

      {/* Mobile View: 3 primary tabs + "More" menu */}
      <div className="flex md:hidden w-full">
        {primaryTabs.map(({ tab, label, icon }) => (
          <NavButton key={tab} tab={tab} label={label} icon={icon} activeTab={activeTab} onClick={handleTabClick} />
        ))}
        
        <div className="relative flex-1" ref={moreMenuRef}>
           <Button
            sound="navigation"
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`w-full flex-1 flex items-center justify-center p-3 md:p-4 font-semibold transition-colors duration-200 border-b-4 ${
              isMoreTabActive ? 'text-white border-white' : 'text-red-200 hover:text-white border-transparent'
            }`}
          >
            <DotsVerticalIcon className="w-5 h-5 mr-2" />
            Mere
          </Button>

          {isMoreMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-30 animate-scale-in">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {secondaryTabs.map(({ tab, label, icon }) => (
                  <a
                    key={tab}
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        handleTabClick(tab);
                    }}
                    className={`flex items-center px-4 py-3 text-base ${activeTab === tab ? 'font-bold text-[#C00000] bg-red-50' : 'text-gray-700'} hover:bg-gray-100`}
                    role="menuitem"
                  >
                    <span className={activeTab === tab ? 'text-[#C00000]' : 'text-gray-500'}>{icon}</span>
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;