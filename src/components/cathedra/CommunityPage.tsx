import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'geral', label: 'Geral' },
  { id: 'teologia', label: 'Teologia' },
  { id: 'biblia', label: 'Bíblia' },
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'moral', label: 'Moral' },
  { id: 'espiritualidade', label: 'Espiritualidade' },
];

interface Post {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string | null;
  content: string;
  category: string;
  likes_count: number;
  created_at: string;
  author_name?: string;
  replies_count?: number;
  user_liked?: boolean;
}

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('geral');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('geral');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('community_posts')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (category !== 'geral') {
      query.eq('category', category);
    }

    const { data, error } = await query;
    if (!error && data) {
      // Fetch author names
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      // Fetch user likes
      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id);
        likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      }

      setPosts(data.map(p => ({
        ...p,
        author_name: profileMap.get(p.user_id) || 'Anônimo',
        user_liked: likedPostIds.has(p.id),
      })));
    }
    setLoading(false);
  }, [category, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async () => {
    if (!user) { navigate(AppRoute.LOGIN); return; }
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    if (error) {
      toast.error('Erro ao criar post');
    } else {
      toast.success('Discussão criada!');
      setNewTitle(''); setNewContent(''); setShowNewPost(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const toggleLike = async (post: Post) => {
    if (!user) { navigate(AppRoute.LOGIN); return; }
    if (post.user_liked) {
      await supabase.from('community_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('community_likes').insert({ post_id: post.id, user_id: user.id });
    }
    fetchPosts();
  };

  const openPost = async (post: Post) => {
    setSelectedPost(post);
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .eq('parent_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds.length ? userIds : ['']);
      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
      setReplies(data.map(r => ({ ...r, author_name: profileMap.get(r.user_id) || 'Anônimo' })));
    }
  };

  const submitReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      parent_id: selectedPost.id,
      content: replyContent.trim(),
      category: selectedPost.category,
    });
    if (!error) {
      setReplyContent('');
      openPost(selectedPost);
      toast.success('Resposta enviada!');
    }
    setSubmitting(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // Detail view
  if (selectedPost) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => { setSelectedPost(null); setReplies([]); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Icons.ArrowDown className="w-4 h-4 rotate-90" /> Voltar
        </button>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm">
              {(selectedPost.author_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{selectedPost.author_name}</p>
              <p className="text-[10px] text-muted-foreground">{timeAgo(selectedPost.created_at)}</p>
            </div>
            <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full">
              {CATEGORIES.find(c => c.id === selectedPost.category)?.label || selectedPost.category}
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-foreground">{selectedPost.title}</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button onClick={() => toggleLike(selectedPost)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icons.Heart className={`w-4 h-4 ${selectedPost.user_liked ? 'fill-primary text-primary' : ''}`} />
              {selectedPost.likes_count}
            </button>
            <span className="text-sm text-muted-foreground">{replies.length} respostas</span>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-3">
          {replies.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 ml-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                  {(r.author_name || 'A').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-foreground">{r.author_name}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>

        {/* Reply input */}
        {user ? (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={submitReply} disabled={submitting || !replyContent.trim()}
              className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-all">
              {submitting ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        ) : (
          <button onClick={() => navigate(AppRoute.LOGIN)} className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all">
            Faça login para responder
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Message className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Communitas Fidelium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Comunidade</h1>
        <p className="text-muted-foreground font-serif italic">Discussões e perguntas teológicas entre irmãos na fé.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                category === c.id ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <button onClick={() => user ? setShowNewPost(true) : navigate(AppRoute.LOGIN)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
          + Nova Discussão
        </button>
      </div>

      {/* New post form */}
      {showNewPost && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Nova Discussão</h3>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Título da discussão..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Descreva sua pergunta ou reflexão..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex items-center gap-3">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm">
              {CATEGORIES.filter(c => c.id !== 'geral').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="flex-1" />
            <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
            <button onClick={createPost} disabled={submitting || !newTitle.trim() || !newContent.trim()}
              className="px-5 py-2 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-all">
              {submitting ? '...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Icons.Message className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground italic">Nenhuma discussão encontrada. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <button key={post.id} onClick={() => openPost(post)}
              className="w-full text-left bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">
                  {(post.author_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">{post.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Icons.Heart className={`w-3 h-3 ${post.user_liked ? 'fill-primary text-primary' : ''}`} /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Icons.Message className="w-3 h-3" /> Responder
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
