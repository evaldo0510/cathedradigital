import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Crown, AlertTriangle, Flame, UserCheck, Clock,
  Filter, ChevronDown, ChevronUp, Eye, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}

interface Props {
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

type Segment = 'all' | 'active' | 'at_risk' | 'churned' | 'new' | 'premium' | 'free';

const daysSince = (date: string | null) => {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const AdminCrmSegmentation: React.FC<Props> = ({ users, onSelectUser }) => {
  const [segment, setSegment] = useState<Segment>('all');
  const [sortBy, setSortBy] = useState<'last_visit' | 'xp' | 'created_at'>('last_visit');
  const [sortAsc, setSortAsc] = useState(false);

  const segmentedUsers = useMemo(() => {
    const now = Date.now();
    return {
      all: users,
      active: users.filter(u => daysSince(u.last_visit) <= 3),
      at_risk: users.filter(u => daysSince(u.last_visit) >= 4 && daysSince(u.last_visit) <= 14),
      churned: users.filter(u => daysSince(u.last_visit) > 14),
      new: users.filter(u => daysSince(u.created_at) <= 7),
      premium: users.filter(u => u.is_premium),
      free: users.filter(u => !u.is_premium),
    };
  }, [users]);

  const segments: { key: Segment; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'Todos', icon: <Users className="w-4 h-4" />, color: 'text-foreground' },
    { key: 'active', label: 'Ativos', icon: <Flame className="w-4 h-4" />, color: 'text-emerald-500' },
    { key: 'at_risk', label: 'Em Risco', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-500' },
    { key: 'churned', label: 'Inativos', icon: <Clock className="w-4 h-4" />, color: 'text-destructive' },
    { key: 'new', label: 'Novos (7d)', icon: <UserCheck className="w-4 h-4" />, color: 'text-blue-500' },
    { key: 'premium', label: 'PRO', icon: <Crown className="w-4 h-4" />, color: 'text-primary' },
    { key: 'free', label: 'Gratuitos', icon: <Users className="w-4 h-4" />, color: 'text-muted-foreground' },
  ];

  const filtered = segmentedUsers[segment]
    .sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      const cmp = String(valA).localeCompare(String(valB), 'pt', { numeric: true });
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(false); }
  };

  const getStatusBadge = (u: UserProfile) => {
    const days = daysSince(u.last_visit);
    if (days <= 3) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Ativo</Badge>;
    if (days <= 14) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Em risco</Badge>;
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">Inativo</Badge>;
  };

  const exportCsv = useCallback(() => {
    const headers = ['Nome', 'Email', 'Status', 'Plano', 'Streak', 'XP', 'Nível', 'Última Visita', 'Cadastro'];
    const rows = filtered.map(u => {
      const days = daysSince(u.last_visit);
      const status = days <= 3 ? 'Ativo' : days <= 14 ? 'Em risco' : 'Inativo';
      return [
        u.name || '', u.email, status, u.is_premium ? 'PRO' : 'Free',
        u.streak ?? 0, u.xp ?? 0, u.level ?? 1,
        u.last_visit ? new Date(u.last_visit).toLocaleDateString('pt-BR') : '—',
        new Date(u.created_at).toLocaleDateString('pt-BR'),
      ].map(v => `"${v}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segmentacao_${segment}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} usuários exportados.`);
  }, [filtered, segment]);

  return (
    <div className="space-y-4">
      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {segments.map(s => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              segment === s.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-border/50 bg-card hover:border-primary/30'
            }`}
          >
            <div className={`flex items-center gap-1.5 ${s.color}`}>
              {s.icon}
              <span className="text-[10px] font-black uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-xl font-bold mt-1">{segmentedUsers[s.key].length}</p>
          </button>
        ))}
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {segments.find(s => s.key === segment)?.label} — {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_visit">Última visita</SelectItem>
                <SelectItem value="xp">XP</SelectItem>
                <SelectItem value="created_at">Cadastro</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Usuário</th>
                  <th className="text-center p-3 font-semibold hidden sm:table-cell">Status</th>
                  <th className="text-center p-3 font-semibold hidden md:table-cell">Plano</th>
                  <th className="text-center p-3 font-semibold hidden lg:table-cell">Streak</th>
                  <th className="text-center p-3 font-semibold hidden lg:table-cell">XP</th>
                  <th className="text-center p-3 font-semibold hidden md:table-cell">Última Visita</th>
                  <th className="text-center p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">{getStatusBadge(u)}</td>
                    <td className="p-3 text-center hidden md:table-cell">
                      {u.is_premium ? (
                        <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] gap-1"><Crown className="w-3 h-3" /> PRO</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Free</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      <span className="flex items-center justify-center gap-1 text-xs">
                        <Flame className="w-3 h-3 text-orange-500" /> {u.streak ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-center hidden lg:table-cell font-mono text-xs">{u.xp ?? 0}</td>
                    <td className="p-3 text-center hidden md:table-cell text-xs text-muted-foreground">
                      {u.last_visit ? `${daysSince(u.last_visit)}d atrás` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => onSelectUser(u)}>
                        <Eye className="w-3 h-3" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum usuário neste segmento.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCrmSegmentation;
