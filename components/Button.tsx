import React from 'react';
import { soundAssets, SoundType } from './sounds';

let audioContext: AudioContext | null = null;
const audioBufferCache: Partial<Record<SoundType, AudioBuffer>> = {};

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
      return null;
    }
  }
  return audioContext;
};

const playSound = async (sound: SoundType) => {
    try {
        if (sound === 'none') return;
        const isMuted = localStorage.getItem('isMuted') === 'true';
        if (isMuted) return;

        const context = getAudioContext();
        if (!context) return;
        
        if (context.state === 'suspended') {
            await context.resume();
        }

        const customSoundData = localStorage.getItem(`custom_sound_${sound}`);
        const dataUrl = customSoundData || soundAssets[sound];

        let buffer: AudioBuffer | undefined;

        // Only use cache for default sounds
        if (!customSoundData) {
            buffer = audioBufferCache[sound];
        }
        
        if (!buffer) {
            const response = await fetch(dataUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await context.decodeAudioData(arrayBuffer);
            // Only cache default sounds
            if (!customSoundData) {
                audioBufferCache[sound] = buffer;
            }
        }
        
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);

    } catch (e) {
        console.error(`Could not play sound: ${sound}`, e);
    }
}

export const playNavigationSound = () => playSound('navigation');
export const playInteractionSound = () => playSound('interaction');
export const playDeleteSound = () => playSound('delete');
export const playSuccessSound = () => playSound('success');
export const playOpenModalSound = () => playSound('openModal');
export const playCloseModalSound = () => playSound('closeModal');

const soundMap: Record<SoundType, () => void> = {
  interaction: playInteractionSound,
  navigation: playNavigationSound,
  delete: playDeleteSound,
  success: playSuccessSound,
  openModal: playOpenModalSound,
  closeModal: playCloseModalSound,
  none: () => {},
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    sound?: SoundType;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, sound = 'interaction', ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundMap[sound]();

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

export default Button;