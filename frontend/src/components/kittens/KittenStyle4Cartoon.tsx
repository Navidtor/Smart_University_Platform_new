import React, { useEffect, useState, useCallback } from 'react';

interface KittenProps {
  isPasswordFocused: boolean;
}

// Style 4: Cartoon/Playful - Fun, bouncy, Disney-like style with bold outlines
export const KittenStyle4Cartoon: React.FC<KittenProps> = ({ isPasswordFocused }) => {
  const [blinkingKitten, setBlinkingKitten] = useState<number | null>(null);

  useEffect(() => {
    if (isPasswordFocused) return;

    const blinkRandomKitten = () => {
      const kittenToBlink = Math.floor(Math.random() * 3);
      setBlinkingKitten(kittenToBlink);
      setTimeout(() => setBlinkingKitten(null), 150);
    };

    const initialTimeout = setTimeout(blinkRandomKitten, 1500 + Math.random() * 2000);
    const blinkInterval = setInterval(blinkRandomKitten, 2500 + Math.random() * 2500);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(blinkInterval);
    };
  }, [isPasswordFocused]);

  const shouldCloseEyes = useCallback((kittenIndex: number) => {
    if (isPasswordFocused) return true;
    return blinkingKitten === kittenIndex;
  }, [isPasswordFocused, blinkingKitten]);

  return (
    <div className="kitten-cartoon-wrapper">
      <svg viewBox="0 0 240 90" width="260" height="98">
        {/* Orange Kitten - Cartoon Style */}
        <g transform="translate(10, 10)">
          {/* Tail - curling up on the left side */}
          <path 
            d="M 12 50 Q -2 45 -5 30 Q -6 18 5 15" 
            stroke="#333" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M 14 48 Q 2 44 0 32 Q -1 22 6 18" 
            stroke="none" 
            fill="#FF9F43"
          />
          
          {/* Body */}
          <ellipse cx="35" cy="55" rx="26" ry="22" fill="#FF9F43" stroke="#333" strokeWidth="2.5" />
          {/* Belly */}
          <ellipse cx="32" cy="60" rx="14" ry="12" fill="#FFD89B" />
          
          {/* Paws */}
          <ellipse cx="18" cy="74" rx="10" ry="5" fill="#FF9F43" stroke="#333" strokeWidth="2" />
          <ellipse cx="48" cy="74" rx="10" ry="5" fill="#FF9F43" stroke="#333" strokeWidth="2" />
          
          {/* Head */}
          <circle cx="32" cy="28" r="24" fill="#FF9F43" stroke="#333" strokeWidth="2.5" />
          
          {/* Ears */}
          <path d="M 10 14 L 2 -8 L 24 10 Z" fill="#FF9F43" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 14 10 L 8 -2 L 22 10 Z" fill="#FFB5B5" />
          <path d="M 54 14 L 62 -8 L 40 10 Z" fill="#FF9F43" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 50 10 L 56 -2 L 42 10 Z" fill="#FFB5B5" />
          
          {/* Forehead marking */}
          <path d="M 30 5 L 32 15" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
          
          {/* Muzzle */}
          <ellipse cx="32" cy="38" rx="14" ry="12" fill="#FFD89B" />
          
          {/* Eyes */}
          {!shouldCloseEyes(0) ? (
            <>
              <ellipse cx="22" cy="26" rx="8" ry="9" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <ellipse cx="42" cy="26" rx="8" ry="9" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <circle cx="24" cy="28" r="5" fill="#27AE60" />
              <circle cx="40" cy="28" r="5" fill="#27AE60" />
              <circle cx="24" cy="28" r="2.5" fill="#1A1A1A" />
              <circle cx="40" cy="28" r="2.5" fill="#1A1A1A" />
              <circle cx="22" cy="25" r="2" fill="#FFF" />
              <circle cx="38" cy="25" r="2" fill="#FFF" />
            </>
          ) : (
            <>
              <path d="M 14 26 Q 22 32 30 26" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 34 26 Q 42 32 50 26" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {/* Nose */}
          <ellipse cx="32" cy="40" rx="4" ry="3" fill="#FF6B6B" stroke="#333" strokeWidth="1" />
          
          {/* Mouth - big goofy smile */}
          <path d="M 32 43 L 32 46" stroke="#333" strokeWidth="2" />
          <path d="M 24 46 Q 32 54 40 46" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Whiskers */}
          <line x1="0" y1="36" x2="16" y2="33" stroke="#333" strokeWidth="1.5" />
          <line x1="0" y1="42" x2="16" y2="42" stroke="#333" strokeWidth="1.5" />
          <line x1="48" y1="33" x2="64" y2="36" stroke="#333" strokeWidth="1.5" />
          <line x1="48" y1="42" x2="64" y2="42" stroke="#333" strokeWidth="1.5" />
        </g>

        {/* White Kitten - Cartoon Style */}
        <g transform="translate(85, 5)">
          {/* Tail - curling up elegantly */}
          <path 
            d="M 60 58 Q 75 50 78 35 Q 80 22 70 18" 
            stroke="#333" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M 58 56 Q 72 50 75 36 Q 77 26 70 22" 
            stroke="none" 
            fill="#F8F8F8"
          />
          
          <ellipse cx="40" cy="58" rx="28" ry="24" fill="#F8F8F8" stroke="#333" strokeWidth="2.5" />
          <ellipse cx="36" cy="64" rx="15" ry="13" fill="#FFF" />
          
          <ellipse cx="22" cy="78" rx="10" ry="5" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
          <ellipse cx="54" cy="78" rx="10" ry="5" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
          
          <circle cx="38" cy="30" r="26" fill="#F8F8F8" stroke="#333" strokeWidth="2.5" />
          
          <path d="M 14 14 L 4 -10 L 30 10 Z" fill="#F8F8F8" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 18 9 L 10 -3 L 28 9 Z" fill="#FFD5D5" />
          <path d="M 62 14 L 72 -10 L 46 10 Z" fill="#F8F8F8" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 58 9 L 66 -3 L 48 9 Z" fill="#FFD5D5" />
          
          <ellipse cx="38" cy="42" rx="16" ry="14" fill="#FFF" />
          
          {!shouldCloseEyes(1) ? (
            <>
              <ellipse cx="26" cy="28" rx="9" ry="10" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <ellipse cx="50" cy="28" rx="9" ry="10" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <circle cx="28" cy="30" r="6" fill="#3498DB" />
              <circle cx="48" cy="30" r="6" fill="#3498DB" />
              <circle cx="28" cy="30" r="3" fill="#1A1A1A" />
              <circle cx="48" cy="30" r="3" fill="#1A1A1A" />
              <circle cx="25" cy="27" r="2.5" fill="#FFF" />
              <circle cx="45" cy="27" r="2.5" fill="#FFF" />
            </>
          ) : (
            <>
              <path d="M 17 28 Q 26 35 35 28" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 41 28 Q 50 35 59 28" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          
          <ellipse cx="38" cy="44" rx="4" ry="3" fill="#FFB5B5" stroke="#333" strokeWidth="1" />
          <path d="M 38 47 L 38 50" stroke="#333" strokeWidth="2" />
          <path d="M 30 50 Q 38 58 46 50" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          <line x1="5" y1="40" x2="22" y2="37" stroke="#333" strokeWidth="1.5" />
          <line x1="5" y1="46" x2="22" y2="46" stroke="#333" strokeWidth="1.5" />
          <line x1="54" y1="37" x2="71" y2="40" stroke="#333" strokeWidth="1.5" />
          <line x1="54" y1="46" x2="71" y2="46" stroke="#333" strokeWidth="1.5" />
        </g>

        {/* Black & White Kitten - Cartoon Style */}
        <g transform="translate(165, 12)">
          {/* Tail with white tip - curling up on right side */}
          <path 
            d="M 52 48 Q 68 40 72 25 Q 74 15 65 12" 
            stroke="#333" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M 50 46 Q 64 40 68 27 Q 70 19 65 16" 
            stroke="none" 
            fill="#2C3E50"
          />
          <ellipse cx="65" cy="12" rx="6" ry="5" fill="#F8F8F8" stroke="#333" strokeWidth="1.5" />
          
          <ellipse cx="32" cy="52" rx="24" ry="20" fill="#2C3E50" stroke="#333" strokeWidth="2.5" />
          <path d="M 32 38 Q 18 44 22 58 Q 26 72 32 76 Q 38 72 42 58 Q 46 44 32 38" fill="#F8F8F8" />
          
          <ellipse cx="18" cy="70" rx="9" ry="4.5" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
          <ellipse cx="46" cy="70" rx="9" ry="4.5" fill="#F0F0F0" stroke="#333" strokeWidth="2" />
          
          <circle cx="30" cy="26" r="22" fill="#2C3E50" stroke="#333" strokeWidth="2.5" />
          <path d="M 30 6 Q 22 15 24 30 Q 26 42 30 46 Q 34 42 36 30 Q 38 15 30 6" fill="#F8F8F8" />
          
          <ellipse cx="44" cy="24" rx="10" ry="9" fill="#34495E" />
          
          <path d="M 10 12 L 0 -6 L 24 8 Z" fill="#2C3E50" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 14 8 L 6 -1 L 22 8 Z" fill="#FFB5B5" />
          <path d="M 50 12 L 60 -6 L 36 8 Z" fill="#2C3E50" stroke="#333" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 46 8 L 54 -1 L 38 8 Z" fill="#FFB5B5" />
          
          {!shouldCloseEyes(2) ? (
            <>
              <ellipse cx="20" cy="24" rx="8" ry="9" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <ellipse cx="40" cy="24" rx="8" ry="9" fill="#FFF" stroke="#333" strokeWidth="1.5" />
              <circle cx="22" cy="26" r="5" fill="#F39C12" />
              <circle cx="38" cy="26" r="5" fill="#F39C12" />
              <circle cx="22" cy="26" r="2.5" fill="#1A1A1A" />
              <circle cx="38" cy="26" r="2.5" fill="#1A1A1A" />
              <circle cx="19" cy="23" r="2" fill="#FFF" />
              <circle cx="35" cy="23" r="2" fill="#FFF" />
            </>
          ) : (
            <>
              <path d="M 12 24 Q 20 31 28 24" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 32 24 Q 40 31 48 24" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {/* Blush */}
          <ellipse cx="10" cy="34" rx="5" ry="3" fill="#FFAAAA" opacity="0.5" />
          <ellipse cx="50" cy="34" rx="5" ry="3" fill="#FFAAAA" opacity="0.5" />
          
          <ellipse cx="30" cy="36" rx="3.5" ry="3" fill="#444" stroke="#333" strokeWidth="1" />
          <path d="M 30 39 L 30 42" stroke="#333" strokeWidth="2" />
          <path d="M 24 42 Q 30 49 36 42" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          <line x1="0" y1="33" x2="14" y2="30" stroke="#333" strokeWidth="1.5" />
          <line x1="0" y1="38" x2="14" y2="38" stroke="#333" strokeWidth="1.5" />
          <line x1="46" y1="30" x2="60" y2="33" stroke="#333" strokeWidth="1.5" />
          <line x1="46" y1="38" x2="60" y2="38" stroke="#333" strokeWidth="1.5" />
        </g>
      </svg>

      <style>{`
        .kitten-cartoon-wrapper {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 100;
          pointer-events: none;
          filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
        }
        @media (max-width: 600px) {
          .kitten-cartoon-wrapper { bottom: 10px; left: 10px; }
          .kitten-cartoon-wrapper svg { width: 195px; height: 73px; }
        }
      `}</style>
    </div>
  );
};
