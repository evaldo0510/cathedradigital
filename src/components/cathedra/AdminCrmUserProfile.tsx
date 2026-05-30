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

const hoursSince = (date: string | null) => {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
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

  const statusHours = hoursSince(user.last_visit);
  const isInactive = statusHours >= 48;
  const isDeep = (user.reflections_count || 0) > 10;
  const isNew = (user.reflections_count || 0) <= 1;

  const statusLabel = isInactive ? 'Inativo' : isDeep ? 'Profundo' : isNew ? 'Novo' : 'Ativo';
  const statusColor = isInactive ? 'text-destructive' : isDeep ? 'text-primary' : isNew ? 'text-primary' : 'text-primary';

  return (
    <div className="space-y-spacing-lg">
      {/* Header */}
      <div className="flex items-center gap-spacing-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-spacing-2xs">
          <ArrowLeft className="w-spacing-md h-spacing-md" /> Voltar
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-spacing-lg">
          <div className="flex flex-col sm:flex-row items-start gap-spacing-md">
            <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-foreground text-background flex items-center justify-center font-black text-2xl shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0 space-y-spacing-xs">
              <div className="flex items-center gap-spacing-xs flex-wrap">
                <h2 className="text-xl font-bold">{user.name || 'Sem nome'}</h2>
                {user.is_premium && <Badge className="bg-primary/15 text-primary border-primary/30 gap-spacing-2xs"><Crown className="w-spacing-sm h-spacing-sm" /> PRO</Badge>}
                {user.role === 'admin' && <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-spacing-2xs"><Shield className="w-spacing-sm h-spacing-sm" /> Admin</Badge>}
                <Badge variant="outline" className={`${statusColor} border-current/30 text-xs`}>{statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-spacing-2xs"><Mail className="w-spacing-sm h-spacing-sm" /> {user.email}</span>
                <span className="flex items-center gap-spacing-2xs"><Calendar className="w-spacing-sm h-spacing-sm" /> Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="flex items-center gap-spacing-2xs"><Clock className="w-spacing-sm h-spacing-sm" /> Última atividade: {user.last_visit ? (statusHours < 24 ? 'Hoje' : `${Math.floor(statusHours/24)}d atrás`) : 'Nunca'}</span>
              </div>
            </div>
            <div className="flex gap-spacing-xs">
              <Button size="sm" variant={user.is_premium ? 'outline' : 'default'} onClick={handleTogglePremium} className="gap-spacing-2xs text-xs">
                <Crown className="w-spacing-sm h-spacing-sm" /> {user.is_premium ? 'Remover PRO' : 'Ativar PRO'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-spacing-sm">
        {[
          { icon: <Star className="w-spacing-md h-spacing-md text-primary" />, label: 'Nível', value: user.level ?? 1 },
          { icon: <MessageCircle className="w-spacing-md h-spacing-md text-primary" />, label: 'Reflexões', value: user.reflections_count || 0 },
          { icon: <Flame className="w-spacing-md h-spacing-md text-secondary" />, label: 'Freq. Acesso', value: `${user.streak ?? 0}d` },
          { icon: <Brain className="w-spacing-md h-spacing-md text-primary" />, label: 'Profundidade', value: user.depth_level || 'Iniciante' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-spacing-md pb-spacing-sm px-spacing-md flex items-center gap-spacing-sm">
              {stat.icon}
              <div>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-lg">
        {/* Diagnosis */}
        <Card>
          <CardHeader className="pb-spacing-sm">
            <CardTitle className="text-sm flex items-center gap-spacing-xs"><Brain className="w-spacing-md h-spacing-md text-primary" /> Diagnóstico Espiritual</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnosis ? (
              <div className="space-y-spacing-xs text-sm">
                {typeof diagnosis === 'object' && Object.entries(diagnosis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-spacing-2xs border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-spacing-md text-center">Nenhum diagnóstico realizado.</p>
            )}
          </CardContent>
        </Card>

        {/* Journey Progress */}
        <Card>
          <CardHeader className="pb-spacing-sm">
            <CardTitle className="text-sm flex items-center gap-spacing-xs"><Route className="w-spacing-md h-spacing-md text-primary" /> Jornadas ({journeyProgress.length} etapas)</CardTitle>
          </CardHeader>
          <CardContent>
            {journeyProgress.length > 0 ? (
              <div className="space-y-spacing-xs max-h-[200px] overflow-y-auto">
                {journeyProgress.slice(0, 10).map((jp: any) => (
                  <div key={jp.id} className="flex justify-between items-center py-spacing-2xs border-b border-border/30 last:border-0 text-sm">
                    <span className="truncate">{(jp.journeys as any)?.title ?? jp.journey_id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(jp.completed_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-spacing-md text-center">Nenhuma jornada iniciada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      {journalEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-spacing-sm">
            <CardTitle className="text-sm">Últimas Reflexões do Diário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-spacing-sm">
            {journalEntries.map((entry: any) => (
              <div key={entry.id} className="p-spacing-sm rounded-premium bg-muted/30 border border-border/30">
                <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
                  <span className="text-xs text-muted-foreground">{entry.entry_date}</span>
                  {entry.mood && <Badge variant="secondary" className="text-xs">{entry.mood}</Badge>}
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
