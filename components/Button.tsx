import React from 'react';

// Create a single AudioContext to be reused, ensuring it's only created in the browser.
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      // Standard and webkit prefixed for broader compatibility
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
      return null;
    }
  }
  return audioContext;
};

/**
 * Plays a short, non-intrusive click sound.
 * This can be used for interactive elements that are not standard buttons.
 */
export const playClickSound = () => {
  try {
    const context = getAudioContext();
    if (!context) return;

    // Browsers may suspend the AudioContext until a user interaction.
    // We resume it here to ensure the sound plays.
    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    // Connect the audio graph: Oscillator -> Gain -> Destination (speakers)
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    const clickDuration = 0.08;
    const startTime = context.currentTime;

    // Oscillator: A sine wave provides a smooth, clean tone.
    oscillator.type = 'sine';

    // Pitch Envelope: A rapid pitch drop creates a more dynamic, pleasant "bloop" sound.
    oscillator.frequency.setValueAtTime(900, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, startTime + clickDuration);

    // Volume Envelope: A quick attack and decay make the sound feel crisp and responsive.
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01); // Quick attack to avoid a harsh pop
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + clickDuration);

    // Schedule the sound to play and stop
    oscillator.start(startTime);
    oscillator.stop(startTime + clickDuration);
  } catch (e) {
    // If audio fails for any reason, log the error but don't block UI interaction.
    console.error("Could not play click sound:", e);
  }
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
}

const Button: React.FC<ButtonProps> = ({ onClick, children, ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play the sound effect immediately on click for better perceived responsiveness.
    // This decouples the audio feedback from the execution of the onClick handler,
    // which might be delayed (e.g., by a confirmation dialog), fixing the issue.
    playClickSound();

    // Then, execute the primary button action.
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
