import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelInfo } from '@/lib/levels';
import { Switch } from '@/components/ui/switch';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { ESTADOS_BRASIL, ESTADO_NOME, DIOCESES_POR_ESTADO, MOVIMENTOS_PASTORAIS } from '@/data/dioceses-brasil';
import ContemplativeLayout from './ContemplativeLayout';

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

const ProfilePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { subscribe, unsubscribe } = usePushNotifications();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState('');
  const [diocese, setDiocese] = useState('');
  const [paroquia, setParoquia] = useState('');
  const [movimentoPastoral, setMovimentoPastoral] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const [stats, setStats] = useState({ posts: 0, likes: 0, notes: 0, daysActive: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate(AppRoute.LOGIN);
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || null);
      setWhatsappNumber((profile as any).whatsapp_number || '');
      setWhatsappEnabled((profile as any).whatsapp_enabled || false);
      setPushEnabled((profile as any).push_enabled ?? true);
      setReminderTime((profile as any).ritual_reminder_time || '08:00');
      setWeeklyGoal((profile as any).weekly_goal || 7);
      supabase.from('profiles').select('bio, estado, diocese, paroquia, movimento_pastoral').eq('id', profile.id).single()
        .then(({ data }) => {
          setBio((data as any)?.bio || '');
          setEstado((data as any)?.estado || '');
          setDiocese((data as any)?.diocese || '');
          setParoquia((data as any)?.paroquia || '');
          setMovimentoPastoral((data as any)?.movimento_pastoral || '');
        });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [postsRes, likesRes, notesRes, historyRes] = await Promise.all([
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('community_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_history').select('visited_at').eq('user_id', user.id),
      ]);
      const uniqueDays = new Set((historyRes.data || []).map(h => h.visited_at.slice(0, 10))).size;
      setStats({
        posts: postsRes.count || 0,
        likes: likesRes.count || 0,
        notes: notesRes.count || 0,
        daysActive: uniqueDays,
      });
    };
    fetchStats();
  }, [user]);

  const badges = useMemo(() => {
    const { posts, likes, notes } = stats;
    const currentBadges = new Set(profile?.badges || []);
    
    // We combine global badges with community-specific ones for display
    return BADGE_DEFINITIONS.map(b => ({
      id: b.id,
      label: b.name,
      description: b.description,
      icon: <span className="text-xl">{b.icon}</span>,
      unlocked: currentBadges.has(b.id)
    }));
  }, [stats, profile?.badges]);

  const unlockedCount = useMemo(() => (profile?.badges || []).length, [profile?.badges]);
  const totalXp = profile?.xp || 0;
  const { levelIdx: currentLevelIdx, levelName, nextLevel, progress: xpProgress } = getLevelInfo(totalXp);

  useEffect(() => {
    if (prevLevelRef.current !== null && currentLevelIdx > prevLevelRef.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
    }
    prevLevelRef.current = currentLevelIdx;
  }, [currentLevelIdx]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao enviar avatar');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const freshUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: freshUrl } as any).eq('id', user.id);
    setAvatarUrl(freshUrl);
    setUploading(false);
    toast.success('Avatar atualizado!');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // Background push notification updates (they take long and aren't critical for initial feedback)
    const handlePush = async () => {
      try {
        if (pushEnabled) await subscribe();
        else await unsubscribe();
      } catch (err) { console.error('BG Push update failed:', err); }
    };
    handlePush();

    try {
      const { error } = await supabase.from('profiles').update({ 
        name, 
        bio, 
        whatsapp_number: whatsappNumber,
        whatsapp_enabled: whatsappEnabled,
        push_enabled: pushEnabled,
        ritual_reminder_time: reminderTime,
        weekly_goal: weeklyGoal,
        estado: estado || null,
        diocese: diocese || null,
        paroquia: paroquia || null,
        movimento_pastoral: movimentoPastoral || null,
      } as any).eq('id', user.id);
      
      if (error) throw error;
      toast.success('Perfil atualizado!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
    </div>
  );

  if (!user || !profile) return null;

  const initials = (profile.name || user.email || '?').slice(0, 2).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });

  const statCards = [
    { label: 'Discussões', value: stats.posts, icon: <Icons.Message className="w-spacing-md h-spacing-md" /> },
    { label: 'Curtidas', value: stats.likes, icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
    { label: 'Anotações', value: stats.notes, icon: <Icons.Feather className="w-spacing-md h-spacing-md" /> },
    { label: 'Dias Ativos', value: stats.daysActive, icon: <Icons.History className="w-spacing-md h-spacing-md" /> },
  ];

  return (
    <ContemplativeLayout
      subtitle="Santuário Pessoal"
      title="Meu Perfil"
      maxW="max-w-spacing-2xl"
    >
      <div className="space-y-spacing-xl relative">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              className="bg-card border-2 border-primary rounded-full p-spacing-xl shadow-premium-hover text-center pointer-events-auto max-w-spacing-sm mx-spacing-md"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8 }}
                className="flex justify-center mb-spacing-sm"
              >
                <Icons.PartyPopper className="w-spacing-3xl h-spacing-3xl text-primary" />
              </motion.div>
              <h2 className="text-xl font-black text-foreground mb-spacing-2xs">Nível Alcançado!</h2>
              <p className="text-2xl font-black text-primary mb-spacing-xs">{levelName}</p>
              <p className="text-xs text-muted-foreground">Nível {currentLevelIdx + 1} · {totalXp} XP</p>
              <div className="flex justify-center gap-spacing-xs mt-spacing-sm text-primary/40">
                <Icons.Sparkles className="w-spacing-md h-spacing-md" />
                <Icons.Star className="w-spacing-md h-spacing-md" />
                <Icons.Zap className="w-spacing-md h-spacing-md" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mb-spacing-xl">
        <CathedraButton 
          variant="outline" 
          onClick={() => navigate('/spiritual-profile')}
          className="rounded-full px-spacing-xl h-spacing-2xl border-primary/20 text-primary/60 font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-primary-foreground transition-all duration-700"
        >
          <Icons.Sparkles className="w-spacing-md h-spacing-md mr-spacing-xs" />
          Ver Perfil Espiritual Contemplativo
        </CathedraButton>
      </div>

      <div className="text-center space-y-spacing-md">
        <div className="relative w-spacing-4xl h-spacing-4xl mx-auto group">
          <Avatar className="w-spacing-4xl h-spacing-4xl border-4 border-primary/20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile.name} /> : null}
            <AvatarFallback className="text-2xl font-black bg-foreground text-background">{initials}</AvatarFallback>
          </Avatar>
          <CathedraButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus-visible:opacity-100 outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Alterar foto de perfil"
          >
            {uploading ? (
              <div className="w-spacing-md h-spacing-md border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icons.Feather className="w-spacing-md h-spacing-md text-white" />
            )}
          </CathedraButton>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-foreground">{profile.name || 'Peregrino'}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {profile.is_premium ? '⭐ Erudito PRO' : 'Peregrino'} · Membro desde {memberSince}
          </p>
        </div>
      </div>

      <CathedraCard className="p-spacing-xl space-y-spacing-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nível {currentLevelIdx + 1}</p>
            <p className="text-lg font-black text-foreground">{levelName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{totalXp}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">XP Total</p>
          </div>
        </div>
        <div className="relative h-spacing-sm bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(xpProgress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{levelName}</span>
          <span>{nextLevel ? `${nextLevel.minXp - totalXp} XP para ${nextLevel.name}` : 'Nível máximo!'}</span>
        </div>
      </CathedraCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-sm">
        {statCards.map(s => (
          <CathedraCard key={s.label} className="p-spacing-md text-center space-y-spacing-2xs">
            <div className="text-primary mx-auto w-fit">{s.icon}</div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </CathedraCard>
        ))}
      </div>

      <CathedraCard className="p-spacing-xl space-y-spacing-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conquistas</h2>
          <span className="text-[10px] font-bold text-primary">{unlockedCount}/{badges.length} desbloqueadas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-spacing-sm">
          {badges.map(b => (
            <div
              key={b.id}
              className={`relative rounded-full p-spacing-sm text-center transition-all ${
                b.unlocked
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50 border border-border opacity-50 grayscale'
              }`}
              title={b.description}
            >
              <div className="flex justify-center mb-spacing-2xs text-primary">
                {b.icon}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground leading-tight">{b.label}</p>
              <p className="text-[10px] text-muted-foreground mt-spacing-3xs">{b.description}</p>
              {b.unlocked && (
                <div className="absolute -top-spacing-2xs -right-spacing-2xs w-spacing-md h-spacing-md bg-primary rounded-full flex items-center justify-center">
                  <Icons.Star className="w-spacing-xs h-spacing-xs text-primary-foreground fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CathedraCard>

      <CathedraCard className="p-spacing-xl space-y-spacing-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Minhas Doações & Apoio</h2>
        </div>
        <div className="space-y-spacing-md">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "Sua contribuição é o que nos permite continuar levando a Luz da Verdade a milhares de corações."
          </p>
          <CathedraButton 
            variant="outline" 
            className="w-full h-spacing-2xl rounded-full border-secondary/20 hover:bg-secondary/5 text-secondary gap-spacing-xs font-bold uppercase tracking-widest text-[10px] focus-visible:ring-4 focus-visible:ring-secondary outline-none"
            onClick={() => navigate('/transactions/my')}
          >
            <Icons.History className="w-spacing-md h-spacing-md" />
            Ver Histórico de Doações
          </CathedraButton>

        </div>
      </CathedraCard>

      <CathedraCard className="p-spacing-xl space-y-spacing-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notificações</h2>
        </div>

        <div className="space-y-spacing-md">
          <div className="flex items-center justify-between p-spacing-sm bg-muted/30 rounded-premium border border-border/50">
            <div className="space-y-spacing-2xs">
              <div className="flex items-center gap-spacing-xs">
                <Icons.Bell className="w-spacing-md h-spacing-md text-primary" />
                <p className="text-sm font-bold text-foreground">Push Notifications</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Lembretes diários de oração.</p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>

          <div className="flex items-center justify-between p-spacing-sm bg-primary/5 rounded-premium border border-primary/20 shadow-md">
            <div className="space-y-spacing-2xs">
              <div className="flex items-center gap-spacing-xs">
                <Icons.Whatsapp className="w-spacing-md h-spacing-md text-primary" />
                <p className="text-sm font-bold text-foreground">WhatsApp Oficial</p>
                <div className="px-spacing-2xs py-spacing-3xs rounded-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-wider">Novo</div>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Receba meditações e avisos diretamente no seu WhatsApp.</p>
            </div>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>

          {whatsappEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-spacing-xs pt-spacing-xs"
            >
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-spacing-2xs">Número do WhatsApp (com DDD)</label>
              <div className="relative">
                <span className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">+55</span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-spacing-2xl pr-spacing-md py-spacing-sm bg-muted border border-border rounded-full text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  placeholder="11999999999"
                  maxLength={11}
                />
              </div>
            </motion.div>
          )}
          <div className="flex items-center justify-between p-spacing-sm bg-muted/30 rounded-premium border border-border/50">
            <div className="space-y-spacing-2xs">
              <div className="flex items-center gap-spacing-xs">
                <Icons.Clock className="w-spacing-md h-spacing-md text-primary" />
                <p className="text-sm font-bold text-foreground">Horário do Ritual</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sua jornada diária começa aqui.</p>
            </div>
            <input 
              type="time" 
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="bg-transparent text-sm font-bold text-primary border-none focus:ring-0"
            />
          </div>
          
          <div className="flex items-center justify-between p-spacing-sm bg-muted/30 rounded-premium border border-border/50">
            <div className="space-y-spacing-2xs">
              <div className="flex items-center gap-spacing-xs">
                <Icons.Star className="w-spacing-md h-spacing-md text-primary" />
                <p className="text-sm font-bold text-foreground">Meta Semanal</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Dias de leitura por semana.</p>
            </div>
            <div className="flex items-center gap-spacing-xs">
              <span className="text-sm font-bold text-primary">{weeklyGoal} dias</span>
              <input 
                type="range" 
                min="1" 
                max="7" 
                value={weeklyGoal}
                onChange={e => setWeeklyGoal(parseInt(e.target.value))}
                className="w-spacing-4xl h-spacing-xs bg-muted rounded-full accent-primary"
              />
            </div>
          </div>
        </div>
      </CathedraCard>

      {!profile.is_premium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CathedraCard 
            variant="interactive" 
            padding="none"
            className="border-secondary/50 bg-secondary/10 border-2 overflow-hidden relative group" 
            onClick={() => navigate(AppRoute.PRICING)}
          >
            <div className="absolute top-0 right-0 p-spacing-lg opacity-20 group-hover:opacity-40 transition-all group-hover:scale-110">
              <Icons.Star className="w-spacing-3xl h-spacing-3xl text-secondary fill-current" />
            </div>
            <div className="p-spacing-lg space-y-spacing-md">
              <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
                <div className="px-spacing-xs py-spacing-3xs rounded-full bg-secondary/20 text-amber-800 dark:text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/30">
                  Acesso Completo
                </div>
              </div>
              <h3 className="text-xl font-serif text-foreground font-bold">Eleve sua vida espiritual ao nível PRO.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                Desbloqueie todas as jornadas, o Logos ilimitado e ferramentas exclusivas de estudo.
              </p>
              <CathedraButton size="sm" className="bg-secondary hover:bg-secondary/90 text-amber-950 font-black text-[10px] uppercase tracking-widest h-spacing-xl px-spacing-lg">
                Ver Planos <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-2xs" />
              </CathedraButton>
            </div>
          </CathedraCard>
        </motion.div>
      )}

      <CathedraCard className="p-spacing-lg space-y-spacing-md">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Editar Perfil</h2>

        <div className="space-y-spacing-xs">
          <label className="text-xs font-bold text-foreground">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-full p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-spacing-xs">
          <label className="text-xs font-bold text-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            className="w-full bg-background border border-border rounded-premium p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {/* Localização Eclesial */}
        <div className="border-t border-border pt-spacing-md space-y-spacing-md">
          <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
            <Icons.Church className="w-spacing-md h-spacing-md text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Localização Eclesial</h3>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-spacing-xs">Opcional — ajuda a personalizar sua experiênica.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
            <div className="space-y-spacing-2xs">
              <label className="text-xs font-bold text-foreground">Estado</label>
              <select
                value={estado}
                onChange={e => { setEstado(e.target.value); setDiocese(''); }}
                className="w-full bg-background border border-border rounded-full p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">Selecione...</option>
                {ESTADOS_BRASIL.map(uf => (
                  <option key={uf} value={uf}>{ESTADO_NOME[uf]} ({uf})</option>
                ))}
              </select>
            </div>

            <div className="space-y-spacing-2xs">
              <label className="text-xs font-bold text-foreground">Diocese</label>
              <select
                value={diocese}
                onChange={e => setDiocese(e.target.value)}
                disabled={!estado}
                className="w-full bg-background border border-border rounded-full p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-40"
              >
                <option value="">{estado ? 'Selecione a diocese...' : 'Selecione o estado primeiro'}</option>
                {estado && DIOCESES_POR_ESTADO[estado]?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-spacing-2xs">
              <label className="text-xs font-bold text-foreground">Paróquia</label>
              <input
                type="text"
                value={paroquia}
                onChange={e => setParoquia(e.target.value)}
                placeholder="Ex: Paróquia São José"
                className="w-full bg-background border border-border rounded-full p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-spacing-2xs">
              <label className="text-xs font-bold text-foreground">Movimento / Pastoral</label>
              <select
                value={movimentoPastoral}
                onChange={e => setMovimentoPastoral(e.target.value)}
                className="w-full bg-background border border-border rounded-full p-spacing-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">Nenhum</option>
                {MOVIMENTOS_PASTORAIS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <CathedraButton
          onClick={handleSave}
          isLoading={saving}
          className="w-full h-spacing-2xl bg-primary text-primary-foreground rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-premium-hover hover:opacity-90 transition-all"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </CathedraButton>
      </CathedraCard>

      <CathedraCard className="p-spacing-xl space-y-spacing-lg">
        <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
          <Icons.ShieldCheck className="w-spacing-md h-spacing-md text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Segurança da Conta</h2>
        </div>
        
        <div className="space-y-spacing-md">
          <div className="flex items-center justify-between p-spacing-md bg-muted/30 rounded-premium border border-border/50">
            <div className="space-y-spacing-2xs">
              <p className="text-sm font-bold text-foreground">Vincular Conta Google</p>
              <p className="text-[10px] text-muted-foreground">
                Adicione o Google como método de acesso sem perder seus dados atuais.
              </p>
            </div>
            <GoogleSignInButton 
              text="Vincular Google" 
              className="bg-background hover:bg-muted text-foreground border-border"
              onSuccess={() => toast.success('Conta Google vinculada com sucesso!')}
            />
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center italic">
            * Ao vincular, você poderá entrar usando tanto seu e-mail/senha quanto sua conta Google.
          </p>
        </div>
      </CathedraCard>
      </div>
    </ContemplativeLayout>
  );
};

export default ProfilePage;