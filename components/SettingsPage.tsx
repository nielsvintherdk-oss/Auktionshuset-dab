import React, { useState, useEffect, useRef } from 'react';
import { soundAssets, SoundType } from './sounds';
import Button from './Button';

type CustomSounds = Partial<Record<Exclude<SoundType, 'none'>, string>>;

const soundLabels: Record<Exclude<SoundType, 'none'>, string> = {
    interaction: 'Standard Interaktion',
    navigation: 'Navigation',
    delete: 'Sletning',
    success: 'Succes',
    openModal: 'Åbn Vindue',
    closeModal: 'Luk Vindue',
};

const soundOrder: Exclude<SoundType, 'none'>[] = ['interaction', 'navigation', 'success', 'delete', 'openModal', 'closeModal'];

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined') {
      try {
          return new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
          console.error("Web Audio API is not supported in this browser.", e);
      }
  }
  return null;
};

const playSoundFromData = async (dataUrl: string) => {
    const context = getAudioContext();
    if (!context) return;
    try {
        if (context.state === 'suspended') {
            await context.resume();
        }
        const response = await fetch(dataUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
    } catch (e) {
        console.error("Could not play sound from data", e);
        alert("Kunne ikke afspille lyden. Filen er muligvis beskadiget eller i et format, der ikke understøttes.");
    }
};

const SettingsPage: React.FC = () => {
    const [customSounds, setCustomSounds] = useState<CustomSounds>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        const loadedSounds: CustomSounds = {};
        for (const key in soundAssets) {
            try {
                const storedSound = localStorage.getItem(`custom_sound_${key}`);
                if (storedSound) {
                    loadedSounds[key as Exclude<SoundType, 'none'>] = storedSound;
                }
            } catch (e) {
                console.error("Could not load custom sound from localStorage", e);
            }
        }
        setCustomSounds(loadedSounds);
    }, []);

    const handleFileUpload = (sound: Exclude<SoundType, 'none'>) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                alert("Filen er for stor. Vælg venligst en fil under 1MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                try {
                    localStorage.setItem(`custom_sound_${sound}`, dataUrl);
                    setCustomSounds(prev => ({ ...prev, [sound]: dataUrl }));
                } catch (err) {
                     alert("Kunne ikke gemme lyden. Lagerpladsen er muligvis fuld.");
                     console.error("Error saving sound to localStorage", err);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetSound = (sound: Exclude<SoundType, 'none'>) => {
        try {
            localStorage.removeItem(`custom_sound_${sound}`);
            setCustomSounds(prev => {
                const newSounds = { ...prev };
                delete newSounds[sound];
                return newSounds;
            });
        } catch (e) {
            console.error("Could not remove custom sound from localStorage", e);
        }
    };
    
    const handlePlaySound = (sound: Exclude<SoundType, 'none'>) => {
        const dataUrl = customSounds[sound] || soundAssets[sound];
        playSoundFromData(dataUrl);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">Indstillinger</h1>
                <p className="mt-2 text-lg text-gray-600">Tilpas applikationens lyde.</p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Lydindstillinger</h3>
                <div className="space-y-4">
                    {soundOrder.map(soundKey => (
                        <div key={soundKey} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-stone-50 rounded-lg border">
                            <span className="font-medium text-gray-800">{soundLabels[soundKey]}</span>
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                <Button onClick={() => handlePlaySound(soundKey)} className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    Afspil
                                </Button>
                                <Button onClick={() => fileInputRefs.current[soundKey]?.click()} className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    Upload MP3
                                </Button>
                                <input
                                    type="file"
                                    accept=".mp3,audio/mpeg"
                                    ref={el => fileInputRefs.current[soundKey] = el}
                                    onChange={handleFileUpload(soundKey)}
                                    className="hidden"
                                />
                                {customSounds[soundKey] && (
                                    <Button onClick={() => handleResetSound(soundKey)} className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#C00000] hover:bg-[#A00000]">
                                        Nulstil
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
