import React from 'react';
import ReaderShell from '@/components/reader/ReaderShell';
import EditorialHero from '@/components/editorial/harmony/EditorialHero';
import { ShieldCheck, Lock, History, FileText } from 'lucide-react';

const SecurityDocumentation = () => {
  return (
    <ReaderShell 
      hero={
        <EditorialHero
          title="Segurança & RLS"
          subtitle="Auditoria de Políticas e Permissões Supabase"
          sacraLabel="Auditoria 2026-08-19"
          variant="sacra"
        />
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
          <h2 className="text-2xl font-display text-primary flex items-center gap-3">
            <History className="w-6 h-6 text-gold-text" />
            Histórico de Auditoria
          </h2>
          <div className="overflow-hidden border border-gold-text/10 rounded-premium">
            <table className="w-full text-left text-sm font-reader">
              <thead>
                <tr className="bg-accentest border-b border-gold-text/20 text-muted-foreground uppercase text-[10px] tracking-widest">
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Evento</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-primary/70 divide-y divide-gold-text/5">
                <tr>
                  <td className="px-6 py-4">19/08/2026</td>
                  <td className="px-6 py-4">Auditoria de RLS e RBAC</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[10px]">CERTIFIED</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4">19/08/2026</td>
                  <td className="px-6 py-4">Remediação de Write Policies</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[10px]">FIXED</span>
                  </td>
                </tr>
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
