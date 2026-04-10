import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Crown, Shield, Flame, Calendar, Mail, Star,
  BookOpen, MessageCircle, Route, Brain, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string | null;
  is_premium: boolean;
  created_at: string;
  xp: number | null;
  level: number | null;
  streak: number | null;
  last_visit: string | null;
  reflections_count?: number;
  depth_level?: string;
  current_journey?: string;
  access_frequency?: string;
}

interface Props {
  user: UserProfile;
  onBack: () => void;
}

const daysSince = (date: string | null) => {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const AdminCrmUserProfile: React.FC<Props> = ({ user, onBack }) => {
  const [journeyProgress, setJourneyProgress] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [chaptersRead, setChaptersRead] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [communityPosts, setCommunityPosts] = useState(0);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const [jpRes, sjRes, bcRes, unRes, cpRes, sdRes] = await Promise.all([
        supabase.from('journey_progress').select('*, journeys(title)').eq('user_id', user.id).order('completed_at', { ascending: false }),
        supabase.from('spiritual_journal').select('id, mood, entry_date, content').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(5),
        supabase.from('bible_chapters_read').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_notes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('community_posts').select('id', { count: 'exact' }).eq('user_id', user.id),
        (supabase as any).from('user_sensitive_data').select('diagnosis_result').eq('user_id', user.id).maybeSingle(),
      ]);

      setJourneyProgress(jpRes.data || []);
      setJournalEntries(sjRes.data || []);
      setChaptersRead(bcRes.count ?? bcRes.data?.length ?? 0);
      setNotesCount(unRes.count ?? unRes.data?.length ?? 0);
      setCommunityPosts(cpRes.count ?? cpRes.data?.length ?? 0);
      setDiagnosis(sdRes.data?.diagnosis_result);
      setLoading(false);
    };
    fetchUserData();
  }, [user.id]);

  const handleTogglePremium = async () => {
    const { error } = await supabase.from('profiles').update({ is_premium: !user.is_premium }).eq('id', user.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success(user.is_premium ? 'PRO removido' : 'PRO ativado');
    // Parent needs to refresh
  };

  const statusDays = daysSince(user.last_visit);
  const isAbandoned = statusDays > 7;
  const statusLabel = isAbandoned ? 'Abandono' : statusDays <= 3 ? 'Ativo' : 'Em Risco';
  const statusColor = isAbandoned ? 'text-destructive' : statusDays <= 3 ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-2xl shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{user.name || 'Sem nome'}</h2>
                {user.is_premium && <Badge className="bg-primary/15 text-primary border-primary/30 gap-1"><Crown className="w-3 h-3" /> PRO</Badge>}
                {user.role === 'admin' && <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><Shield className="w-3 h-3" /> Admin</Badge>}
                <Badge variant="outline" className={`${statusColor} border-current/30 text-[10px]`}>{statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Última atividade: {user.last_visit ? `${statusDays}d atrás` : 'Nunca'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={user.is_premium ? 'outline' : 'default'} onClick={handleTogglePremium} className="gap-1.5 text-xs">
                <Crown className="w-3.5 h-3.5" /> {user.is_premium ? 'Remover PRO' : 'Ativar PRO'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Star className="w-4 h-4 text-primary" />, label: 'Nível', value: user.level ?? 1 },
          { icon: <MessageCircle className="w-4 h-4 text-purple-500" />, label: 'Reflexões', value: user.reflections_count || 0 },
          { icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Freq. Acesso', value: `${user.streak ?? 0}d` },
          { icon: <Brain className="w-4 h-4 text-emerald-500" />, label: 'Profundidade', value: user.depth_level || 'Iniciante' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              {stat.icon}
              <div>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> Diagnóstico Espiritual</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnosis ? (
              <div className="space-y-2 text-sm">
                {typeof diagnosis === 'object' && Object.entries(diagnosis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">Nenhum diagnóstico realizado.</p>
            )}
          </CardContent>
        </Card>

        {/* Journey Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Route className="w-4 h-4 text-primary" /> Jornadas ({journeyProgress.length} etapas)</CardTitle>
          </CardHeader>
          <CardContent>
            {journeyProgress.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {journeyProgress.slice(0, 10).map((jp: any) => (
                  <div key={jp.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0 text-sm">
                    <span className="truncate">{(jp.journeys as any)?.title ?? jp.journey_id.slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(jp.completed_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma jornada iniciada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      {journalEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Últimas Reflexões do Diário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {journalEntries.map((entry: any) => (
              <div key={entry.id} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{entry.entry_date}</span>
                  {entry.mood && <Badge variant="secondary" className="text-[10px]">{entry.mood}</Badge>}
                </div>
                <p className="text-sm line-clamp-2">{entry.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCrmUserProfile;
