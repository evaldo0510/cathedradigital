import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';

const SyncSummaryPanel: React.FC = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['catechism-sync-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Stats for last 24h
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Stats for last 7 days
      const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [res24h, res7d, resFailed] = await Promise.all([
        supabase
          .from('catechism_paragraphs_read')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('read_at', last24h),
        supabase
          .from('catechism_paragraphs_read')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('read_at', last7d),
        supabase
          .from('catechism_cache')
          .select('paragraph', { count: 'exact', head: true })
          .or('status.eq.error,status.eq.error_402,status.eq.incomplete')
      ]);

      return {
        count24h: res24h.count || 0,
        count7d: res7d.count || 0,
        countFailed: resFailed.count || 0,
      };
    },
    enabled: !!user,
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4 bg-primary/5 border-primary/10 flex items-center gap-4 rounded-2xl">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icons.Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.count24h}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Últimas 24 Horas</div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 bg-primary/5 border-primary/10 flex items-center gap-4 rounded-2xl">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icons.History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.count7d}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Últimos 7 Dias</div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`p-4 ${stats.countFailed > 0 ? 'bg-destructive/5 border-destructive/10' : 'bg-green-500/5 border-green-500/10'} flex items-center gap-4 rounded-2xl`}>
          <div className={`p-3 ${stats.countFailed > 0 ? 'bg-destructive/10' : 'bg-green-500/10'} rounded-xl`}>
            {stats.countFailed > 0 ? (
              <Icons.AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <Icons.Check className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold ${stats.countFailed > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {stats.countFailed}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Parágrafos com Falha</div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SyncSummaryPanel;
