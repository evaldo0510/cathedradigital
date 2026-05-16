import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/cathedra/Card';
import { Button } from '@/components/cathedra/Button';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelInfo } from '@/lib/levels';
import { Switch } from '@/components/ui/switch';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import { ESTADOS_BRASIL, ESTADO_NOME, DIOCESES_POR_ESTADO, MOVIMENTOS_PASTORAIS } from '@/data/dioceses-brasil';
import SpiritualReminderSettings from './SpiritualReminderSettings';
import { ChevronRight } from 'lucide-react';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState('');
  const [diocese, setDiocese] = useState('');
  const [paroquia, setParoquia] = useState('');
  const [movimentoPastoral, setMovimentoPastoral] = useState('');
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
    
    const handlePush = async () => {
      try {
        if (pushEnabled) await subscribe();
        else await unsubscribe();
      } catch (err) { console.error('BG Push update failed:', err); }
    };
    handlePush();

    try {
      const profileUpdate = supabase.from('profiles').update({ 
        name, 
        bio, 
        estado: estado || null,
        diocese: diocese || null,
        paroquia: paroquia || null,
        movimento_pastoral: movimentoPastoral || null,
      }).eq('id', user.id);

      const privateUpdate = supabase.from('profiles_private').update({
        whatsapp_number: whatsappNumber,
        whatsapp_enabled: whatsappEnabled,
        push_enabled: pushEnabled,
      }).eq('id', user.id);
      
      const [pRes, prRes] = await Promise.all([profileUpdate, privateUpdate]);
      
      if (pRes.error) throw pRes.error;
      if (prRes.error) throw prRes.error;
      
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
      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-premium-sm animate-spin" />
    </div>
  );

  if (!user || !profile) return null;

  const initials = (profile.name || user.email || '?').slice(0, 2).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });

  const statCards = [
    { label: 'Discussões', value: stats.posts, icon: <CathedraIcon icon={Icons.Message} size={IconSizePreset.ACTION} /> },
    { label: 'Curtidas', value: stats.likes, icon: <CathedraIcon icon={Icons.Heart} size={IconSizePreset.ACTION} /> },
    { label: 'Anotações', value: stats.notes, icon: <CathedraIcon icon={Icons.Feather} size={IconSizePreset.ACTION} /> },
    { label: 'Dias Ativos', value: stats.daysActive, icon: <CathedraIcon icon={Icons.History} size={IconSizePreset.ACTION} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative">
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
              className="bg-card border-2 border-primary rounded-full p-8 shadow-premium text-center pointer-events-auto max-w-sm mx-4"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8 }}
                className="flex justify-center mb-3"
              >
                <Icons.PartyPopper className="w-16 h-16 text-primary" />
              </motion.div>
              <h2 className="text-xl font-black text-foreground mb-1">Nível Alcançado!</h2>
              <p className="text-2xl font-black text-primary mb-2">{levelName}</p>
              <p className="text-xs text-muted-foreground">Nível {currentLevelIdx + 1} · {totalXp} XP</p>
              <div className="flex justify-center gap-2 mt-3 text-primary/40">
                <Icons.Sparkles className="w-5 h-5" />
                <Icons.Star className="w-5 h-5" />
                <Icons.Zap className="w-5 h-5" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto group">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile.name} /> : null}
            <AvatarFallback className="text-2xl font-black bg-foreground text-background">{initials}</AvatarFallback>
          </Avatar>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus-visible:opacity-100 outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Alterar foto de perfil"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-premium-sm animate-spin" />
            ) : (
              <Icons.Feather className="w-5 h-5 text-white" />
            )}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-foreground">{profile.name || 'Peregrino'}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {profile.is_premium ? '⭐ Erudito PRO' : 'Peregrino'} · Membro desde {memberSince}
          </p>
        </div>
      </div>

      <div className="premium-card p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Nível {currentLevelIdx + 1}</p>
            <p className="text-lg font-black text-foreground">{levelName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{totalXp}</p>
            <p className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">XP Total</p>
          </div>
        </div>
        <div className="relative h-3 bg-muted rounded-premium-sm overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(xpProgress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-premium-tiny text-muted-foreground">
          <span>{levelName}</span>
          <span>{nextLevel ? `${nextLevel.minXp - totalXp} XP para ${nextLevel.name}` : 'Nível máximo!'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-premium-sm p-4 text-center space-y-1">
            <div className="text-primary mx-auto w-fit">{s.icon}</div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="premium-card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conquistas</h2>
          <span className="text-premium-tiny font-bold text-primary">{unlockedCount}/{badges.length} desbloqueadas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {badges.map(b => (
            <div
              key={b.id}
              className={`relative rounded-full p-3 text-center transition-all ${
                b.unlocked
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50 border border-border opacity-50 grayscale'
              }`}
              title={b.description}
            >
              <div className="flex justify-center mb-1 text-primary">
                {b.icon}
              </div>
              <p className="text-premium-tiny font-bold uppercase tracking-wider text-foreground leading-tight">{b.label}</p>
              <p className="text-premium-tiny text-muted-foreground mt-0.5">{b.description}</p>
              {b.unlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-premium-sm flex items-center justify-center">
                  <Icons.Star className="w-2.5 h-2.5 text-primary-foreground fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Progresso Espiritual</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.PROGRESS)} className="text-primary gap-2">
            Ver Detalhes <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Acompanhe seu calendário de purificação e o status das suas trilhas diárias.
          </p>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Minhas Doações & Apoio</h2>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "Sua contribuição é o que nos permite continuar levando a Luz da Verdade a milhares de corações."
          </p>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-full border-secondary/20 hover:bg-secondary/5 text-secondary gap-2 font-bold uppercase tracking-widest text-premium-tiny focus-visible:ring-4 focus-visible:ring-secondary outline-none"
            onClick={() => navigate('/transactions/my')}
          >
            <Icons.History className="w-4 h-4" />
            Ver Histórico de Doações
          </Button>
        </div>
      </div>

      <div className="premium-card p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notificações</h2>
        </div>

        <div className="space-y-4">
          <SpiritualReminderSettings />

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-premium-sm border border-primary/20 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icons.Whatsapp className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">WhatsApp Oficial</p>
                <div className="px-1.5 py-0.5 rounded-premium-sm bg-primary text-primary-foreground text-premium-tiny font-black uppercase tracking-wider">Novo</div>
              </div>
              <p className="text-premium-tiny text-muted-foreground font-medium">Receba meditações e avisos diretamente no seu WhatsApp.</p>
            </div>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>

          {whatsappEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 pt-2"
            >
              <label className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground pl-1">Número do WhatsApp (com DDD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">+55</span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-full text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  placeholder="11999999999"
                  maxLength={11}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-premium-sm p-6 space-y-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Editar Perfil</h2>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div className="border-t border-border pt-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Icons.Church className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Localização Eclesial</h3>
          </div>
          <p className="text-premium-tiny text-muted-foreground -mt-2">Opcional — ajuda a personalizar sua experiência.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Estado</label>
              <select
                value={estado}
                onChange={e => { setEstado(e.target.value); setDiocese(''); }}
                className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">Selecione...</option>
                {ESTADOS_BRASIL.map(uf => (
                  <option key={uf} value={uf}>{ESTADO_NOME[uf]} ({uf})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Diocese</label>
              <select
                value={diocese}
                onChange={e => setDiocese(e.target.value)}
                disabled={!estado}
                className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none disabled:opacity-40"
              >
                <option value="">{estado ? 'Selecione a diocese...' : 'Selecione o estado primeiro'}</option>
                {estado && DIOCESES_POR_ESTADO[estado]?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Paróquia</label>
              <input
                type="text"
                value={paroquia}
                onChange={e => setParoquia(e.target.value)}
                placeholder="Ex: Paróquia São José"
                className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Movimento / Pastoral</label>
              <select
                value={movimentoPastoral}
                onChange={e => setMovimentoPastoral(e.target.value)}
                className="w-full bg-background border border-border rounded-full p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">Nenhum</option>
                {MOVIMENTOS_PASTORAIS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-primary text-primary-foreground rounded-full font-black uppercase text-premium-tiny tracking-widest shadow-premium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
