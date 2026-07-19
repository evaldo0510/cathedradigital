/**
 * AtriumCommunityProfilePage — Perfil público em /community/user/:userId.
 * Mostra nome, avatar e posts aprovados do usuário na comunidade.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  role?: string | null;
  is_premium?: boolean | null;
  created_at?: string;
};

type Post = {
  id: string;
  title: string | null;
  content: string;
  category: string;
  likes_count: number;
  created_at: string;
  status: string | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const AtriumCommunityProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: prof } = (await supabase
      .from('public_profiles' as any)
      .select('id, name, avatar_url, role, is_premium, created_at')
      .eq('id', userId)
      .maybeSingle()) as { data: Profile | null };
    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProfile(prof);
    const { data: userPosts } = await supabase
      .from('community_posts')
      .select('id, title, content, category, likes_count, created_at, status, parent_id')
      .eq('user_id', userId)
      .is('parent_id', null)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts((userPosts || []) as Post[]);

    const { data: allPosts } = await supabase
      .from('community_posts')
      .select('likes_count')
      .eq('user_id', userId);
    const totalPosts = allPosts?.length || 0;
    const totalLikes =
      allPosts?.reduce((acc, p: any) => acc + (p.likes_count || 0), 0) || 0;
    setStats({ posts: totalPosts, likes: totalLikes });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-primary text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar à comunidade
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile.name || 'Perfil'} — Comunidade Cathedra</title>
        <meta
          name="description"
          content={`Publicações de ${profile.name} na comunidade Cathedra.`}
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Comunidade
          </Link>

          <header className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center font-bold text-xl text-foreground">
                {(profile.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl md:text-3xl leading-tight truncate">
                {profile.name || 'Anônimo'}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {stats.posts} posts
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> {stats.likes} curtidas
                </span>
                {profile.is_premium && (
                  <span className="text-primary font-bold">PRO</span>
                )}
              </div>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
              Publicações
            </h2>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Ainda não há publicações públicas.
              </p>
            ) : (
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/community/post/${p.id}`}
                      className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                        <span>{timeAgo(p.created_at)}</span>
                        <span className="ml-auto uppercase tracking-widest text-[10px] font-bold text-primary">
                          {p.category}
                        </span>
                      </div>
                      {p.title && (
                        <h3 className="font-serif text-lg md:text-xl leading-snug mb-1">
                          {p.title}
                        </h3>
                      )}
                      <p className="text-sm text-foreground/80 line-clamp-2 whitespace-pre-wrap">
                        {p.content}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> {p.likes_count}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default AtriumCommunityProfilePage;
