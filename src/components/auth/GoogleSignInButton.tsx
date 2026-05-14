import React, { useState } from 'react';
import { Icons } from '@/constants';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GoogleSignInButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  text?: string;
  showIcon?: boolean;
  onSuccess?: () => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  className,
  variant = 'outline',
  size = 'default',
  text = 'Entrar com Google',
  showIcon = true,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      
      if (result.error) {
        toast({
          title: 'Erro na autenticação',
          description: 'Não foi possível entrar com Google. Tente novamente.',
          variant: 'destructive',
        });
      } else if (!result.redirected && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar conectar com Google.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSignIn}
      disabled={loading}
      className={cn(
        "gap-3",
        className
      )}
    >
      {showIcon && <Icons.Google className={cn("w-5 h-5", loading && "animate-pulse")} />}
      {size !== 'icon' && (loading ? 'Aguarde...' : text)}
    </Button>
  );
};

export default GoogleSignInButton;
