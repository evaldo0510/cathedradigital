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
import { exportProfilePdf, type DonationRow, type AuditRow } from '@/lib/profile-pdf-export';
import { useAvatarUrl } from '@/lib/avatar';

const STREAK_MILESTONES = [
  { days: 7, label: 'Chama Constante', badge: '🔥' },
  { days: 30, label: 'Perseverança', badge: '⏳' },
  { days: 100, label: 'Centurião da Fé', badge: '🏆' },
];

const StreakCard: React.FC<{ streak: number; maxStreak: number }> = ({ streak, maxStreak }) => {
  const nextMilestone = STREAK_MILESTONES.find(m => streak < m.days);
  const prevMilestone = [...STREAK_MILESTONES].reverse().find(m => streak >= m.days);
  const base = prevMilestone?.days ?? 0;
  const target = nextMilestone?.days ?? streak;
  const progress = nextMilestone ? Math.min(100, ((streak - base) / (target - base)) * 100) : 100;
  const remaining = nextMilestone ? nextMilestone.days - streak : 0;

  return (
    <CathedraCard className="p-spacing-xl space-y-spacing-lg">
      <div className="flex items-start justify-between gap-spacing-md">
        <div className="flex items-center gap-spacing-md">
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-premium-2xl" aria-hidden="true">🔥</span>
          </div>
          <div>
            <p className="text-premium-3xl font-black text-foreground leading-none tabular-nums">
              {streak}
              <span className="text-premium-sm font-bold text-foreground/75 ml-spacing-2xs">
                {streak === 1 ? 'dia' : 'dias'}
              </span>
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/75 mt-spacing-2xs">
              Ofensiva Espiritual
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-premium-xs font-bold text-primary tabular-nums">{maxStreak}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/70">Recorde</p>
        </div>
      </div>

      <div className="space-y-spacing-2xs">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-foreground/75">
          <span>{nextMilestone ? `Rumo a ${nextMilestone.label}` : 'Todos os marcos alcançados'}</span>
          {nextMilestone && (
            <span className="text-primary tabular-nums">{remaining} {remaining === 1 ? 'dia' : 'dias'}</span>
          )}
        </div>
        <div className="relative h-spacing-xs bg-muted rounded-premium-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-premium-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-spacing-sm pt-spacing-2xs">
        {STREAK_MILESTONES.map(m => {
          const unlocked = streak >= m.days;
          return (
            <div
              key={m.days}
              className={`rounded-premium p-spacing-sm text-center transition-all border ${
                unlocked ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border opacity-70'
              }`}
            >
              <p className={`text-premium-lg mb-spacing-2xs ${unlocked ? '' : 'grayscale'}`} aria-hidden="true">
                {m.badge}
              </p>
              <p className="text-premium-sm font-black text-foreground tabular-nums">{m.days}d</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/75 leading-tight mt-spacing-2xs">
                {m.label}
              </p>
              {unlocked && (
                <p className="text-[9px] font-bold text-primary uppercase tracking-wider mt-spacing-2xs">Conquistado</p>
              )}
            </div>
          );
        })}
      </div>
    </CathedraCard>
  );
};

type ActivityKind = 'donation' | 'audit';
interface ActivityItem {
  id: string;
  kind: ActivityKind;
  date: string;
  title: string;
  subtitle: string;
  amount?: number;
  status?: string;
}

