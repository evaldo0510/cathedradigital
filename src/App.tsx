import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LangContext } from './contexts/LangContext';
import { UI_TRANSLATIONS } from './services/translations';
import Dashboard from './components/cathedra/Dashboard';
import AppHeader from './components/cathedra/AppHeader';

const AppLayout: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [lang] = useState<'pt' | 'en'>('pt');
  
  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || key;
  }, [lang]);

  const appUser = useMemo(() => {
    if (!user || !profile) return null;
    return {
      id: user.id,
      name: profile.name || user.email?.split('@')[0] || '',
      email: user.email || '',
      role: 'pilgrim',
      isPremium: false,
      joinedAt: user.created_at,
      progress: { streak: 0, totalMinutesRead: 0, completedBooks: [], xp: 0, level: 1, badges: [] },
      stats: { versesSaved: 0, studiesPerformed: 0, daysActive: 0 },
    };
  }, [user, profile]);

  return (
    <LangContext.Provider value={{ lang, setLang: () => {}, t }}>
      <div className="min-h-screen bg-background">
        <AppHeader 
          user={user} 
          isDark={false} 
          onToggleDark={() => {}} 
          onOpenSidebar={() => {}} 
          onSignOut={signOut} 
        />
        <main className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard user={appUser as any} />} />
          </Routes>
        </main>
      </div>
    </LangContext.Provider>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);

export default App;