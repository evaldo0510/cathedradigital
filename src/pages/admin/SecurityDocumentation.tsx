import React, { useState, useMemo } from 'react';
import ReaderShell from '@/components/reader/ReaderShell';
import EditorialHero from '@/components/editorial/harmony/EditorialHero';
import { ShieldCheck, Lock, History, FileText, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const AUDIT_HISTORY = [
  { id: 1, date: '19/08/2026', event: 'Auditoria de RLS e RBAC', commit: 'a1b2c3d', type: 'CERTIFIED', status: 'Passed' },
  { id: 2, date: '19/08/2026', event: 'Remediação de Write Policies', commit: 'e5f6g7h', type: 'FIXED', status: 'Resolved' },
  { id: 3, date: '18/08/2026', event: 'Scan de Leak de Segredos', commit: 'i9j0k1l', type: 'CERTIFIED', status: 'Passed' },
  { id: 4, date: '17/08/2026', event: 'Auditoria de Acessibilidade (Axe)', commit: 'm2n3o4p', type: 'WARNING', status: 'Attention Required' },
];

const SecurityDocumentation = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredHistory = useMemo(() => {
    return AUDIT_HISTORY.filter(item => {
      const matchesSearch = item.event.toLowerCase().includes(search.toLowerCase()) || 
                           item.commit.toLowerCase().includes(search.toLowerCase()) ||
                           item.date.includes(search);
      const matchesType = filterType === 'ALL' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [search, filterType]);

  return (
    <ReaderShell 
      hero={
        <EditorialHero density="balanced">
          <EditorialHero.Title>Segurança & RLS</EditorialHero.Title>
          <EditorialHero.Subtitle>Auditoria de Políticas e Permissões Supabase</EditorialHero.Subtitle>
          <EditorialHero.Meta>Auditoria 2026-08-19</EditorialHero.Meta>
        </EditorialHero>
      }
    >
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="space-y-4">
          <h2 className="text-2xl font-display text-primary flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-gold-text" />
            Arquitetura de RBAC
          </h2>
          <div className="p-6 bg-accentest border border-gold-text/10 rounded-premium font-reader text-base leading-relaxed text-primary/80">
            A plataforma utiliza um sistema de Role-Based Access Control (RBAC) centralizado na tabela <code className="bg-primary/5 px-1 rounded text-primary">public.user_roles</code>. 
            A função de segurança <code className="bg-primary/5 px-1 rounded text-primary">public.has_role</code> é definida com <code className="font-bold">SECURITY DEFINER</code> para garantir que verificações 
            de privilégios não causem recursão infinita em políticas RLS.
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-primary flex items-center gap-3">
            <Lock className="w-6 h-6 text-gold-text" />
            Políticas de Segurança Ativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gold-text/10 rounded-premium bg-white/50 space-y-3">
              <h3 className="font-display text-lg text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-text" />
                Perfis (Profiles)
              </h3>
              <p className="text-sm text-muted-foreground font-reader leading-relaxed">
                Apenas o dono da conta pode editar seu perfil. Campos sensíveis (role, is_premium) são protegidos por gatilhos de banco de dados 
                que impedem alteração manual via API cliente.
              </p>
            </div>
            <div className="p-6 border border-gold-text/10 rounded-premium bg-white/50 space-y-3">
              <h3 className="font-display text-lg text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-text" />
                Comunidade (Posts)
              </h3>
              <p className="text-sm text-muted-foreground font-reader leading-relaxed">
                Implementado sistema de moderação automática. Edições em posts existentes por usuários não-admin forçam o retorno 
                do status para <span className="font-mono text-xs bg-amber-100 text-amber-800 px-1 rounded">'pending'</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-display text-primary flex items-center gap-3">
              <History className="w-6 h-6 text-gold-text" />
              Histórico de Auditoria
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por evento, commit ou data..." 
                  className="pl-10 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40 text-xs">
                  <Filter className="w-3 h-3 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="CERTIFIED">Certified</SelectItem>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden border border-gold-text/10 rounded-premium bg-white/40 backdrop-blur-sm">
            <table className="w-full text-left text-sm font-reader">
              <thead>
                <tr className="bg-accentest border-b border-gold-text/20 text-muted-foreground uppercase text-[10px] tracking-widest">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Evento / Commit</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-primary/70 divide-y divide-gold-text/5">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{item.event}</span>
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3" />
                            {item.commit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge 
                          variant={item.type === 'WARNING' ? 'destructive' : 'default'}
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            item.type === 'CERTIFIED' && "bg-green-100 text-green-700 border-green-200",
                            item.type === 'FIXED' && "bg-blue-100 text-blue-700 border-blue-200",
                            item.type === 'WARNING' && "bg-amber-100 text-amber-700 border-amber-200"
                          )}
                        >
                          {item.type}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                      Nenhum relatório encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display text-primary flex items-center gap-3">
            <FileText className="w-6 h-6 text-gold-text" />
            Integração CI/CD
          </h2>
          <div className="p-6 border border-dashed border-gold-text/30 rounded-premium bg-accentest/30 space-y-4">
            <p className="text-sm text-primary/70 font-reader">
              O fluxo de automação em <code className="text-xs bg-primary/5 px-1">.github/workflows/security-audit.yml</code> realiza verificações contínuas:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground list-disc pl-4 font-reader">
              <li>Detecção de novas tabelas sem políticas RLS.</li>
              <li>Validação de GRANTs em esquemas públicos.</li>
              <li>Sanitização de funções SECURITY DEFINER.</li>
              <li>Comentários automáticos em PRs com relatórios.</li>
              <li>Alertas críticos via Slack/Email para falhas de RLS.</li>
            </ul>
          </div>
        </section>

        <div className="mt-12 p-8 border-t border-gold-text/10 italic text-sm text-muted-foreground text-center font-reader">
          Relatório gerado automaticamente via Church Context Engine. 
          Consulte o Mission Control para métricas de integridade em tempo real.
        </div>
      </div>
    </ReaderShell>
  );
};

export default SecurityDocumentation;
