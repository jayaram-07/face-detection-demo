import { useState, useEffect } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export function ScrambleText({ text, className = '' }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text.replace(/./g, ' '));

  useEffect(() => {
    let interval: number;
    const startTime = Date.now();

    const startAnimation = () => {
      interval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const iteration = elapsed / 90; // 30ms * 3 = 90ms per character

        if (iteration >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
        } else {
          setDisplayText(
            text
              .split('')
              .map((char, index) => {
                if (char === ' ') return ' ';
                if (index < iteration) {
                  return text[index];
                }
                return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              })
              .join('')
          );
        }
      }, 30);
    };

    startAnimation();

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
}
