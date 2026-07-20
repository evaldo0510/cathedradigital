import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGlossaryRole } from '@/hooks/useGlossaryRole';

interface Props {
  children: React.ReactNode;
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Carregando">
    <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
  </div>
);

/**
 * Protege o painel editorial do Glossário.
 * Aceita usuários com qualquer função em `glossary_permissions`
 * (editor, revisor ou admin) ou admins globais do site.
 */
const GlossaryAdminGuard: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const { role, isLoading } = useGlossaryRole();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth?next=/admin/glossario" replace />;
  if (isLoading) return <Spinner />;
  if (!role) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-3">
        <h1 className="text-2xl font-semibold">Sem permissão editorial</h1>
        <p className="text-muted-foreground">
          Seu usuário ainda não possui função no painel do Glossário. Peça a um administrador
          para atribuir uma função (editor, revisor ou admin).
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

export default GlossaryAdminGuard;
