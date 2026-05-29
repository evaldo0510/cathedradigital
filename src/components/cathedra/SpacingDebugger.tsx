import React, { useState, useEffect } from 'react';

export const SpacingDebugger: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setIsEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isEnabled) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Highlighting Spacing Tokens */
      .section-rhythm {
        outline: 1px dashed rgba(255, 0, 0, 0.5) !important;
        position: relative;
      }
      .section-rhythm::before {
        content: 'section-rhythm';
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        font-size: 8px;
        padding: 2px 4px;
        z-index: 1000;
        text-transform: uppercase;
        font-family: sans-serif;
      }

      .stack-rhythm {
        outline: 1px dashed rgba(0, 0, 255, 0.5) !important;
        position: relative;
      }
      .stack-rhythm > * + * {
        border-top: 1px solid rgba(0, 0, 255, 0.2);
      }

      .padding-rhythm {
        box-shadow: inset 0 0 0 1000px rgba(0, 255, 0, 0.05) !important;
        border: 1px solid rgba(0, 255, 0, 0.3) !important;
      }

      .header-margin-rhythm {
        border-bottom: 4px solid rgba(255, 165, 0, 0.4) !important;
      }

      /* Highlighting common tailwind spacing to catch non-token usage */
      [class*="px-"], [class*="py-"], [class*="p-"], 
      [class*="mx-"], [class*="my-"], [class*="m-"] {
        background-color: rgba(255, 255, 0, 0.02);
      }

      /* Rhythm Grid Overlay */
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px);
        background-size: 100% 8px;
        z-index: 9999;
        opacity: 0.5;
      }
    `}} />
  );
};
