import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onSecurityClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onSecurityClick }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-spacing-md px-spacing-md sm:px-spacing-0">
      <div className="flex flex-col gap-spacing-2xs">
        <h1 className="text-premium-xl sm:text-premium-3xl font-display font-black uppercase tracking-tight text-primary">Painel Administrativo</h1>
        <p className="text-premium-xs sm:text-premium-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">CRM & Gestão completa da plataforma.</p>
      </div>
      <div className="flex gap-spacing-xs">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="rounded-premium-full gap-spacing-xs font-bold uppercase tracking-widest text-[10px]">
          <Icons.Home className="w-spacing-md h-spacing-md" /> Ver Portal
        </Button>
        <Button variant="outline" size="sm" onClick={onSecurityClick} className="rounded-premium-full gap-spacing-xs font-bold uppercase tracking-widest text-[10px]">
          <Icons.Shield className="w-spacing-md h-spacing-md" /> Segurança
        </Button>
      </div>
    </div>
  );
};
