import React, { useState, useEffect } from 'react';
import Button from './Button';

interface PinScreenProps {
  userName: string;
  onSuccess: (name: string) => void;
  onCancel: () => void;
}

type PinMode = 'create' | 'confirm' | 'verify' | 'locked';

const PinScreen: React.FC<PinScreenProps> = ({ userName, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [mode, setMode] = useState<PinMode>('verify');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const pinStorageKey = `pin_${userName}`;

  useEffect(() => {
    const storedPin = localStorage.getItem(pinStorageKey);
    if (storedPin) {
      setMode('verify');
      setPrompt('Indtast din pinkode');
    } else {
      setMode('create');
      setPrompt('Opret en 4-cifret pinkode');
    }
  }, [pinStorageKey]);

  useEffect(() => {
    if (pin.length === 4) {
      handlePinComplete(pin);
    }
  }, [pin]);

  const resetWithError = (message: string) => {
    setError(message);
    setPin('');
    setTimeout(() => setError(''), 2000);
  };

  const handlePinComplete = (completedPin: string) => {
    setError('');
    switch (mode) {
      case 'create':
        setFirstPin(completedPin);
        setMode('confirm');
        setPrompt('Bekræft din pinkode');
        setPin('');
        break;
      case 'confirm':
        if (completedPin === firstPin) {
          localStorage.setItem(pinStorageKey, completedPin);
          onSuccess(userName);
        } else {
          resetWithError('Pinkoderne er ikke ens. Prøv igen.');
          setFirstPin('');
          setMode('create');
          setPrompt('Opret en 4-cifret pinkode');
        }
        break;
      case 'verify':
        const storedPin = localStorage.getItem(pinStorageKey);
        if (completedPin === storedPin) {
          onSuccess(userName);
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= 3) {
            resetWithError('For mange forkerte forsøg. Prøv igen senere.');
            setMode('locked');
            setPrompt('Låst');
          } else {
            resetWithError(`Forkert pinkode. Forsøg ${newAttempts} af 3.`);
          }
        }
        break;
    }
  };

  const handleKeyPress = (key: string) => {
    if (mode === 'locked') return;
    setError('');
    if (pin.length < 4) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    if (mode === 'locked') return;
    setError('');
    setPin(pin.slice(0, -1));
  };
  
  const PinDisplay: React.FC = () => (
    <div className="flex justify-center space-x-4 my-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full transition-colors duration-200 ${
            pin.length > i ? 'bg-[#C00000]' : 'bg-gray-300'
          } ${error ? 'animate-shake' : ''}`}
        ></div>
      ))}
    </div>
  );

  const KeypadButton: React.FC<{ value: string, onClick: (val: string) => void }> = ({ value, onClick }) => (
    <Button
      onClick={() => onClick(value)}
      disabled={mode === 'locked'}
      className="w-20 h-20 bg-gray-100 rounded-full text-2xl font-semibold text-gray-800 flex items-center justify-center transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C00000] disabled:opacity-50"
    >
      {value}
    </Button>
  );

  return (
     <div className="bg-[#C00000] min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold text-gray-800">Velkommen, {userName}</h2>
        <p className={`mt-2 text-base ${error ? 'text-red-600' : 'text-gray-600'}`}>{error || prompt}</p>
        
        <PinDisplay />

        <div className="grid grid-cols-3 gap-4 place-items-center">
            {'123456789'.split('').map(key => (
              <KeypadButton key={key} value={key} onClick={handleKeyPress} />
            ))}
            <div />
            <KeypadButton value="0" onClick={handleKeyPress} />
            <Button
                onClick={handleDelete}
                disabled={mode === 'locked'}
                className="w-20 h-20 bg-gray-100 rounded-full text-xl font-semibold text-gray-800 flex items-center justify-center transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C00000] disabled:opacity-50"
            >
                Slet
            </Button>
        </div>
        
        <div className="mt-8">
            <Button
                onClick={onCancel}
                className="text-base text-gray-500 hover:text-[#C00000]"
            >
                Vælg en anden bruger
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PinScreen;
