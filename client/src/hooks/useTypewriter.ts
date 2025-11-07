import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  /** Text to display with typewriter effect */
  text: string;
  /** Speed in milliseconds between each word (default: 30ms) */
  speed?: number;
  /** Callback when typing is complete */
  onComplete?: () => void;
}

/**
 * Hook that creates a typewriter effect by displaying text word-by-word
 * @returns The currently displayed text and whether typing is complete
 */
export function useTypewriter({ text, speed = 30, onComplete }: UseTypewriterOptions): { displayedText: string; isTyping: boolean } {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset if text is empty
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    // Start typing
    setIsTyping(true);
    setDisplayedText('');

    // Split text into words
    const words = text.split(' ');
    let currentIndex = 0;

    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setDisplayedText(prev => {
          const newText = currentIndex === 0 
            ? words[currentIndex] 
            : prev + ' ' + words[currentIndex];
          return newText;
        });
        currentIndex++;
        timeoutRef.current = setTimeout(typeNextWord, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    timeoutRef.current = setTimeout(typeNextWord, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]); // Removed onComplete from dependencies to prevent infinite loop

  return { displayedText, isTyping };
}
