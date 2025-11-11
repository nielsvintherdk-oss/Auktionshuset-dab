import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Appraiser } from './constants';

interface PinScreenProps {
  userName: string;
  onSuccess: (name: string) => void;
  onCancel: () => void;
  appraisers: Appraiser[];
}

type PinMode = 'create' | 'confirm' | 'verify' | 'locked';

const PinDisplay: React.FC<{ pinLength: number, hasError: boolean }> = ({ pinLength, hasError }) => (
  <div className="flex justify-center space-x-4 my-6">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`w-6 h-6 rounded-full transition-colors duration-200 ${
          pinLength > i ? 'bg-red-600' : 'bg-gray-300'
        } ${hasError ? 'animate-shake' : ''}`}
      ></div>
    ))}
  </div>
);

const KeypadButton: React.FC<{ value: string, onClick: (val: string) => void, disabled: boolean }> = ({ value, onClick, disabled }) => (
  <Button
    onClick={() => onClick(value)}
    disabled={disabled}
    className="w-20 h-20 bg-gray-200 rounded-full text-2xl font-semibold text-gray-800 flex items-center justify-center transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
  >
    {value}
  </Button>
);

const PinScreen: React.FC<PinScreenProps> = ({ userName, onSuccess, onCancel, appraisers }) => {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [mode, setMode] = useState<PinMode>('verify');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [email, setEmail] = useState('');

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
    if (pin.length === 4 && !showForgotPin) {
      handlePinComplete(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, showForgotPin]);

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
  
  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = appraisers.find(a => a.name === userName);

    if (!currentUser) {
        setError("Bruger ikke fundet. Kontakt support.");
        return;
    }
    
    if (!currentUser.email) {
        setError("Denne bruger har ingen e-mail tilknyttet til nulstilling.");
        return;
    }

    if (email.trim().toLowerCase() === currentUser.email.toLowerCase()) {
        localStorage.removeItem(pinStorageKey);
        alert("E-mail bekræftet. Du kan nu oprette en ny pinkode.");
        // Reset state to create a new pin
        setShowForgotPin(false);
        setPin('');
        setFirstPin('');
        setMode('create');
        setPrompt('Opret en ny 4-cifret pinkode');
        setError('');
        setEmail('');
    } else {
        setError("Den indtastede e-mail er ikke korrekt for denne bruger.");
    }
  };

  return (
     <div className="bg-[#C00000] min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-xl shadow-lg text-center">
        {!showForgotPin ? (
          <>
            <h2 className="text-xl font-bold text-gray-800">Velkommen, {userName}</h2>
            <p className={`mt-2 text-base ${error ? 'text-red-600' : 'text-gray-600'}`}>{error || prompt}</p>
            
            <PinDisplay pinLength={pin.length} hasError={!!error} />

            <div className="grid grid-cols-3 gap-4 place-items-center">
                {'123456789'.split('').map(key => (
                  <KeypadButton key={key} value={key} onClick={handleKeyPress} disabled={mode === 'locked'} />
                ))}
                <div />
                <KeypadButton value="0" onClick={handleKeyPress} disabled={mode === 'locked'} />
                <Button
                    onClick={handleDelete}
                    disabled={mode === 'locked'}
                    className="w-20 h-20 bg-gray-200 rounded-full text-xl font-semibold text-gray-800 flex items-center justify-center transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                    Slet
                </Button>
            </div>
            <div className="mt-4">
                <Button
                    onClick={() => {
                      setShowForgotPin(true);
                      setError('');
                    }}
                    className="text-sm text-gray-500 hover:text-red-600"
                >
                    Glemt pinkode?
                </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800">Nulstil pinkode for {userName}</h2>
            <p className={`mt-2 text-base ${error ? 'text-red-600' : 'text-gray-600'}`}>
                {error || 'Indtast din e-mail for at bekræfte din identitet.'}
            </p>
            <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din.email@auktionshuset.dk"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
                <Button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Bekræft E-mail
                </Button>
            </form>
             <div className="mt-4">
                <Button
                    onClick={() => {
                        setShowForgotPin(false);
                        setError('');
                    }}
                    className="text-sm text-gray-500 hover:text-red-600"
                >
                    Tilbage til login
                </Button>
            </div>
          </>
        )}
        
        <div className="mt-8">
            <Button
                onClick={onCancel}
                className="text-base text-gray-500 hover:text-red-600"
            >
                Vælg en anden bruger
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PinScreen;