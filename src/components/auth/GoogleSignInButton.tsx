import React, { useState } from 'react';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        toast({
          title: 'Erro na autenticação',
          description: 'Não foi possível entrar com Google. Tente novamente.',
          variant: 'destructive',
        });
      } else if (onSuccess) {
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
        "gap-spacing-sm",
        className
      )}
    >
      {showIcon && <Icons.Google className={cn("w-spacing-md h-spacing-md", loading && "animate-pulse")} />}
      {size !== 'icon' && (loading ? 'Aguarde...' : text)}
    </Button>
  );
};

export default GoogleSignInButton;
