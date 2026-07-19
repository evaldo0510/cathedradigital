import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Step } from './lectio/constants';
import LectioIntro from './lectio/LectioIntro';
import LectioStep from './lectio/LectioStep';
import LectioConclusio from './lectio/LectioConclusio';
import LectioNotesSheet from './lectio/LectioNotesSheet';
import { LectioMobileNav } from './lectio/LectioMobileNav';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import {
  useLectioProgress,
  getLectioProgress,
  getLastLectio,
} from './lectio/useLectioProgress';

const LectioDivina: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  // Hidratação inicial a partir do localStorage
  const restored = React.useMemo(() => {
    if (initialRef) return getLectioProgress(initialRef);
    return getLastLectio();
  }, [initialRef]);

  const [selectedPassage, setSelectedPassage] = useState(initialRef || restored?.passage || '');
  const [currentStep, setCurrentStep] = useState<Step>(
    restored?.step ?? (initialRef ? 'lectio' : 'intro'),
  );
  const [notes, setNotes] = useState<Record<string, string>>(restored?.notes ?? {});
  const [seconds, setSeconds] = useState(restored?.seconds ?? 0);
  const [bibleText, setBibleText] = useState<{ number: number; text: string }[]>([]);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistência automática (localStorage)
  useLectioProgress({
    passage: selectedPassage,
    step: currentStep,
    notes,
    seconds,
    enabled: currentStep !== 'intro',
  });

  // Auto-start timer when leaving intro
  useEffect(() => {
    if (currentStep !== 'intro' && currentStep !== 'conclusio') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      }
    }
    if (currentStep === 'conclusio' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentStep]);

  // Fetch Bible text
  useEffect(() => {
    if (selectedPassage && currentStep !== 'intro' && currentStep !== 'conclusio') {
      const match = selectedPassage.match(/^([a-zA-ZáéíóúÁÉÍÓÚ123]+)\s+(\d+)(?:,(\d+)(?:-(\d+))?)?$/);
      if (match) {
        const abbrev = match[1];
        const chapter = parseInt(match[2]);
        const startVerse = match[3] ? parseInt(match[3]) : null;
        const endVerse = match[4] ? parseInt(match[4]) : null;

        setIsBibleLoading(true);
        setBibleError('');
        setBibleText([]);

        supabase.functions.invoke('bible-text', {
          body: { abbrev, chapter }
        }).then(({ data, error }) => {
          if (error) {
            setBibleError('Erro ao carregar o texto bíblico.');
          } else if (data?.verses?.length > 0) {
            let verses = data.verses;
            if (startVerse !== null) {
              if (endVerse !== null) {
                verses = verses.filter((v: any) => v.number >= startVerse && v.number <= endVerse);
              } else {
                verses = verses.filter((v: any) => v.number === startVerse);
              }
            }
            setBibleText(verses);
          } else {
            setBibleError('Texto não disponível para esta referência.');
          }
          setIsBibleLoading(false);
        });
      }
    }
  }, [selectedPassage, currentStep]);

  const handleStart = () => {
    // Se já há progresso salvo para esta passagem, retoma; senão zera
    const existing = getLectioProgress(selectedPassage);
    if (existing) {
      setCurrentStep(existing.step === 'intro' ? 'lectio' : existing.step);
      setNotes(existing.notes);
      setSeconds(existing.seconds);
    } else {
      setCurrentStep('lectio');
      setSeconds(0);
    }
  };

  const handleRestart = () => {
    setCurrentStep('intro');
    setNotes({});
    setSeconds(0);
    setBibleText([]);
  };

  const handleBack = () => {
    setCurrentStep('intro');
    setBibleText([]);
  };

  const notesSheet = (
    <LectioNotesSheet
      passage={selectedPassage}
      notes={notes}
      onNotesChange={setNotes}
      currentStep={currentStep === 'intro' || currentStep === 'conclusio' ? undefined : currentStep}
      onGoToStep={(s) => setCurrentStep(s)}
    />
  );

  const showLectioNav = currentStep !== 'intro' && currentStep !== 'conclusio';

  return (
    <>
      {currentStep === 'intro' && (
        <>
          <LectioIntro
            selectedPassage={selectedPassage}
            onPassageChange={setSelectedPassage}
            onStart={handleStart}
          />
          <MobileBottomNav />
        </>
      )}

      {currentStep === 'conclusio' && (
        <>
          <LectioConclusio
            selectedPassage={selectedPassage}
            notes={notes}
            seconds={seconds}
            onRestart={handleRestart}
          />
          <MobileBottomNav />
        </>
      )}

      {showLectioNav && (
        <>
          {/* Barra flutuante desktop + mobile para abrir notas rapidamente */}
          <div className="fixed right-4 top-20 z-30 hidden md:block">
            {notesSheet}
          </div>
          <div className="md:hidden fixed right-3 bottom-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+12px)] z-30">
            {notesSheet}
          </div>

          <LectioStep
            currentStep={currentStep as Exclude<Step, 'intro' | 'conclusio'>}
            selectedPassage={selectedPassage}
            notes={notes}
            onNotesChange={setNotes}
            seconds={seconds}
            bibleText={bibleText}
            isBibleLoading={isBibleLoading}
            bibleError={bibleError}
            onBack={handleBack}
            onStepChange={setCurrentStep}
          />

          <LectioMobileNav
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            disabled={isBibleLoading}
          />
        </>
      )}
    </>
  );
};

export default LectioDivina;
