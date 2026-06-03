import { Icons } from '@/constants';
import React, { useState, useMemo, useCallback } from 'react';

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
  reflections_count?: number;
  depth_level?: string;
  current_journey?: string;
  access_frequency?: string;
}

interface Props {
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

type Segment = 'all' | 'new' | 'active' | 'engaged' | 'deep' | 'inactive';

const hoursSince = (date: string | null) => {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
};

const AdminCrmSegmentation: React.FC<Props> = ({ users, onSelectUser }) => {
  const [segment, setSegment] = useState<Segment>('all');
  const [sortBy, setSortBy] = useState<'last_visit' | 'xp' | 'created_at'>('last_visit');
  const [sortAsc, setSortAsc] = useState(false);

  const segmentedUsers = useMemo(() => {
    return {
      all: users,
      new: users.filter(u => u.depth_level === 'Novo'),
      active: users.filter(u => u.depth_level === 'Ativo'),
      engaged: users.filter(u => u.depth_level === 'Engajado'),
      deep: users.filter(u => u.depth_level === 'Profundo'),
      inactive: users.filter(u => u.depth_level === 'Inativo'),
    };
  }, [users]);

  const segments: { key: Segment; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'Todos', icon: <Icons.Users className="w-spacing-md h-spacing-md" />, color: 'text-foreground' },
    { key: 'new', label: 'Novo', icon: <Icons.UserCheck className="w-spacing-md h-spacing-md" />, color: 'text-primary' },
    { key: 'active', label: 'Ativo', icon: <Icons.Flame className="w-spacing-md h-spacing-md" />, color: 'text-primary' },
    { key: 'engaged', label: 'Engajado', icon: <Icons.Star className="w-spacing-md h-spacing-md" />, color: 'text-orange-500' },
    { key: 'deep', label: 'Profundo', icon: <Icons.Crown className="w-spacing-md h-spacing-md" />, color: 'text-primary' },
    { key: 'inactive', label: 'Inativo', icon: <Icons.Clock className="w-spacing-md h-spacing-md" />, color: 'text-destructive' },
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
    const status = u.depth_level || 'Inativo';
    switch (status) {
      case 'Profundo': return <Badge variant="default" className="text-premium-xs">Profundo</Badge>;
      case 'Engajado': return <Badge variant="secondary" className="text-premium-xs">Engajado</Badge>;
      case 'Ativo': return <Badge variant="outline" className="border-primary/30 text-primary text-premium-xs">Ativo</Badge>;
      case 'Novo': return <Badge variant="outline" className="border-secondary/30 text-secondary text-premium-xs">Novo</Badge>;
      default: return <Badge variant="destructive" className="text-premium-xs">Inativo</Badge>;
    }
  };

  const exportCsv = useCallback(() => {
    const headers = ['Nome', 'Email', 'Status', 'Plano', 'Streak', 'XP', 'Nível', 'Última Visita', 'Cadastro'];
    const rows = filtered.map(u => {
      const hours = hoursSince(u.last_visit);
      const status = hours <= 48 ? 'Ativo' : 'Inativo';
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
    <div data-test="listagem-1" className="space-y-spacing-md">
      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-spacing-xs">
        {segments.map(s => (
          <Button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`p-spacing-sm rounded-premium-full border text-left transition-all ${
              segment === s.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-border/50 bg-card hover:border-primary/30'
            }`}
          >
            <div className={`flex items-center gap-spacing-2xs ${s.color}`}>
              {s.icon}
              <span className="text-premium-xs font-black uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-premium-xl font-bold mt-spacing-2xs">{segmentedUsers[s.key].length}</p>
          </Button>
        ))}
      </div>

      {/* Icons.User Icons.List */}
      <Card>
        <CardHeader className="pb-spacing-sm">
          <div className="flex items-center justify-between">
            <CardTitle className="text-premium-sm">
              {segments.find(s => s.key === segment)?.label} — {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
            <div className="flex items-center gap-spacing-xs">
              <Button size="sm" variant="outline" className="h-spacing-xl text-premium-xs gap-spacing-2xs" onClick={exportCsv} disabled={filtered.length === 0}>
                <Icons.Download className="w-spacing-sm h-spacing-sm" /> CSV
              </Button>
            <Select data-test="filtro-1" value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
              <SelectTrigger className="w-[120px] h-spacing-xl text-premium-xs">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select data-test="ordenacao-1" value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] h-spacing-xl text-premium-xs">
                <SelectValue placeholder="Ordenar" />
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
        <CardContent className="p-spacing-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-premium-sm">
              <thead className="sticky top-spacing-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="text-left p-spacing-sm font-semibold">Usuário</th>
                  <th className="text-center p-spacing-sm font-semibold">Plano</th>
                  <th className="text-center p-spacing-sm font-semibold">Segmento</th>
                  <th className="text-center p-spacing-sm font-semibold hidden md:table-cell">Reflexões</th>
                  <th className="text-center p-spacing-sm font-semibold hidden lg:table-cell">Jornada</th>
                  <th className="text-center p-spacing-sm font-semibold hidden md:table-cell">Última Ativ.</th>
                  <th className="text-center p-spacing-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="p-spacing-sm">
                      <div className="flex items-center gap-spacing-xs">
                        <div className="w-spacing-xl h-spacing-xl rounded-premium bg-foreground text-background flex items-center justify-center font-black text-premium-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-spacing-0">
                          <p className="font-medium text-premium-sm truncate">{u.name || '—'}</p>
                          <p className="text-premium-small text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-spacing-sm text-center">
                      <Badge variant={u.is_premium ? "default" : "outline"} className="text-premium-xs">
                        {u.is_premium ? 'PRO' : 'Free'}
                      </Badge>
                    </td>
                    <td className="p-spacing-sm text-center">{getStatusBadge(u)}</td>
                    <td className="p-spacing-sm text-center hidden md:table-cell">
                      <span className="text-premium-xs font-medium">{u.reflections_count || 0}</span>
                    </td>
                    <td className="p-spacing-sm text-center hidden lg:table-cell">
                      <span className="text-premium-xs text-muted-foreground truncate w-full block mx-auto">
                        {u.current_journey || 'Nenhuma'}
                      </span>
                    </td>
                    <td className="p-spacing-sm text-center hidden md:table-cell text-premium-xs text-muted-foreground">
                      {u.last_visit ? (hoursSince(u.last_visit) < 24 ? 'Hoje' : `${Math.floor(hoursSince(u.last_visit) / 24)}d atrás`) : '—'}
                    </td>
                    <td className="p-spacing-sm text-center">
                      <Button size="sm" variant="ghost" className="h-spacing-lg px-spacing-xs text-premium-xs gap-spacing-2xs" onClick={() => onSelectUser(u)}>
                        <Icons.Eye className="w-spacing-sm h-spacing-sm" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} data-test="estado-vazio-1" className="p-spacing-xl text-center text-muted-foreground">Nenhum usuário neste segmento.</td></tr>
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
