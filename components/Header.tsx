import React from 'react';
import { DownloadIcon } from './icons';
import Button from './Button';

interface HeaderProps {
  onInstallClick?: () => void;
  showInstallButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onInstallClick, showInstallButton }) => {
  return (
    <header className="bg-white p-4 shadow-md relative">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-[#C00000] text-white font-sans font-light text-5xl px-8 py-2 rounded-lg">
          dab
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">Auktionshuset dab Field Tool</h1>
        <p className="text-gray-700 font-semibold mt-1 text-lg">Auktionshuset dab A/S</p>
      </div>
      {showInstallButton && (
        <Button
          onClick={onInstallClick}
          className="absolute top-4 right-4 flex items-center bg-[#C00000] text-white px-3 py-2 rounded-lg shadow-md hover:bg-[#A00000] transition-colors"
          title="Installer appen på din enhed"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Installer App</span>
        </Button>
      )}
    </header>
  );
};

export default Header;
