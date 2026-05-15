import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import CathedraCard from '@/components/cathedra/CathedraCard';
import CathedraButton from '@/components/cathedra/CathedraButton';
import { Icons } from '@/constants';
import CathedraIcon from '@/components/cathedra/CathedraIcon';
import { IconSizePreset } from '@/constants';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <CathedraCard className="max-w-md w-full p-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <CathedraIcon 
            icon={Icons.ShieldCheck} 
            size={IconSizePreset.LARGE} 
            variant="destructive"
            className="text-destructive"
          />
        </div>
        
        <h1 className="text-2xl font-bold mb-3 tracking-tight">Acesso Negado</h1>
        <p className="text-muted-foreground mb-8">
          Você não tem permissão para acessar esta área. Esta seção é exclusiva para administradores da plataforma.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <CathedraButton 
            variant="outline" 
            fullWidth
            onClick={() => navigate(-1)}
          >
            Voltar
          </CathedraButton>
          <CathedraButton 
            variant="primary" 
            fullWidth
            onClick={() => navigate(AppRoute.HOJE)}
          >
            Ir para Início
          </CathedraButton>
        </div>
      </CathedraCard>
      
      <p className="mt-8 text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-50">
        Erro 403 • Cathedra Digital Security
      </p>
    </div>
  );
};

export default AccessDenied;
