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
  storageUsage: number;
  storageQuota: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ stats, setActiveTab, storageUsage, storageQuota }) => {
  const usagePercent = Math.min(100, (storageUsage / storageQuota) * 100);
  const usageMB = (storageUsage / 1024 / 1024).toFixed(1);
  const quotaMB = (storageQuota / 1024 / 1024).toFixed(0);

  let progressBarColor = 'bg-green-500';
  if (usagePercent > 80) {
    progressBarColor = 'bg-red-500';
  } else if (usagePercent > 60) {
    progressBarColor = 'bg-yellow-500';
  }

  return (
    <footer className="sticky bottom-0 bg-stone-50 border-t border-gray-200 shadow-t-md w-full">
      <div className="grid grid-cols-3 text-center">
        <Button
          onClick={() => setActiveTab('lots')}
          className="p-3 border-r border-gray-200 text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C00000]"
          aria-label={`Vis ${stats.lots} lots`}
        >
          <p className="text-2xl font-bold text-gray-800">{stats.lots}</p>
          <p className="text-sm text-gray-500">Lots</p>
        </Button>
        <Button
          onClick={() => setActiveTab('opgaver')}
          className="p-3 border-r border-gray-200 text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C00000]"
          aria-label={`Vis ${stats.aktiveOpgaver} aktive opgaver`}
        >
          <p className="text-2xl font-bold text-gray-800">{stats.aktiveOpgaver}</p>
          <p className="text-sm text-gray-500">Aktive opgaver</p>
        </Button>
        <div className="p-3">
          <p className="text-2xl font-bold text-green-600">{stats.faerdige}</p>
          <p className="text-sm text-gray-500">Færdige</p>
        </div>
      </div>
      <div className="px-3 py-1.5 bg-stone-100 border-t border-gray-200" title={`Du har brugt ${usagePercent.toFixed(0)}% af den anslåede lagerplads.`}>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-0.5">
              <span>Lagerplads</span>
              <span>{usageMB} MB / {quotaMB} MB</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-1.5">
              <div className={`${progressBarColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${usagePercent}%` }}></div>
          </div>
      </div>
    </footer>
  );
};

export default StatusBar;