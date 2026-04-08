import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Step } from './lectio/constants';
import LectioIntro from './lectio/LectioIntro';
import LectioStep from './lectio/LectioStep';
import LectioConclusio from './lectio/LectioConclusio';

const LectioDivina: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const [bibleText, setBibleText] = useState<{ number: number; text: string }[]>([]);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setCurrentStep('lectio');
    setSeconds(0);
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

  if (currentStep === 'intro') {
    return (
      <LectioIntro
        selectedPassage={selectedPassage}
        onPassageChange={setSelectedPassage}
        onStart={handleStart}
      />
    );
  }

  if (currentStep === 'conclusio') {
    return (
      <LectioConclusio
        selectedPassage={selectedPassage}
        notes={notes}
        seconds={seconds}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <LectioStep
      currentStep={currentStep}
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
  );
};

export default LectioDivina;
