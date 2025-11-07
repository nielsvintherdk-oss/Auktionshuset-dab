import React from 'react';
import { ActiveTab } from './Nav';
import Button from './Button';

interface StatusBarProps {
  stats: {
    lots: number;
    aktiveOpgaver: number;
    faerdige: number;
  };
  setActiveTab: (tab: ActiveTab) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ stats, setActiveTab }) => {
  return (
    <footer className="sticky bottom-0 bg-white border-t border-gray-200 shadow-t-md w-full">
      <div className="grid grid-cols-3 text-center">
        <Button
          onClick={() => setActiveTab('lots')}
          className="p-3 border-r border-gray-200 text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C00000]"
          aria-label={`Vis ${stats.lots} lots`}
        >
          <p className="text-2xl font-bold text-[#C00000]">{stats.lots}</p>
          <p className="text-sm text-gray-500">Lots</p>
        </Button>
        <Button
          onClick={() => setActiveTab('opgaver')}
          className="p-3 border-r border-gray-200 text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C00000]"
          aria-label={`Vis ${stats.aktiveOpgaver} aktive opgaver`}
        >
          <p className="text-2xl font-bold text-[#C00000]">{stats.aktiveOpgaver}</p>
          <p className="text-sm text-gray-500">Aktive opgaver</p>
        </Button>
        <div className="p-3">
          <p className="text-2xl font-bold text-green-600">{stats.faerdige}</p>
          <p className="text-sm text-gray-500">Færdige</p>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
