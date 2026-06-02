import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLevelInfo } from '@/lib/levels';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { RelevanceBadge } from './RelevanceBadge';
import { FuzzySearchInput } from './FuzzySearchInput';
import { ListSkeleton, PageHeaderSkeleton } from './SacredSkeleton';
import { getTabProps, getTabPanelProps, useTabNavigation } from './TabUtils';
import ContemplativeLayout from './ContemplativeLayout';

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
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
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

  // Shared hook handles debounce (300ms) + RPC + similarityScore decoration.
  const {
    results: rawSearchResults,
    isPending: isSearchPending,
  } = useFuzzySearch<Post>({
    rpc: 'search_community_posts_fuzzy',
    query: searchQuery,
    primaryField: 'title',
    secondaryField: 'content',
    secondaryWeight: 0.6,
  });

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
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
      const xp = s.posts * 30 + s.likes * 10 + s.likes * 5;
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
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('id, name')
        .in('id', userIds) as { data: { id: string; name: string }[] | null };

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

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
      setPosts(enriched.filter(p => 
        p.status === 'approved' || p.user_id === user?.id
      ));
    }
    setLoading(false);
  }, [category, user, tab]);


  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (rawSearchResults === null) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = rawSearchResults;
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
      if (cancelled) return;
      setSearchResults(
        rows.map(p => ({
          ...p,
          author_name: profileMap.get(p.user_id) || 'Anônimo',
          user_liked: likedPostIds.has(p.id),
        })),
      );
    })();
    return () => { cancelled = true; };
  }, [rawSearchResults, user]);

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

  const toggleLike = async (post: Post) => {
    if (!user) { navigate(AppRoute.LOGIN); return; }
    if (post.user_liked) {
      await supabase.from('community_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('community_likes').insert({ post_id: post.id, user_id: user.id });
    }
    fetchPosts();
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

  if (selectedPost) {
    return (
      <div className="w-full space-y-spacing-lg py-spacing-xl px-spacing-md">
        <Button 
          onClick={() => { setSelectedPost(null); setReplies([]); }} 
          className="flex items-center gap-spacing-xs text-premium-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none rounded-premium-full px-spacing-xs py-spacing-2xs"
          aria-label="Voltar para a lista de discussões"
        >
          <Icons.ChevronLeft className="w-spacing-md h-spacing-md" /> Voltar
        </Button>

        <div className="bg-card border border-border rounded-premium p-spacing-lg space-y-spacing-md">
          <div className="flex items-center gap-spacing-sm">
            <div className="w-spacing-xl h-spacing-xl rounded-premium bg-foreground text-background flex items-center justify-center font-black text-premium-sm">
              {(selectedPost.author_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-premium-sm font-bold text-foreground">{selectedPost.author_name}</p>
              <p className="text-premium-xs text-muted-foreground">{timeAgo(selectedPost.created_at)}</p>
            </div>
            <span className="ml-auto text-premium-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-spacing-xs py-spacing-2xs rounded-premium-full">
              {CATEGORIES.find(c => c.id === selectedPost.category)?.label || selectedPost.category}
            </span>
          </div>
          <h2 className="text-premium-xl font-serif font-bold text-foreground">{selectedPost.title}</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
          <div className="flex items-center gap-spacing-md pt-spacing-xs border-t border-border">
            <Button 
              onClick={() => toggleLike(selectedPost)} 
              className="flex items-center gap-spacing-2xs text-premium-sm text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none rounded-premium-full px-spacing-xs py-spacing-2xs"
              aria-label={selectedPost.user_liked ? "Remover curtida" : "Curtir discussão"}
              aria-pressed={selectedPost.user_liked}
            >
              <Icons.Heart className={`w-spacing-md h-spacing-md ${selectedPost.user_liked ? 'fill-primary text-primary' : ''}`} />
              {selectedPost.likes_count}
            </Button>
            <span className="text-premium-sm text-muted-foreground">{replies.length} respostas</span>
          </div>
        </div>

        <div className="space-y-spacing-sm">
          {replies.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-premium p-spacing-md ml-spacing-lg">
              <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                <div className="w-spacing-lg h-spacing-lg rounded-premium bg-muted flex items-center justify-center text-premium-xs font-bold text-foreground">
                  {(r.author_name || 'A').charAt(0).toUpperCase()}
                </div>
                <span className="text-premium-xs font-bold text-foreground">{r.author_name}</span>
                <span className="text-premium-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-premium-sm text-foreground/80 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>

        {user ? (
          <div className="bg-card border border-border rounded-premium p-spacing-md space-y-spacing-sm">
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              rows={3}
              className="w-full bg-background border border-border rounded-premium-full p-spacing-sm text-premium-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button onClick={submitReply} disabled={submitting || !replyContent.trim()}
              className="px-spacing-md py-spacing-xs rounded-premium-full bg-foreground text-background text-premium-xs font-black uppercase tracking-widest disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-all">
              {submitting ? 'Enviando...' : 'Responder'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate(AppRoute.LOGIN)} className="w-full py-spacing-sm bg-foreground text-background rounded-premium-full text-premium-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all">
            Faça login para responder
          </Button>
        )}
      </div>
    );
  }

  return (
    <ContemplativeLayout>
      <div className="desktop-main px-spacing-md">
        {loading && posts.length === 0 ? (
          <div className="space-y-spacing-xl">
            <PageHeaderSkeleton />
            <ListSkeleton count={6} />
          </div>
        ) : (
          <>
            <div className="text-center space-y-spacing-md pt-spacing-md mb-spacing-xl">
              <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 rounded-premium border border-primary/10 shadow-premium-md mb-spacing-xs">
                <Icons.Message className="w-spacing-md h-spacing-md text-primary" aria-hidden="true" />
                <span className="text-premium-small font-black uppercase tracking-[0.3em] text-primary">Communitas Fidelium</span>
              </div>
              <h1 className="text-premium-4xl md:text-premium-7xl font-black tracking-tighter text-foreground bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-[0.9]">Comunidade</h1>
              <p className="text-muted-foreground font-serif italic max-w-spacing-2xl mx-auto text-premium-base sm:text-premium-xl leading-relaxed">Discussões, testemunhos e partilhas entre irmãos na fé.</p>
              <p className="text-premium-xs text-muted-foreground uppercase tracking-widest opacity-60">Conteúdo moderado para edificação mútua</p>
            </div>
          </>
        )}

        <div className="flex gap-spacing-xs justify-center mb-spacing-xl" role="tablist" aria-label="Abas da comunidade">
          <Button 
            {...getTabProps('tab-0', 'panel-forum', tab === 'forum', `px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
              tab === 'forum' ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`)}
            onClick={() => setTab('forum')}
            onKeyDown={(e) => handleTabKeyDown(e, 0, 2, (idx) => setTab(idx === 0 ? 'forum' : 'ranking'), 'tab-')}
          >
            <Icons.Message className="w-spacing-sm h-spacing-sm inline mr-spacing-2xs" />Fórum
          </Button>
          <Button 
            {...getTabProps('tab-1', 'panel-ranking', tab === 'ranking', `px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
              tab === 'ranking' ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`)}
            onClick={() => setTab('ranking')}
            onKeyDown={(e) => handleTabKeyDown(e, 1, 2, (idx) => setTab(idx === 0 ? 'forum' : 'ranking'), 'tab-')}
          >
            <Icons.Star className="w-spacing-sm h-spacing-sm inline mr-spacing-2xs" />Ranking
          </Button>
        </div>

        {tab === 'forum' ? (
          <div className="space-y-spacing-lg" {...getTabPanelProps('panel-forum', 'tab-0', true)}>
            <div className="flex flex-col sm:flex-row gap-spacing-md mb-spacing-lg">
              <FuzzySearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar discussões..."
                isSearching={isSearchPending}
                className="flex-1"
              />
              <Button onClick={() => setShowNewPost(true)} className="rounded-premium-full h-spacing-2xl px-spacing-lg font-black uppercase tracking-widest gap-spacing-xs bg-primary shadow-premium shadow-primary/20">
                <Icons.Plus className="w-spacing-md h-spacing-md" /> Nova Discussão
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-spacing-md">
              {posts.map(post => (
                <Card key={post.id} className="premium-card-interactive" onClick={() => openPost(post)}>
                  <CardContent className="p-spacing-lg">
                    <div className="flex items-center gap-spacing-sm mb-spacing-md">
                      <div className="w-spacing-xl h-spacing-xl rounded-premium bg-muted flex items-center justify-center font-black text-premium-sm text-primary">
                        {(post.author_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-premium-sm font-bold text-foreground">{post.author_name}</p>
                        <p className="text-premium-xs text-muted-foreground uppercase tracking-widest">{timeAgo(post.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="text-premium-xs font-black uppercase tracking-widest border-primary/20 text-primary/70">
                        {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                      </Badge>
                    </div>
                    <h3 className="text-premium-lg font-bold text-foreground group-hover:text-primary transition-colors mb-spacing-xs">{post.title}</h3>
                    <p className="text-premium-sm text-muted-foreground line-clamp-spacing-xs italic mb-spacing-md">{post.content}</p>
                    <div className="flex items-center gap-spacing-md pt-spacing-md border-t border-border/40">
                      <div className="flex items-center gap-spacing-2xs text-premium-xs font-bold text-muted-foreground">
                        <Icons.Heart className="w-spacing-sm h-spacing-sm" /> {post.likes_count}
                      </div>
                      <div className="flex items-center gap-spacing-2xs text-premium-xs font-bold text-muted-foreground">
                        <Icons.MessageSquare className="w-spacing-sm h-spacing-sm" /> {post.replies_count || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-spacing-md" {...getTabPanelProps('panel-ranking', 'tab-1', true)}>
            {lbLoading ? <ListSkeleton count={5} /> : (
              <div className="grid grid-cols-1 gap-spacing-sm">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.id} className="flex items-center gap-spacing-md p-spacing-md bg-card border border-border/50 rounded-[2rem]">
                    <div className="w-spacing-xl h-spacing-xl rounded-premium bg-muted flex items-center justify-center font-black text-premium-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-spacing-0">
                      <p className="text-premium-sm font-bold text-foreground truncate">{entry.name}</p>
                      <p className="text-premium-xs text-muted-foreground uppercase tracking-widest">{entry.levelName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-premium-sm font-black text-primary">{entry.score}</p>
                      <p className="text-premium-xs font-black uppercase text-muted-foreground">Pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ContemplativeLayout>
  );
};

export default CommunityPage;