const PAGE_SIZE = 10;

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

  // Activity + achievements data
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [earnedMap, setEarnedMap] = useState<Record<string, string>>({});
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityKind>('all');
  const [activityPage, setActivityPage] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);
  const avatarDisplay = useAvatarUrl(avatarUrl, 192);

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
    const fetchAll = async () => {
      const [postsRes, likesRes, notesRes, historyRes, donRes, auditRes, achRes] = await Promise.all([
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('community_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_history').select('visited_at').eq('user_id', user.id),
        supabase.from('transactions')
          .select('id, created_at, amount, status, description, payment_id, is_donation')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('audit_logs')
          .select('id, created_at, event_type, path, metadata')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', user.id),
      ]);
      const uniqueDays = new Set((historyRes.data || []).map((h: any) => h.visited_at.slice(0, 10))).size;
      setStats({
        posts: postsRes.count || 0,
        likes: likesRes.count || 0,
        notes: notesRes.count || 0,
        daysActive: uniqueDays,
      });
      setDonations(((donRes.data as any[]) || []) as DonationRow[]);
      setAuditRows(((auditRes.data as any[]) || []) as AuditRow[]);
      const map: Record<string, string> = {};
      ((achRes.data as any[]) || []).forEach(a => { map[a.achievement_id] = a.earned_at; });
      setEarnedMap(map);
    };
    fetchAll();
  }, [user]);

  const badges = useMemo(() => {
    const unlockedIds = new Set([...(profile?.badges || []), ...Object.keys(earnedMap)]);
    return BADGE_DEFINITIONS.map(b => ({
      id: b.id,
      label: b.name,
      description: b.description,
      icon: b.icon,
      unlocked: unlockedIds.has(b.id),
      earnedAt: earnedMap[b.id] || null,
    }));
  }, [profile?.badges, earnedMap]);

  const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

  const totalXp = profile?.xp || 0;
  const { levelIdx: currentLevelIdx, levelName, nextLevel, progress: xpProgress } = getLevelInfo(totalXp);

  useEffect(() => {
    if (prevLevelRef.current !== null && currentLevelIdx > prevLevelRef.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
    }
    prevLevelRef.current = currentLevelIdx;
  }, [currentLevelIdx]);

  // Activity feed unificado
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    donations.forEach(d => items.push({
      id: `d-${d.payment_id || d.created_at}`,
      kind: 'donation',
      date: d.created_at || '',
      title: d.is_donation ? 'Doação' : 'Assinatura',
      subtitle: d.description || '—',
      amount: d.amount,
      status: d.status || undefined,
    }));
    auditRows.forEach(a => items.push({
      id: `a-${(a as any).id || a.created_at}`,
      kind: 'audit',
      date: a.created_at || '',
      title: a.event_type,
      subtitle: a.path || '—',
    }));
    return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [donations, auditRows]);

  const filteredActivity = useMemo(
    () => activityFilter === 'all' ? activityItems : activityItems.filter(i => i.kind === activityFilter),
    [activityItems, activityFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE));
  const pagedActivity = filteredActivity.slice((activityPage - 1) * PAGE_SIZE, activityPage * PAGE_SIZE);

  useEffect(() => { setActivityPage(1); }, [activityFilter]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2MB'); return; }
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    // Bucket privado: guardamos apenas o path; leitura é via Signed URL.
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Erro ao enviar avatar'); setUploading(false); return; }
    await supabase.from('profiles').update({ avatar_url: path } as any).eq('id', user.id);
    setAvatarUrl(path);
    setUploading(false);
    toast.success('Avatar atualizado!');
  };

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    const toastId = toast.loading('Salvando alterações...');
    try {
      try {
        if (pushEnabled) await subscribe(); else await unsubscribe();
      } catch (err) { console.error('BG Push update failed:', err); }

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
      toast.success('Perfil atualizado com sucesso!', { id: toastId });
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      toast.error(`Erro ao salvar: ${err?.message || 'tente novamente'}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!user || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportProfilePdf({
        userName: profile?.name || '',
        userEmail: user.email || '',
        donations,
        audit: auditRows,
      });
      toast.success('Relatório PDF gerado!');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Falha ao gerar PDF');
    } finally {
      setExportingPdf(false);
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
    { label: 'Dias Ativos', value: stats.daysActive, icon: <Icons.History className="w-spacing-md h-spacing-md" /> },
    { label: 'Bíblia (Cap.)', value: 38, icon: <Icons.Bible className="w-spacing-md h-spacing-md" /> },
    { label: 'Catecismo (§)', value: 210, icon: <Icons.Catechism className="w-spacing-md h-spacing-md" /> },
    { label: 'Santos', value: 14, icon: <Icons.Saints className="w-spacing-md h-spacing-md" /> },
    { label: 'Jornadas', value: 4, icon: <Icons.Compass className="w-spacing-md h-spacing-md" /> },
    { label: 'Documentos', value: 6, icon: <Icons.ScrollText className="w-spacing-md h-spacing-md" /> },
    { label: 'Orações', value: 31, icon: <Icons.Heart className="w-spacing-md h-spacing-md" /> },
  ];

  const fmtDateShort = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((v || 0) / 100);

  return (
    <ContemplativeLayout subtitle="Santuário Pessoal" title="Meu Perfil" maxW="max-w-5xl w-full">
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

        {/* Hero */}
        <CathedraCard className="p-spacing-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-spacing-lg">
            <div className="relative w-spacing-4xl h-spacing-4xl group shrink-0">
              <Avatar className="w-spacing-3xl h-spacing-3xl sm:w-spacing-4xl sm:h-spacing-4xl border-4 border-primary/20 shrink-0">
                {avatarDisplay ? (
                  <AvatarImage
                    src={avatarDisplay}
                    alt={profile.name}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square h-full w-full object-cover object-center"
                    // @ts-expect-error — atributo válido em HTML mas ainda não tipado por completo
                    fetchpriority="low"
                  />
                ) : null}
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

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-spacing-sm w-full">
              <div>
                <h1 className="text-premium-2xl font-black text-foreground truncate">{profile.name || 'Peregrino'}</h1>
                <p className="text-premium-xs text-foreground/75 uppercase tracking-widest font-bold">
                  Peregrino · Desde {memberSince}
                </p>
              </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-sm">
          {statCards.map(s => (
            <CathedraCard key={s.label} className="p-spacing-md text-center space-y-spacing-2xs">
              <div className="text-primary mx-auto w-fit">{s.icon}</div>
              <p className="text-premium-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/75">{s.label}</p>
            </CathedraCard>
          ))}
        </div>

        <StreakCard streak={profile.streak || 0} maxStreak={profile.max_streak || 0} />

        <Tabs defaultValue="overview" className="space-y-spacing-lg">
          <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 h-auto p-spacing-2xs rounded-premium-lg bg-muted gap-spacing-2xs">
            {[
              { v: 'overview', l: 'Visão Geral' },
              { v: 'achievements', l: `Conquistas (${unlockedCount}/${badges.length})` },
              { v: 'activity', l: 'Atividade' },
              { v: 'settings', l: 'Ajustes' },
            ].map(t => (
              <TabsTrigger
                key={t.v} value={t.v}
                className="rounded-premium-full text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* === VISÃO GERAL === */}
          <TabsContent value="overview" className="space-y-spacing-lg mt-0">
            {/* Tema mais estudado (Simulado via Nexus/Histórico) */}
            <CathedraCard className="p-spacing-xl bg-primary/[0.02] border-primary/10">
              <div className="flex items-center gap-spacing-md">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icons.Flame className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tema mais estudado</p>
                  <h3 className="text-premium-xl font-serif text-foreground">Esperança Cristã</h3>
                </div>
              </div>
            </CathedraCard>

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

            <CathedraCard className="p-spacing-xl space-y-spacing-md">
              <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Minhas Doações & Apoio</h2>
              <p className="text-premium-xs text-foreground/75 leading-relaxed italic">
                "Sua contribuição é o que nos permite continuar levando a Luz da Verdade a milhares de corações."
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-sm">
                <CathedraButton
                  variant="outline"
                  className="w-full h-spacing-2xl rounded-premium-full border-primary/20 hover:bg-primary/5 text-primary gap-spacing-xs font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => navigate('/transactions/my')}
                >
                  <Icons.History className="w-spacing-md h-spacing-md" />
                  Ver Histórico
                </CathedraButton>
                <CathedraButton
                  variant="outline"
                  isLoading={exportingPdf}
                  onClick={handleExportPdf}
                  className="w-full h-spacing-2xl rounded-premium-full border-primary/20 hover:bg-primary/5 text-primary gap-spacing-xs font-bold uppercase tracking-widest text-[10px]"
                >
                  <Icons.Download className="w-spacing-md h-spacing-md" />
                  {exportingPdf ? 'Gerando...' : 'Exportar PDF'}
                </CathedraButton>
              </div>
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

          {/* === CONQUISTAS === */}
          <TabsContent value="achievements" className="space-y-spacing-lg mt-0">
            <CathedraCard className="p-spacing-xl space-y-spacing-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Todas as Conquistas</h2>
                  <p className="text-[10px] text-foreground/70 mt-spacing-2xs">
                    {unlockedCount} de {badges.length} desbloqueadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-premium-xl font-black text-primary tabular-nums">
                    {Math.round((unlockedCount / badges.length) * 100)}%
                  </p>
                </div>
              </div>

              <div className="relative h-spacing-xs bg-muted rounded-premium-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-premium-full transition-all duration-700"
                  style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
                />
              </div>

              <ul className="divide-y divide-border">
                {badges.map(b => (
                  <li key={b.id} className="flex items-start gap-spacing-md py-spacing-md">
                    <div
                      className={`w-spacing-2xl h-spacing-2xl rounded-premium-full flex items-center justify-center shrink-0 border ${
                        b.unlocked
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/40 border-border text-foreground/40 grayscale'
                      }`}
                      aria-hidden="true"
                    >
                      <Icons.Star className="w-spacing-md h-spacing-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-spacing-sm flex-wrap">
                        <p className={`text-premium-sm font-bold ${b.unlocked ? 'text-foreground' : 'text-foreground/60'}`}>
                          {b.label}
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-spacing-xs py-spacing-3xs rounded-premium-full ${
                            b.unlocked
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground/60 border border-border'
                          }`}
                        >
                          {b.unlocked ? 'Conquistada' : 'Bloqueada'}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/70 mt-spacing-2xs">{b.description}</p>
                      {b.unlocked && b.earnedAt && (
                        <p className="text-[10px] text-primary/80 font-bold mt-spacing-2xs">
                          Desbloqueada em {fmtDateShort(b.earnedAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CathedraCard>
          </TabsContent>

          {/* === ATIVIDADE === */}
          <TabsContent value="activity" className="space-y-spacing-lg mt-0">
            <CathedraCard className="p-spacing-xl space-y-spacing-lg">
              <div className="flex items-center justify-between flex-wrap gap-spacing-sm">
                <div>
                  <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Histórico Cronológico</h2>
                  <p className="text-[10px] text-foreground/70 mt-spacing-2xs">
                    {filteredActivity.length} {filteredActivity.length === 1 ? 'evento' : 'eventos'}
                  </p>
                </div>
                <CathedraButton
                  variant="outline"
                  isLoading={exportingPdf}
                  onClick={handleExportPdf}
                  className="h-spacing-2xl rounded-premium-full border-primary/20 hover:bg-primary/5 text-primary gap-spacing-xs font-bold uppercase tracking-widest text-[10px] px-spacing-md"
                >
                  <Icons.Download className="w-spacing-md h-spacing-md" />
                  PDF
                </CathedraButton>
              </div>

              <div className="flex gap-spacing-2xs flex-wrap" role="tablist" aria-label="Filtro de atividade">
                {([
                  { k: 'all', l: 'Tudo' },
                  { k: 'donation', l: 'Doações' },
                  { k: 'audit', l: 'Auditoria' },
                ] as const).map(f => (
                  <button
                    key={f.k}
                    type="button"
                    onClick={() => setActivityFilter(f.k)}
                    aria-pressed={activityFilter === f.k}
                    className={`px-spacing-md py-spacing-2xs rounded-premium-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      activityFilter === f.k
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-foreground/70 border-border hover:border-primary/40'
                    }`}
                  >
                    {f.l}
                  </button>
                ))}
              </div>

              {pagedActivity.length === 0 ? (
                <div className="text-center py-spacing-xl text-premium-xs text-foreground/60">
                  Nenhum evento encontrado.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {pagedActivity.map(item => (
                    <li key={item.id} className="flex items-start gap-spacing-md py-spacing-md">
                      <div
                        className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center shrink-0 ${
                          item.kind === 'donation'
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'bg-muted text-foreground/70 border border-border'
                        }`}
                        aria-hidden="true"
                      >
                        {item.kind === 'donation'
                          ? <Icons.Heart className="w-spacing-sm h-spacing-sm" />
                          : <Icons.ShieldCheck className="w-spacing-sm h-spacing-sm" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-spacing-sm">
                          <p className="text-premium-sm font-bold text-foreground truncate">{item.title}</p>
                          {typeof item.amount === 'number' && (
                            <p className="text-premium-sm font-black text-primary tabular-nums">{fmtBRL(item.amount)}</p>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground/70 truncate">{item.subtitle}</p>
                        <div className="flex items-center gap-spacing-xs mt-spacing-2xs">
                          <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">
                            {fmtDateShort(item.date)}
                          </p>
                          {item.status && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-spacing-2xs py-spacing-3xs rounded-premium-full bg-muted text-foreground/70 border border-border">
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-spacing-sm border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                    disabled={activityPage === 1}
                    className="px-spacing-md py-spacing-xs rounded-premium-full text-[10px] font-black uppercase tracking-widest border border-border text-foreground/70 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 tabular-nums">
                    Página {activityPage} / {totalPages}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                    disabled={activityPage === totalPages}
                    className="px-spacing-md py-spacing-xs rounded-premium-full text-[10px] font-black uppercase tracking-widest border border-border text-foreground/70 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </CathedraCard>
          </TabsContent>

          {/* === AJUSTES (Preferências + Segurança) === */}
          <TabsContent value="settings" className="space-y-spacing-lg mt-0">
            <fieldset disabled={saving} className="space-y-spacing-lg contents">
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
                    <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} disabled={saving} />
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
                    <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} disabled={saving} />
                  </div>

                  {whatsappEnabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-spacing-xs pt-spacing-xs">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/75 pl-spacing-2xs">Número (com DDD)</label>
                      <div className="relative">
                        <span className="absolute left-spacing-md top-1/2 -translate-y-1/2 text-foreground/70 text-premium-sm font-bold">+55</span>
                        <input
                          type="tel"
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                          disabled={saving}
                          className="w-full pl-spacing-2xl pr-spacing-md py-spacing-sm bg-muted border border-border rounded-premium-full text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono disabled:opacity-60"
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
                      disabled={saving}
                      className="bg-transparent text-premium-sm font-bold text-primary border-none focus:ring-0 disabled:opacity-60"
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
                        disabled={saving}
                        className="w-spacing-4xl h-spacing-xs bg-muted rounded-premium-full accent-primary disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </CathedraCard>

              <CathedraCard className="p-spacing-xl space-y-spacing-md">
                <h2 className="text-premium-xs font-black uppercase tracking-widest text-foreground/75">Editar Perfil</h2>

                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold text-foreground">Nome</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)} disabled={saving}
                    className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-spacing-xs">
                  <label className="text-premium-xs font-bold text-foreground">Bio</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)} rows={3} disabled={saving}
                    className="w-full bg-background border border-border rounded-premium p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-60"
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
                        value={estado} disabled={saving}
                        onChange={e => { setEstado(e.target.value); setDiocese(''); }}
                        className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-60"
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
                        value={diocese} onChange={e => setDiocese(e.target.value)} disabled={!estado || saving}
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
                        type="text" value={paroquia} onChange={e => setParoquia(e.target.value)} disabled={saving}
                        placeholder="Ex: Paróquia São José"
                        className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-spacing-2xs">
                      <label className="text-premium-xs font-bold text-foreground">Movimento / Pastoral</label>
                      <select
                        value={movimentoPastoral} onChange={e => setMovimentoPastoral(e.target.value)} disabled={saving}
                        className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-60"
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
                  disabled={saving}
                  className="w-full h-spacing-2xl bg-primary text-primary-foreground rounded-premium-full font-black uppercase text-[10px] tracking-[0.4em] hover:opacity-90 transition-all disabled:opacity-70"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-spacing-xs">
                      <span className="w-spacing-sm h-spacing-sm border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </span>
                  ) : 'Salvar Alterações'}
                </CathedraButton>
              </CathedraCard>

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
            </fieldset>
          </TabsContent>
        </Tabs>
      </div>
    </ContemplativeLayout>
  );
};

export default ProfilePage;
