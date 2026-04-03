import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ posts: 0, likes: 0, notes: 0, favorites: 0, daysActive: 0 });

  useEffect(() => {
    if (!loading && !user) navigate(AppRoute.LOGIN);
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      // Fetch bio separately since profile type doesn't include it yet
      supabase.from('profiles').select('bio').eq('id', profile.id).single()
        .then(({ data }) => setBio((data as any)?.bio || ''));
    }
  }, [profile]);

  // Fetch participation stats
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
        favorites: 0,
        daysActive: uniqueDays,
      });
    };
    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name, bio } as any).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Erro ao salvar perfil');
    else toast.success('Perfil atualizado!');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !profile) return null;

  const initials = (profile.name || user.email || '?').slice(0, 2).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });

  const statCards = [
    { label: 'Discussões', value: stats.posts, icon: <Icons.Message className="w-5 h-5" /> },
    { label: 'Curtidas', value: stats.likes, icon: <Icons.Heart className="w-5 h-5" /> },
    { label: 'Anotações', value: stats.notes, icon: <Icons.Feather className="w-5 h-5" /> },
    { label: 'Dias Ativos', value: stats.daysActive, icon: <Icons.History className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Avatar className="w-24 h-24 mx-auto border-4 border-primary/20">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.name} />
          ) : null}
          <AvatarFallback className="text-2xl font-black bg-foreground text-background">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-black text-foreground">{profile.name || 'Peregrino'}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {profile.is_premium ? '⭐ Erudito PRO' : 'Peregrino'} · Membro desde {memberSince}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center space-y-1">
            <div className="text-primary mx-auto w-fit">{s.icon}</div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Editar Perfil</h2>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Conte um pouco sobre você e sua jornada de fé..."
          />
          <p className="text-[10px] text-muted-foreground text-right">{bio.length}/300</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">E-mail</label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-foreground text-background rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
