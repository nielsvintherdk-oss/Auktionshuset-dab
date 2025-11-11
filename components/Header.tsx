import React from 'react';
import { DownloadIcon, SpeakerOnIcon, SpeakerOffIcon } from './icons';
import Button from './Button';

interface HeaderProps {
  onInstallClick?: () => void;
  showInstallButton?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onInstallClick, showInstallButton, isMuted, onToggleMute }) => {
  return (
    <header className="bg-stone-50 p-4 shadow-md relative text-center animate-slide-in-down">
      <div className="">
        <div className="bg-[#C00000] text-white font-sans font-light text-4xl px-6 py-1 rounded-lg inline-block">
          dab
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mt-3">Auktionshuset dab Field Tool</h1>
        <p className="text-gray-600 font-medium mt-1 text-base sm:text-lg">Auktionshuset dab A/S</p>
      </div>
      
      {onToggleMute && (
        <div className="absolute top-4 left-4">
            <Button
              sound="none"
              onClick={onToggleMute}
              className="flex items-center bg-white text-gray-600 border border-gray-300 w-10 h-10 justify-center rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              title={isMuted ? "Slå lyd til" : "Slå lyd fra"}
            >
              {isMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerOnIcon className="w-5 h-5" />}
            </Button>
        </div>
      )}

      {showInstallButton && (
        <Button
          onClick={onInstallClick}
          className="absolute top-4 right-4 flex items-center bg-white text-[#C00000] border border-gray-300 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
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