import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Crown, AlertTriangle, Flame, UserCheck, Clock, Star,
  Filter, ChevronDown, ChevronUp, Eye, Download, Search
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
    { key: 'all', label: 'Todos', icon: <Users className="w-md h-md" />, color: 'text-foreground' },
    { key: 'new', label: 'Novo', icon: <UserCheck className="w-md h-md" />, color: 'text-primary' },
    { key: 'active', label: 'Ativo', icon: <Flame className="w-md h-md" />, color: 'text-primary' },
    { key: 'engaged', label: 'Engajado', icon: <Star className="w-md h-md" />, color: 'text-orange-500' },
    { key: 'deep', label: 'Profundo', icon: <Crown className="w-md h-md" />, color: 'text-primary' },
    { key: 'inactive', label: 'Inativo', icon: <Clock className="w-md h-md" />, color: 'text-destructive' },
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
      case 'Profundo': return <Badge variant="default" className="text-xs">Profundo</Badge>;
      case 'Engajado': return <Badge variant="secondary" className="text-xs">Engajado</Badge>;
      case 'Ativo': return <Badge variant="outline" className="border-primary/30 text-primary text-xs">Ativo</Badge>;
      case 'Novo': return <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">Novo</Badge>;
      default: return <Badge variant="destructive" className="text-xs">Inativo</Badge>;
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
    <div className="space-y-md">
      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-xs">
        {segments.map(s => (
          <Button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={`p-sm rounded-full border text-left transition-all ${
              segment === s.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-border/50 bg-card hover:border-primary/30'
            }`}
          >
            <div className={`flex items-center gap-2xs ${s.color}`}>
              {s.icon}
              <span className="text-xs font-black uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-xl font-bold mt-2xs">{segmentedUsers[s.key].length}</p>
          </Button>
        ))}
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="pb-sm">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {segments.find(s => s.key === segment)?.label} — {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
            <div className="flex items-center gap-xs">
              <Button size="sm" variant="outline" className="h-xl text-xs gap-2xs" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="w-sm h-sm" /> CSV
              </Button>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px] h-xl text-xs">
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
                  <th className="text-left p-sm font-semibold">Usuário</th>
                  <th className="text-center p-sm font-semibold">Plano</th>
                  <th className="text-center p-sm font-semibold">Segmento</th>
                  <th className="text-center p-sm font-semibold hidden md:table-cell">Reflexões</th>
                  <th className="text-center p-sm font-semibold hidden lg:table-cell">Jornada</th>
                  <th className="text-center p-sm font-semibold hidden md:table-cell">Última Ativ.</th>
                  <th className="text-center p-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="p-sm">
                      <div className="flex items-center gap-xs">
                        <div className="w-xl h-xl rounded-premium bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.name || '—'}</p>
                          <p className="text-premium-small text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-sm text-center">
                      <Badge variant={u.is_premium ? "default" : "outline"} className="text-xs">
                        {u.is_premium ? 'PRO' : 'Free'}
                      </Badge>
                    </td>
                    <td className="p-sm text-center">{getStatusBadge(u)}</td>
                    <td className="p-sm text-center hidden md:table-cell">
                      <span className="text-xs font-medium">{u.reflections_count || 0}</span>
                    </td>
                    <td className="p-sm text-center hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] block mx-auto">
                        {u.current_journey || 'Nenhuma'}
                      </span>
                    </td>
                    <td className="p-sm text-center hidden md:table-cell text-xs text-muted-foreground">
                      {u.last_visit ? (hoursSince(u.last_visit) < 24 ? 'Hoje' : `${Math.floor(hoursSince(u.last_visit) / 24)}d atrás`) : '—'}
                    </td>
                    <td className="p-sm text-center">
                      <Button size="sm" variant="ghost" className="h-lg px-xs text-xs gap-2xs" onClick={() => onSelectUser(u)}>
                        <Eye className="w-sm h-sm" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-xl text-center text-muted-foreground">Nenhum usuário neste segmento.</td></tr>
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
