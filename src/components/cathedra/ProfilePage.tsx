import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import PremiumAuditTrail from './PremiumAuditTrail';

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
  const [showAllBadges, setShowAllBadges] = useState(false);
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
    const currentBadges = new Set(profile?.badges || []);
    return BADGE_DEFINITIONS.map(b => ({
      id: b.id,
      label: b.name,
      description: b.description,
      icon: <span className="text-premium-xl">{b.icon}</span>,
      unlocked: currentBadges.has(b.id),
    }));
  }, [profile?.badges]);

  const unlockedCount = useMemo(() => (profile?.badges || []).length, [profile?.badges]);
  const visibleBadges = useMemo(() => {
    if (showAllBadges) return badges;
    // Prioriza desbloqueadas, completa com bloqueadas até 8
    const unlocked = badges.filter(b => b.unlocked);
    const locked = badges.filter(b => !b.unlocked);
    return [...unlocked, ...locked].slice(0, 8);
  }, [badges, showAllBadges]);

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
    const handlePush = async () => {
      try {
        if (pushEnabled) await subscribe();
        else await unsubscribe();
      } catch (err) { console.error('BG Push update failed:', err); }
    };
    handlePush();

    try {
      const { error } = await supabase.from('profiles').update({
        name, bio,
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
        {/* Level Up Overlay */}
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
                className="bg-card border-2 border-primary rounded-premium-lg p-spacing-xl shadow-premium-hover text-center pointer-events-auto max-w-spacing-sm mx-spacing-md"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8 }}
                  className="flex justify-center mb-spacing-sm"
                >
                  <Icons.PartyPopper className="w-spacing-3xl h-spacing-3xl text-primary" />
                </motion.div>
                <h2 className="text-premium-xl font-black text-foreground mb-spacing-2xs">Nível Alcançado!</h2>
                <p className="text-premium-2xl font-black text-primary mb-spacing-xs">{levelName}</p>
                <p className="text-premium-xs text-foreground/70">Nível {currentLevelIdx + 1} · {totalXp} XP</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero unificado: avatar + identidade + nível + CTA contemplativo */}
        <CathedraCard className="p-spacing-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-spacing-lg">
            {/* Avatar */}
            <div className="relative w-spacing-4xl h-spacing-4xl group shrink-0">
              <Avatar className="w-spacing-4xl h-spacing-4xl border-4 border-primary/20">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile.name} /> : null}
                <AvatarFallback className="text-premium-2xl font-black bg-foreground text-background">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-premium-full bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-primary"
                aria-label="Alterar foto de perfil"
              >
                {uploading ? (
                  <div className="w-spacing-md h-spacing-md border-2 border-white border-t-transparent rounded-premium-full animate-spin" />
                ) : (
                  <Icons.Feather className="w-spacing-md h-spacing-md text-white" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Identidade + Nível */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-spacing-sm w-full">
              <div>
                <h1 className="text-premium-2xl font-black text-foreground truncate">{profile.name || 'Peregrino'}</h1>
                <p className="text-premium-xs text-foreground/75 uppercase tracking-widest font-bold">
                  Peregrino · Desde {memberSince}
                </p>
              </div>

              {/* Barra XP compacta */}
              <div className="space-y-spacing-2xs">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-foreground/75">
                  <span>Nível {currentLevelIdx + 1} · {levelName}</span>
                  <span className="text-primary">{totalXp} XP</span>
                </div>
                <div className="relative h-spacing-xs bg-muted rounded-premium-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-premium-full transition-all duration-700"
                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-foreground/70">
                  {nextLevel ? `${nextLevel.minXp - totalXp} XP para ${nextLevel.name}` : 'Nível máximo alcançado'}
                </p>
              </div>

              <CathedraButton
                variant="outline"
                onClick={() => navigate('/spiritual-profile')}
                className="rounded-premium-full px-spacing-lg h-spacing-2xl border-primary/30 text-primary font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Icons.Sparkles className="w-spacing-md h-spacing-md mr-spacing-xs" />
                Perfil Espiritual
              </CathedraButton>
            </div>
          </div>
        </CathedraCard>

        {/* Stats compactos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-sm">
          {statCards.map(s => (
            <CathedraCard key={s.label} className="p-spacing-md text-center space-y-spacing-2xs">
              <div className="text-primary mx-auto w-fit">{s.icon}</div>
              <p className="text-premium-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/75">{s.label}</p>
            </CathedraCard>
          ))}
        </div>

        {/* Streak / Ofensiva Espiritual */}
        <StreakCard streak={profile.streak || 0} maxStreak={profile.max_streak || 0} />


        {/* Tabs organizam o resto */}
        <Tabs defaultValue="overview" className="space-y-spacing-lg">
          <TabsList className="w-full grid grid-cols-3 h-auto p-spacing-2xs rounded-premium-full bg-muted">
            <TabsTrigger value="overview" className="rounded-premium-full text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-premium-full text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Preferências
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-premium-full text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* === VISÃO GERAL === */}
          <TabsContent value="overview" className="space-y-spacing-lg mt-0">
            {/* Favoritos */}
            <button
              type="button"
              onClick={() => navigate('/profile/favorites')}
              className="w-full flex items-center justify-between gap-spacing-md p-spacing-md rounded-premium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex items-center gap-spacing-md">
                <Icons.Star className="w-spacing-md h-spacing-md text-primary" />
                <div>
                  <p className="text-premium-sm font-bold text-foreground">Meus Favoritos</p>
                  <p className="text-premium-xs text-foreground/70">Versículos, orações e trechos salvos</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-spacing-md h-spacing-md text-foreground/70" />
            </button>

            {/* Conquistas colapsáveis */}
            <CathedraCard className="p-spacing-xl space-y-spacing-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Conquistas</h2>
                <span className="text-[10px] font-bold text-primary">{unlockedCount}/{badges.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-spacing-sm">
                {visibleBadges.map(b => (
                  <div
                    key={b.id}
                    className={`relative rounded-premium p-spacing-sm text-center transition-all ${
                      b.unlocked
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 border border-border opacity-60 grayscale'
                    }`}
                    title={b.description}
                  >
                    <div className="flex justify-center mb-spacing-2xs text-primary">{b.icon}</div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground leading-tight">{b.label}</p>
                    {b.unlocked && (
                      <div className="absolute -top-spacing-2xs -right-spacing-2xs w-spacing-md h-spacing-md bg-primary rounded-premium-full flex items-center justify-center">
                        <Icons.Star className="w-spacing-xs h-spacing-xs text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {badges.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllBadges(v => !v)}
                  className="w-full text-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline pt-spacing-xs"
                >
                  {showAllBadges ? 'Mostrar menos' : `Ver todas (${badges.length})`}
                </button>
              )}
            </CathedraCard>

            {/* Doações */}
            <CathedraCard className="p-spacing-xl space-y-spacing-md">
              <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Minhas Doações & Apoio</h2>
              <p className="text-premium-xs text-foreground/75 leading-relaxed italic">
                "Sua contribuição é o que nos permite continuar levando a Luz da Verdade a milhares de corações."
              </p>
              <CathedraButton
                variant="outline"
                className="w-full h-spacing-2xl rounded-premium-full border-primary/20 hover:bg-primary/5 text-primary gap-spacing-xs font-bold uppercase tracking-widest text-[10px]"
                onClick={() => navigate('/transactions/my')}
              >
                <Icons.History className="w-spacing-md h-spacing-md" />
                Ver Histórico de Doações
              </CathedraButton>
            </CathedraCard>

            {profile.is_premium && (
              <CathedraCard className="p-spacing-xl space-y-spacing-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Trilha de Auditoria</h2>
                  <Icons.ShieldCheck className="w-spacing-md h-spacing-md text-primary" />
                </div>
                <p className="text-[10px] text-foreground/70">
                  Histórico técnico de ativação, renovação e webhooks de pagamento.
                </p>
                <PremiumAuditTrail />
              </CathedraCard>
            )}
          </TabsContent>

          {/* === PREFERÊNCIAS === */}
          <TabsContent value="preferences" className="space-y-spacing-lg mt-0">
            {/* Notificações */}
            <CathedraCard className="p-spacing-xl space-y-spacing-lg">
              <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Notificações</h2>

              <div className="space-y-spacing-md">
                <div className="flex items-center justify-between p-spacing-sm bg-muted/30 rounded-premium border border-border/50">
                  <div className="space-y-spacing-2xs">
                    <div className="flex items-center gap-spacing-xs">
                      <Icons.Bell className="w-spacing-md h-spacing-md text-primary" />
                      <p className="text-premium-sm font-bold text-foreground">Push Notifications</p>
                    </div>
                    <p className="text-[10px] text-foreground/70">Lembretes diários de oração.</p>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>

                <div className="flex items-center justify-between p-spacing-sm bg-primary/5 rounded-premium border border-primary/20">
                  <div className="space-y-spacing-2xs">
                    <div className="flex items-center gap-spacing-xs flex-wrap">
                      <Icons.Whatsapp className="w-spacing-md h-spacing-md text-primary" />
                      <p className="text-premium-sm font-bold text-foreground">WhatsApp Oficial</p>
                      <span className="px-spacing-2xs py-spacing-3xs rounded-premium-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-wider">Novo</span>
                    </div>
                    <p className="text-[10px] text-foreground/75 font-medium">Meditações e avisos direto no seu WhatsApp.</p>
                  </div>
                  <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                </div>

                {whatsappEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-spacing-xs pt-spacing-xs"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/75 pl-spacing-2xs">Número (com DDD)</label>
                    <div className="relative">
                      <span className="absolute left-spacing-md top-1/2 -translate-y-1/2 text-foreground/70 text-premium-sm font-bold">+55</span>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-spacing-2xl pr-spacing-md py-spacing-sm bg-muted border border-border rounded-premium-full text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
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
                      <p className="text-premium-sm font-bold text-foreground">Horário do Ritual</p>
                    </div>
                    <p className="text-[10px] text-foreground/70">Sua jornada diária começa aqui.</p>
                  </div>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                    className="bg-transparent text-premium-sm font-bold text-primary border-none focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between p-spacing-sm bg-muted/30 rounded-premium border border-border/50">
                  <div className="space-y-spacing-2xs">
                    <div className="flex items-center gap-spacing-xs">
                      <Icons.Star className="w-spacing-md h-spacing-md text-primary" />
                      <p className="text-premium-sm font-bold text-foreground">Meta Semanal</p>
                    </div>
                    <p className="text-[10px] text-foreground/70">Dias de leitura por semana.</p>
                  </div>
                  <div className="flex items-center gap-spacing-xs">
                    <span className="text-premium-sm font-bold text-primary tabular-nums">{weeklyGoal}d</span>
                    <input
                      type="range" min="1" max="7"
                      value={weeklyGoal}
                      onChange={e => setWeeklyGoal(parseInt(e.target.value))}
                      className="w-spacing-4xl h-spacing-xs bg-muted rounded-premium-full accent-primary"
                    />
                  </div>
                </div>
              </div>
            </CathedraCard>

            {/* Editar Perfil */}
            <CathedraCard className="p-spacing-xl space-y-spacing-md">
              <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Editar Perfil</h2>

              <div className="space-y-spacing-xs">
                <label className="text-premium-xs font-bold text-foreground">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-spacing-xs">
                <label className="text-premium-xs font-bold text-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border rounded-premium p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="border-t border-border pt-spacing-md space-y-spacing-md">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Church className="w-spacing-md h-spacing-md text-primary" />
                  <h3 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Localização Eclesial</h3>
                </div>
                <p className="text-[10px] text-foreground/70 -mt-spacing-xs">Opcional — ajuda a personalizar sua experiência.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
                  <div className="space-y-spacing-2xs">
                    <label className="text-premium-xs font-bold text-foreground">Estado</label>
                    <select
                      value={estado}
                      onChange={e => { setEstado(e.target.value); setDiocese(''); }}
                      className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS_BRASIL.map(uf => (
                        <option key={uf} value={uf}>{ESTADO_NOME[uf]} ({uf})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-spacing-2xs">
                    <label className="text-premium-xs font-bold text-foreground">Diocese</label>
                    <select
                      value={diocese}
                      onChange={e => setDiocese(e.target.value)}
                      disabled={!estado}
                      className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-40"
                    >
                      <option value="">{estado ? 'Selecione a diocese...' : 'Selecione o estado primeiro'}</option>
                      {estado && DIOCESES_POR_ESTADO[estado]?.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-spacing-2xs">
                    <label className="text-premium-xs font-bold text-foreground">Paróquia</label>
                    <input
                      type="text"
                      value={paroquia}
                      onChange={e => setParoquia(e.target.value)}
                      placeholder="Ex: Paróquia São José"
                      className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-spacing-2xs">
                    <label className="text-premium-xs font-bold text-foreground">Movimento / Pastoral</label>
                    <select
                      value={movimentoPastoral}
                      onChange={e => setMovimentoPastoral(e.target.value)}
                      className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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
                className="w-full h-spacing-2xl bg-primary text-primary-foreground rounded-premium-full font-black uppercase text-[10px] tracking-[0.4em] hover:opacity-90 transition-all"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </CathedraButton>
            </CathedraCard>
          </TabsContent>

          {/* === SEGURANÇA === */}
          <TabsContent value="security" className="space-y-spacing-lg mt-0">
            <CathedraCard className="p-spacing-xl space-y-spacing-lg">
              <div className="flex items-center gap-spacing-xs">
                <Icons.ShieldCheck className="w-spacing-md h-spacing-md text-primary" />
                <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Segurança da Conta</h2>
              </div>

              <div className="space-y-spacing-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-sm p-spacing-md bg-muted/30 rounded-premium border border-border/50">
                  <div className="space-y-spacing-2xs">
                    <p className="text-premium-sm font-bold text-foreground">Vincular Conta Google</p>
                    <p className="text-[10px] text-foreground/70">
                      Adicione o Google como método de acesso sem perder seus dados atuais.
                    </p>
                  </div>
                  <GoogleSignInButton
                    text="Vincular Google"
                    className="bg-background hover:bg-muted text-foreground border-border"
                    onSuccess={() => toast.success('Conta Google vinculada com sucesso!')}
                  />
                </div>

                <p className="text-[10px] text-foreground/70 text-center italic">
                  * Ao vincular, você poderá entrar usando e-mail/senha ou sua conta Google.
                </p>
              </div>
            </CathedraCard>
          </TabsContent>
        </Tabs>
      </div>
    </ContemplativeLayout>
  );
};

export default ProfilePage;
