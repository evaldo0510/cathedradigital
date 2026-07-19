/**
 * AtriumCommunityPage — Etapa M10 (Comunidade).
 *
 * Feed editorial com lista de discussões aprovadas, seletor de categoria,
 * criação de post inline e links para /community/post/:id e /community/user/:userId.
 * A versão anterior (fórum + ranking + busca fuzzy) segue em /community-legacy.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Heart, Sparkles, Users, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'geral', label: 'Geral' },
  { id: 'testemunho', label: 'Testemunho' },
  { id: 'partilha', label: 'Partilha' },
  { id: 'teologia', label: 'Teologia' },
  { id: 'biblia', label: 'Bíblia' },
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'moral', label: 'Moral' },
  { id: 'espiritualidade', label: 'Espiritualidade' },
];

type Post = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  category: string;
  likes_count: number;
  created_at: string;
  status: string | null;
  author_name?: string;
  replies_count?: number;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const AtriumCommunityPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('geral');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('geral');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('community_posts')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (category !== 'geral') q = q.eq('category', category);
    const { data, error } = await q;
    if (error) {
      setLoading(false);
      return;
    }
    const rows = data || [];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    let profileMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = (await supabase
        .from('public_profiles' as any)
        .select('id, name')
        .in('id', userIds)) as { data: { id: string; name: string }[] | null };
      profileMap = new Map((profiles || []).map((p) => [p.id, p.name]));
    }
    // count replies
    const replyCounts = new Map<string, number>();
    if (rows.length) {
      const { data: replies } = await supabase
        .from('community_posts')
        .select('parent_id')
        .in('parent_id', rows.map((r) => r.id));
      (replies || []).forEach((r: any) => {
        if (!r.parent_id) return;
        replyCounts.set(r.parent_id, (replyCounts.get(r.parent_id) || 0) + 1);
      });
    }
    const enriched: Post[] = rows
      .map((p) => ({
        ...p,
        author_name: profileMap.get(p.user_id) || 'Anônimo',
        replies_count: replyCounts.get(p.id) || 0,
      }))
      .filter((p) => p.status === 'approved' || p.user_id === user?.id);
    setPosts(enriched);
    setLoading(false);
  }, [category, user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const submitPost = async () => {
    if (!user) {
      navigate(AppRoute.LOGIN);
      return;
    }
    const content = newContent.trim();
    if (!content) return;
    setSubmitting(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      title: newTitle.trim() || null,
      content,
      category: newCategory,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast.error('Não foi possível publicar');
      return;
    }
    toast.success('Enviado para moderação');
    setNewTitle('');
    setNewContent('');
    setShowNew(false);
    fetchPosts();
  };

  const emptyState = useMemo(
    () => !loading && posts.length === 0,
    [loading, posts.length],
  );

  return (
    <>
      <Helmet>
        <title>Comunidade — Cathedra</title>
        <meta
          name="description"
          content="Discussões, testemunhos e partilhas entre irmãos na fé."
        />
        <link rel="canonical" href="https://cathedradigital.com.br/community" />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        {/* Hero editorial */}
        <section className="border-b border-border/40">
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
              <Users className="w-3.5 h-3.5" />
              Communitas Fidelium
            </div>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
              Comunidade
            </h1>
            <p className="text-muted-foreground font-serif italic text-base md:text-lg max-w-2xl mx-auto">
              Um lugar para partilhar a caminhada — testemunhos, dúvidas e leituras entre irmãos na fé.
            </p>
          </div>
        </section>

        {/* Barra de ações */}
        <section className="max-w-4xl mx-auto px-6 pt-8 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                  category === c.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
                aria-pressed={category === c.id}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => (user ? setShowNew((v) => !v) : navigate(AppRoute.LOGIN))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        </section>

        {/* Criação de post */}
        {showNew && (
          <section className="max-w-4xl mx-auto px-6 mt-6">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Partilhe algo edificante..."
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-background border border-border rounded-full px-3 py-1.5 text-xs uppercase tracking-widest font-semibold"
                >
                  {CATEGORIES.filter((c) => c.id !== 'geral').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">
                  Enviado para moderação antes de aparecer no feed.
                </span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setShowNew(false)}
                    className="px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitPost}
                    disabled={submitting || !newContent.trim()}
                    className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest disabled:opacity-40"
                  >
                    {submitting ? 'Enviando…' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Feed */}
        <section className="max-w-4xl mx-auto px-6 py-10">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : emptyState ? (
            <div className="text-center py-20 space-y-5 max-w-lg mx-auto" role="status" aria-live="polite">
              <Sparkles className="w-8 h-8 mx-auto text-primary/50" aria-hidden />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-primary/5 text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
                Silentium
              </div>
              <h2 className="font-serif text-2xl md:text-3xl leading-snug text-foreground">
                A praça ainda repousa em silêncio
              </h2>
              <p className="text-muted-foreground font-serif italic text-base leading-relaxed">
                Nenhuma partilha aprovada por aqui — nem toda estação tem palavras.
                Volte em breve ou seja a primeira voz a ecoar nesta categoria.
              </p>
              {user ? (
                <button
                  onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90"
                >
                  <Plus className="w-4 h-4" aria-hidden />
                  Abrir a primeira partilha
                </button>
              ) : (
                <button
                  onClick={() => navigate(AppRoute.LOGIN)}
                  className="text-primary text-sm font-semibold underline underline-offset-4"
                >
                  Entrar para partilhar
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/community/post/${p.id}`}
                    className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                      <Link
                        to={`/community/user/${p.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 hover:text-foreground"
                      >
                        <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-[11px]">
                          {(p.author_name || 'A').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-foreground">
                          {p.author_name}
                        </span>
                      </Link>
                      <span>·</span>
                      <span>{timeAgo(p.created_at)}</span>
                      <span className="ml-auto uppercase tracking-widest text-[10px] font-bold text-primary">
                        {CATEGORIES.find((c) => c.id === p.category)?.label ||
                          p.category}
                      </span>
                    </div>
                    {p.title && (
                      <h2 className="font-serif text-xl md:text-2xl leading-snug mb-1">
                        {p.title}
                      </h2>
                    )}
                    <p className="text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">
                      {p.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> {p.likes_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />{' '}
                        {p.replies_count}
                      </span>
                      {p.status !== 'approved' && (
                        <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-600">
                          Aguardando moderação
                        </span>
                      )}
                      <ArrowRight className="ml-auto w-4 h-4 text-muted-foreground/60" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
};

export default AtriumCommunityPage;
