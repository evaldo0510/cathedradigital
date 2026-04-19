import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLevelInfo } from '@/lib/levels';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { combinedSimilarity, scoreToTone } from '@/lib/similarity';
import { Loader2, Target, Search as SearchIcon, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'geral', label: 'Geral' },
  { id: 'testemunho', label: '✝ Testemunho' },
  { id: 'partilha', label: '💬 Partilha' },
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
  status: string | null;
  author_name?: string;
  replies_count?: number;
  user_liked?: boolean;
  similarityScore?: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  posts: number;
  likes: number;
  score: number;
  levelName: string;
  levelIdx: number;
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
  const [tab, setTab] = useState<'forum' | 'ranking'>('forum');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    // Get all posts grouped by user
    const { data: allPosts } = await supabase
      .from('community_posts')
      .select('user_id, likes_count');

    if (!allPosts) { setLbLoading(false); return; }

    const userMap = new Map<string, { posts: number; likes: number }>();
    for (const p of allPosts) {
      const entry = userMap.get(p.user_id) || { posts: 0, likes: 0 };
      entry.posts += 1;
      entry.likes += p.likes_count;
      userMap.set(p.user_id, entry);
    }

    const userIds = [...userMap.keys()];
    if (userIds.length === 0) { setLeaderboard([]); setLbLoading(false); return; }

    const { data: profiles } = await supabase
      .from('public_profiles' as any)
      .select('id, name, avatar_url')
      .in('id', userIds) as { data: { id: string; name: string; avatar_url: string | null }[] | null };

    const entries: LeaderboardEntry[] = (profiles || []).map(p => {
      const s = userMap.get(p.id) || { posts: 0, likes: 0 };
      const score = s.posts * 10 + s.likes * 5;
      const xp = s.posts * 30 + s.likes * 10;
      const { levelIdx, levelName } = getLevelInfo(xp);
      return {
        id: p.id,
        name: p.name || 'Anônimo',
        avatar_url: p.avatar_url,
        posts: s.posts,
        likes: s.likes,
        score,
        levelName,
        levelIdx,
      };
    }).sort((a, b) => b.score - a.score).slice(0, 20);

    setLeaderboard(entries);
    setLbLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'ranking') fetchLeaderboard();
  }, [tab, fetchLeaderboard]);

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
        .from('public_profiles' as any)
        .select('id, name')
        .in('id', userIds) as { data: { id: string; name: string }[] | null };

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

      const enriched = data.map(p => ({
        ...p,
        author_name: profileMap.get(p.user_id) || 'Anônimo',
        user_liked: likedPostIds.has(p.id),
      }));
      // Show approved posts to everyone; pending/rejected only to author
      setPosts(enriched.filter(p => 
        p.status === 'approved' || p.user_id === user?.id
      ));
    }
    setLoading(false);
  }, [category, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Fuzzy search via pg_trgm + unaccent (debounced)
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    (async () => {
      const { data, error } = await supabase.rpc('search_community_posts_fuzzy', {
        search_query: q,
        result_limit: 50,
      });
      if (cancelled) return;
      if (error) {
        console.error('Community fuzzy search failed:', error);
        setSearchResults(null);
        setIsSearching(false);
        return;
      }
      const rows = (data as Post[]) || [];
      // Enrich with author name + like status (mirrors fetchPosts behaviour)
      const userIds = [...new Set(rows.map(p => p.user_id))];
      let profileMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('public_profiles' as any)
          .select('id, name')
          .in('id', userIds) as { data: { id: string; name: string }[] | null };
        profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
      }
      let likedPostIds = new Set<string>();
      if (user && rows.length) {
        const { data: likes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', rows.map(r => r.id));
        likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      }
      const enriched = rows.map(p => ({
        ...p,
        author_name: profileMap.get(p.user_id) || 'Anônimo',
        user_liked: likedPostIds.has(p.id),
        similarityScore: combinedSimilarity(q, p.title || '', p.content || '', 0.6),
      }));
      if (cancelled) return;
      setSearchResults(enriched);
      setIsSearching(false);
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch, user]);

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
      const { data: profiles } = await supabase.from('public_profiles' as any).select('id, name').in('id', userIds.length ? userIds : ['']) as { data: { id: string; name: string }[] | null };
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
      // Send notification to post author if it's not the same user
      if (selectedPost.user_id !== user.id) {
        const { data: myProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        const authorName = myProfile?.name || 'Alguém';
        await supabase.from('notifications').insert({
          user_id: selectedPost.user_id,
          source_user_id: user.id,
          type: 'reply',
          title: `${authorName} respondeu sua discussão`,
          message: replyContent.trim().substring(0, 100),
          link: AppRoute.COMMUNITY,
        });
      }
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
          <Icons.ChevronLeft className="w-4 h-4" /> Voltar
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

  const MEDAL_COLORS = ['text-secondary', 'text-gray-400', 'text-amber-700'];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Message className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Communitas Fidelium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Comunidade</h1>
        <p className="text-muted-foreground font-serif italic">Discussões, testemunhos e partilhas entre irmãos na fé.</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Todas as publicações são moderadas antes de aparecer para a comunidade</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <button onClick={() => setTab('forum')}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'forum' ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}>
          <Icons.Message className="w-3.5 h-3.5 inline mr-1.5" />Fórum
        </button>
        <button onClick={() => setTab('ranking')}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'ranking' ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}>
          <Icons.Star className="w-3.5 h-3.5 inline mr-1.5" />Ranking
        </button>
      </div>

      {tab === 'ranking' ? (
        /* Leaderboard */
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Ranking da Comunidade</h2>
            <p className="text-[10px] text-muted-foreground mb-6">Pontuação: 10 pts por discussão + 5 pts por curtida recebida</p>

            {!user ? (
              <div className="text-center py-12 space-y-4">
                <Icons.Star className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground font-serif italic">Faça login para ver o ranking da comunidade.</p>
                <button onClick={() => navigate(AppRoute.LOGIN)}
                  className="px-6 py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
                  Acessar o Santuário
                </button>
              </div>
            ) : lbLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground italic py-8">Nenhum participante ainda.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    idx < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50 border border-border'
                  } ${entry.id === user?.id ? 'ring-2 ring-primary' : ''}`}>
                    <div className="w-8 flex justify-center items-center">
                      {idx < 3 ? (
                        <div className={`p-1.5 rounded-full bg-primary/10 ${MEDAL_COLORS[idx]}`}>
                          <Icons.Trophy className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground">#{idx + 1}</span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        entry.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{entry.name}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span className="text-primary font-bold">Nv.{entry.levelIdx + 1} {entry.levelName}</span>
                        <span>{entry.posts} discussões</span>
                        <span>{entry.likes} curtidas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{entry.score}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      <>


      {/* Search bar (fuzzy, debounced) */}
      <div className="max-w-xl mx-auto relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar discussões por título ou conteúdo…"
          className="w-full pl-11 pr-10 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {searchQuery.trim().length >= 2 && (searchQuery !== debouncedSearch || isSearching) && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Buscando…
          </div>
        )}
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
          <div className="flex gap-2 flex-wrap mb-2">
            {[
              { id: 'teologia', label: '📖 Discussão' },
              { id: 'testemunho', label: '✝ Testemunho' },
              { id: 'partilha', label: '💬 Partilha' },
            ].map(t => (
              <button key={t.id} type="button" onClick={() => setNewCategory(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  newCategory === t.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={newCategory === 'testemunho' ? 'Título do testemunho...' : newCategory === 'partilha' ? 'O que deseja partilhar?' : 'Título da discussão...'}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder={newCategory === 'testemunho' ? 'Conte seu testemunho de fé...' : newCategory === 'partilha' ? 'Partilhe sua reflexão ou experiência...' : 'Descreva sua pergunta ou reflexão...'}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex items-center gap-3">
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
              className={`w-full text-left border rounded-2xl p-5 hover:border-primary/30 transition-all group ${
                post.category === 'testemunho' ? 'bg-primary/5 border-primary/20' :
                post.category === 'partilha' ? 'bg-secondary/5 border-secondary/20' :
                'bg-card border-border hover:bg-primary/5'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  post.category === 'testemunho' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'
                }`}>
                  {post.category === 'testemunho' ? '✝' : (post.author_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{post.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                    </span>
                    {post.status === 'pending' && post.user_id === user?.id && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        ⏳ Em moderação
                      </span>
                    )}
                    {post.status === 'rejected' && post.user_id === user?.id && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                        ✕ Rejeitado
                      </span>
                    )}
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
      </>
      )}
    </div>
  );
};

export default CommunityPage;
