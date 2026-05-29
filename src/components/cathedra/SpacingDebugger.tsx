import React, { useState, useEffect } from 'react';
import { Layout, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const SpacingDebugger: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the toggle in development or if explicitly enabled
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable');
    setIsVisible(isDev);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setIsEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Toggle Button - Visible only on mobile/dev */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-[99999] md:hidden">
          <Button
            variant={isEnabled ? "destructive" : "secondary"}
            size="icon"
            onClick={() => setIsEnabled(!isEnabled)}
            className="rounded-full shadow-lg border border-white/20 backdrop-blur-sm"
            title="Alternar Debug de Espaçamentos (Alt+D)"
          >
            {isEnabled ? <EyeOff className="h-4 w-4" /> : <Layout className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {isEnabled && (
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

          .stack-rhythm, .stack-rhythm-lg {
            outline: 1px dashed rgba(0, 0, 255, 0.5) !important;
            position: relative;
          }
          .stack-rhythm::before, .stack-rhythm-lg::before {
            content: 'stack-rhythm';
            position: absolute;
            top: 2px;
            right: 2px;
            background: rgba(0, 0, 255, 0.8);
            color: white;
            font-size: 8px;
            padding: 2px 4px;
            z-index: 1000;
            text-transform: uppercase;
            font-family: sans-serif;
          }
          .stack-rhythm > * + *, .stack-rhythm-lg > * + * {
            border-top: 2px solid rgba(0, 0, 255, 0.2);
          }

          .padding-rhythm {
            outline: 2px solid rgba(0, 255, 0, 0.5) !important;
            background-clip: content-box;
            background-color: rgba(0, 255, 0, 0.1) !important;
          }

          .header-margin-rhythm {
            border-bottom: 8px solid rgba(255, 165, 0, 0.3) !important;
            position: relative;
          }
          .header-margin-rhythm::after {
            content: 'header-margin';
            position: absolute;
            bottom: -12px;
            right: 0;
            color: rgba(255, 165, 0, 1);
            font-size: 8px;
            font-weight: bold;
          }

          /* Highlighting common tailwind spacing to catch non-token usage */
          [class*="px-"]:not(.padding-rhythm), [class*="py-"]:not(.padding-rhythm), [class*="p-"]:not(.padding-rhythm), 
          [class*="mx-"]:not(.header-margin-rhythm), [class*="my-"], [class*="m-"] {
            background-color: rgba(255, 255, 0, 0.05);
            outline: 1px solid rgba(255, 255, 0, 0.5);
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
      )}
    </>
  );
};