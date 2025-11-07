import React from 'react';
import { CubeIcon, CheckboxIcon, BookIcon } from './icons';
import Button from './Button';

export type ActiveTab = 'lots' | 'opgaver' | 'handbook';

interface NavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const Nav: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  const lotsIsActive = activeTab === 'lots';
  const opgaverIsActive = activeTab === 'opgaver';
  const handbookIsActive = activeTab === 'handbook';

  const activeClasses = 'bg-white text-[#C00000]';
  const inactiveClasses = 'bg-[#C00000] text-white hover:bg-red-800';

  return (
    <nav className="bg-[#C00000] flex">
      <Button
        onClick={() => setActiveTab('lots')}
        className={`flex-1 flex items-center justify-center p-3 font-semibold transition-colors duration-200 ${lotsIsActive ? activeClasses : inactiveClasses}`}
      >
        <CubeIcon className="w-5 h-5 mr-2" />
        Lots
      </Button>
      <Button
        onClick={() => setActiveTab('opgaver')}
        className={`flex-1 flex items-center justify-center p-3 font-semibold transition-colors duration-200 ${opgaverIsActive ? activeClasses : inactiveClasses}`}
      >
        <CheckboxIcon className="w-5 h-5 mr-2" />
        Opgaver
      </Button>
      <Button
        onClick={() => setActiveTab('handbook')}
        className={`flex-1 flex items-center justify-center p-3 font-semibold transition-colors duration-200 ${handbookIsActive ? activeClasses : inactiveClasses}`}
      >
        <BookIcon className="w-5 h-5 mr-2" />
        dab håndbog
      </Button>
    </nav>
  );
};

export default Nav;
