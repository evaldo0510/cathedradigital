import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Clock, 
  Search,
  Check,
  X,
  MessageSquare,
  User,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Post {
  id: string;
  title: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  category: string | null;
  profiles?: {
    name: string | null;
  };
}

const CatechismDebug = React.lazy(() => import('./CatechismDebug'));

const AdminContentTab: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data as any[] || []);
    } catch (error: any) {
      toast.error('Erro ao buscar conteúdos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success(`Conteúdo ${newStatus === 'approved' ? 'aprovado' : newStatus === 'rejected' ? 'rejeitado' : 'marcado como pendente'} com sucesso.`);
    } catch (error: any) {
      toast.error('Erro ao atualizar conteúdo: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Conteúdo excluído com sucesso.');
    } catch (error: any) {
      toast.error('Erro ao excluir conteúdo: ' + error.message);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-spacing-2xs"><CheckCircle2 className="w-spacing-sm h-spacing-sm" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-spacing-2xs"><XCircle className="w-spacing-sm h-spacing-sm" /> Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-spacing-2xs bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-spacing-sm h-spacing-sm" /> Pendente</Badge>;
    }
  };

  const filteredPosts = posts.filter(p => 
    (p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeTab === 'all' || p.status === activeTab)
  );

  const pendingCount = posts.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-spacing-md">
        {[1, 2, 3].map(i => (
          <Card key={i} className="h-spacing-4xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-spacing-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-spacing-md">
        <div>
          <h2 className="text-xl font-bold">Gestão de Conteúdo</h2>
          <p className="text-sm text-muted-foreground">Modere postagens da comunidade.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-spacing-xs top-spacing-xs h-spacing-md w-spacing-md text-muted-foreground" />
          <Input
            placeholder="Buscar conteúdo ou autor..."
            className="pl-spacing-xl w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-spacing-lg">
        <TabsList>
          <TabsTrigger value="pending" className="gap-spacing-xs">
            Pendentes
            {pendingCount > 0 && (
              <span className="bg-primary text-primary-foreground px-spacing-2xs py-spacing-3xs rounded-full text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="catechism">Depuração CIC</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-spacing-md">
          {filteredPosts.length === 0 ? (
            <Card className="border-dashed border-2 py-spacing-2xl text-center">
              <MessageSquare className="w-spacing-2xl h-spacing-2xl text-muted-foreground mx-auto mb-spacing-md opacity-20" />
              <p className="font-medium">Nenhum conteúdo encontrado</p>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden shadow-none border-border/40">
                <CardHeader className="flex flex-row items-center justify-between pb-spacing-2xs pt-spacing-sm px-spacing-sm">
                  <div className="flex items-center gap-spacing-xs">
                    <User className="w-spacing-sm h-spacing-sm text-muted-foreground" />
                    <span className="text-xs font-bold">{post.profiles?.name || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                    {post.category && <Badge variant="outline" className="text-xs uppercase h-spacing-md px-spacing-2xs">{post.category}</Badge>}
                  </div>
                  <div className="scale-90 origin-right">
                    {getStatusBadge(post.status)}
                  </div>
                </CardHeader>
                <CardContent className="px-spacing-sm pb-spacing-xs pt-spacing-2xs">
                  {post.title && <h3 className="text-sm font-bold mb-spacing-3xs">{post.title}</h3>}
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{post.content}</p>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/10 py-spacing-2xs px-spacing-sm flex justify-end gap-spacing-2xs">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-destructive h-spacing-lg text-xs font-bold uppercase tracking-widest px-spacing-xs">
                    <Trash2 className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Excluir
                  </Button>
                  {post.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(post.id, 'rejected')} className="h-spacing-lg text-xs font-bold uppercase tracking-widest px-spacing-xs">
                        <X className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Rejeitar
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(post.id, 'approved')} className="h-spacing-lg text-xs font-bold uppercase tracking-widest px-spacing-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Aprovar
                      </Button>
                    </>
                  )}
                  {post.status !== 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(post.id, 'pending')}>
                      Voltar para Pendente
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="catechism" className="space-y-spacing-md">
          <React.Suspense fallback={<Card className="h-spacing-4xl animate-pulse" />}>
            <CatechismDebug />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContentTab;
