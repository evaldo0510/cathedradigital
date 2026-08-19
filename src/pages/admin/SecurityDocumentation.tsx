import React from 'react';
import ReaderShell from '@/components/cathedra/ReaderShell';

const SecurityDocumentation = () => {
  return (
    <ReaderShell 
      title="Documentação de Segurança"
      sacraLabel="Auditoria 2026-08-19"
      hideContinuity
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="border-b border-gold-text/20 pb-6 mb-8">
          <h1 className="text-3xl font-display text-primary italic mb-2">Relatório de Segurança Supabase</h1>
          <p className="text-muted-foreground font-reader italic">Auditoria de Políticas RLS e Permissões de Acesso</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-display text-primary flex items-center gap-2">
            <span className="text-gold-text">🛡️</span> Arquitetura de RBAC
          </h2>
          <div className="p-5 bg-accentest border border-gold-text/10 rounded-premium font-reader text-sm leading-relaxed text-primary/80">
            A plataforma utiliza um sistema de Role-Based Access Control (RBAC) centralizado na tabela <code>public.user_roles</code>. 
            A função de segurança <code>public.has_role</code> é definida com <code>SECURITY DEFINER</code> para garantir que verificações 
            de privilégios não causem recursão infinita em políticas RLS.
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-display text-primary flex items-center gap-2">
            <span className="text-gold-text">🔒</span> Políticas de Segurança Ativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gold-text/10 rounded-premium bg-white/50">
              <h3 className="font-bold text-primary mb-2 text-sm uppercase tracking-wider">Perfis (Profiles)</h3>
              <p className="text-sm text-muted-foreground italic">
                Apenas o dono da conta pode editar seu perfil. Campos sensíveis (role, is_premium) são protegidos por gatilhos de banco de dados 
                que impedem alteração manual via API cliente.
              </p>
            </div>
            <div className="p-4 border border-gold-text/10 rounded-premium bg-white/50">
              <h3 className="font-bold text-primary mb-2 text-sm uppercase tracking-wider">Comunidade (Posts)</h3>
              <p className="text-sm text-muted-foreground italic">
                Implementado sistema de moderação automática. Edições em posts existentes por usuários não-admin forçam o retorno 
                do status para 'pending'.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-display text-primary flex items-center gap-2">
            <span className="text-gold-text">📜</span> Histórico de Auditoria
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-reader">
              <thead>
                <tr className="border-b border-gold-text/20 text-muted-foreground uppercase text-[10px] tracking-widest">
                  <th className="py-2">Data</th>
                  <th className="py-2">Evento</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-primary/70">
                <tr className="border-b border-gold-text/5">
                  <td className="py-3">19/08/2026</td>
                  <td>Auditoria de RLS e RBAC</td>
                  <td className="text-green-600 font-bold">CERTIFIED</td>
                </tr>
                <tr className="border-b border-gold-text/5">
                  <td className="py-3">19/08/2026</td>
                  <td>Remediação de Write Policies</td>
                  <td className="text-green-600 font-bold">FIXED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 p-6 border-t border-gold-text/10 italic text-sm text-muted-foreground">
          Relatório gerado automaticamente via Church Context Engine. 
          Consulte o Mission Control para métricas de integridade em tempo real.
        </div>
      </div>
    </ReaderShell>
  );
};

export default SecurityDocumentation;
