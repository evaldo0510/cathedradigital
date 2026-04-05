import React, { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Calendar, Church, HandHeart } from 'lucide-react';

const DailyLiturgy = lazy(() => import('./DailyLiturgy'));
const LiturgicalCalendarPage = lazy(() => import('./LiturgicalCalendarPage'));
const MissalPage = lazy(() => import('./MissalPage'));
const PrayerPage = lazy(() => import('./PrayerPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[30vh]">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const TABS = [
  { value: 'liturgia', label: 'Liturgia do Dia', icon: BookOpen },
  { value: 'calendario', label: 'Calendário', icon: Calendar },
  { value: 'missal', label: 'Missal Romano', icon: Church },
  { value: 'oracoes', label: 'Orações', icon: HandHeart },
] as const;

const LiturgiaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'liturgia';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Chalice className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sacra Liturgia</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">Liturgia</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full max-w-2xl mx-auto h-auto p-1 bg-secondary rounded-2xl grid grid-cols-4 gap-1">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
            >
              <tab.icon className="w-4 h-4" />
              <span className="leading-tight text-center">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="liturgia" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <DailyLiturgy />
            </Suspense>
          </TabsContent>
          <TabsContent value="calendario" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <LiturgicalCalendarPage />
            </Suspense>
          </TabsContent>
          <TabsContent value="missal" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <MissalPage />
            </Suspense>
          </TabsContent>
          <TabsContent value="oracoes" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <PrayerPage />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
};

export default LiturgiaPage;
