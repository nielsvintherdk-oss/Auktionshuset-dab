import React from 'react';
import Button from './Button';

interface LoginScreenProps {
  onUserSelect: (name: string) => void;
}

const appraisers = [
  'Niels Vinther',
  'Tom Christensen',
  'Asbjørn Korsholm',
  'Daniel Duus',
  'Gæst',
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onUserSelect }) => {
  return (
    <div className="bg-[#C00000] min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md text-center animate-fade-in-up">
        <header className="mb-8">
            <div className="flex flex-col items-center justify-center">
                <div 
                    className="bg-[#C00000] text-white font-sans font-light text-5xl px-8 py-2 rounded-lg inline-block animate-scale-in"
                >
                dab
                </div>
                <h1 
                    className="text-2xl font-bold text-gray-800 mt-4 animate-fade-in"
                    style={{ animationDelay: '200ms' }}
                >
                    Auktionshuset dab Field Tool
                </h1>
                <p 
                    className="text-gray-700 font-semibold mt-1 text-lg animate-fade-in"
                    style={{ animationDelay: '300ms' }}
                >
                    Auktionshuset dab A/S
                </p>
            </div>
        </header>

        <main>
          <h1 
            className="text-2xl font-bold text-gray-800 mb-6 animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            Vælg konsulent
          </h1>
          <div className="space-y-3">
            {appraisers.map((name, index) => (
              <Button
                key={name}
                onClick={() => onUserSelect(name)}
                className="w-full min-h-16 bg-[#C00000] text-white font-semibold py-3 px-4 rounded-md hover:bg-[#A00000] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] flex items-center justify-center animate-fade-in-up hover:scale-105 focus:scale-105 active:scale-100"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <span>{name}</span>
              </Button>
            ))}
          </div>
        </main>

        <footer 
            className="mt-8 animate-fade-in"
            style={{ animationDelay: `${500 + appraisers.length * 100}ms` }}
        >
            <p className="text-xs text-gray-400">Version 1.0 · Udviklet af Niels Vinther</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;