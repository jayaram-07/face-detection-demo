import { renderHook, act } from '@testing-library/react-hooks';
import { useState, useEffect } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}';

function useScrambleText(text) {
  const [displayText, setDisplayText] = useState(text.replace(/./g, ' '));

  useEffect(() => {
    let iteration = 0;
    let interval;

    const startAnimation = () => {
      interval = setInterval(() => {
        setDisplayText(() =>
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

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    startAnimation();

    return () => clearInterval(interval);
  }, [text]);

  return displayText;
}

// We can't easily run this without a full setup, let's just simulate the React behavior.
