/**
 * AtriumCommunityPostPage — Detalhe de post público em /community/post/:id.
 * Mostra o post original, respostas aprovadas e formulário de resposta.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { toast } from 'sonner';

type Post = {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string | null;
  content: string;
  category: string;
  likes_count: number;
  created_at: string;
  status: string | null;
  author_name?: string;
  user_liked?: boolean;
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

const AtriumCommunityPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: p, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !p) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const { data: replyRows } = await supabase
      .from('community_posts')
      .select('*')
      .eq('parent_id', id)
      .order('created_at', { ascending: true });

    const userIds = [
      ...new Set([p.user_id, ...(replyRows || []).map((r) => r.user_id)]),
    ];
    const { data: profiles } = (await supabase
      .from('public_profiles' as any)
      .select('id, name')
      .in('id', userIds)) as { data: { id: string; name: string }[] | null };
    const profileMap = new Map((profiles || []).map((x) => [x.id, x.name]));

    let userLiked = false;
    if (user) {
      const { data: like } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('post_id', p.id)
        .eq('user_id', user.id)
        .maybeSingle();
      userLiked = !!like;
    }

    setPost({
      ...p,
      author_name: profileMap.get(p.user_id) || 'Anônimo',
      user_liked: userLiked,
    });
    setReplies(
      (replyRows || [])
        .filter((r) => r.status === 'approved' || r.user_id === user?.id)
        .map((r) => ({
          ...r,
          author_name: profileMap.get(r.user_id) || 'Anônimo',
        })),
    );
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const toggleLike = async () => {
    if (!user || !post) {
      navigate(AppRoute.LOGIN);
      return;
    }
    if (post.user_liked) {
      await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('community_likes')
        .insert({ post_id: post.id, user_id: user.id });
    }
    fetch();
  };

  const submitReply = async () => {
    if (!user || !post) {
      navigate(AppRoute.LOGIN);
      return;
    }
    const content = replyContent.trim();
    if (!content) return;
    setSubmitting(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      parent_id: post.id,
      content,
      category: post.category,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast.error('Não foi possível responder');
      return;
    }
    toast.success('Resposta enviada para moderação');
    setReplyContent('');
    fetch();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
        <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Discussão não encontrada.</p>
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
        <title>
          {post.title ? `${post.title} — Comunidade` : 'Discussão — Comunidade'}
        </title>
        <meta
          name="description"
          content={post.content.slice(0, 155)}
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

          <article className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Link
                to={`/community/user/${post.user_id}`}
                className="inline-flex items-center gap-2 hover:text-foreground"
              >
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-xs">
                  {(post.author_name || 'A').charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-foreground">
                  {post.author_name}
                </span>
              </Link>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              <span className="ml-auto uppercase tracking-widest text-[10px] font-bold text-primary">
                {post.category}
              </span>
            </div>
            {post.title && (
              <h1 className="font-serif text-3xl md:text-4xl leading-tight">
                {post.title}
              </h1>
            )}
            <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            <div className="pt-3 border-t border-border flex items-center gap-4">
              <button
                onClick={toggleLike}
                aria-pressed={post.user_liked}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Heart
                  className={`w-4 h-4 ${post.user_liked ? 'fill-primary text-primary' : ''}`}
                />
                {post.likes_count}
              </button>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {replies.length}
              </span>
              {post.status !== 'approved' && (
                <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-600">
                  Aguardando moderação
                </span>
              )}
            </div>
          </article>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
              Respostas
            </h2>
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma resposta ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {replies.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <Link
                        to={`/community/user/${r.user_id}`}
                        className="inline-flex items-center gap-2 hover:text-foreground"
                      >
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-[10px]">
                          {(r.author_name || 'A').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-foreground">
                          {r.author_name}
                        </span>
                      </Link>
                      <span>·</span>
                      <span>{timeAgo(r.created_at)}</span>
                      {r.status !== 'approved' && (
                        <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-600">
                          Em moderação
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/85 whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {user ? (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta…"
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex justify-end">
                <button
                  onClick={submitReply}
                  disabled={submitting || !replyContent.trim()}
                  className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest disabled:opacity-40"
                >
                  {submitting ? 'Enviando…' : 'Responder'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(AppRoute.LOGIN)}
              className="w-full py-3 rounded-full border border-border text-sm font-semibold hover:border-primary/50"
            >
              Faça login para responder
            </button>
          )}
        </div>
      </main>
    </>
  );
};

export default AtriumCommunityPostPage;
