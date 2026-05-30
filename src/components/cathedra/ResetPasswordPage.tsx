import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
// Logo import removed
import { AppRoute } from '@/types';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate(AppRoute.DASHBOARD, { replace: true }), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="max-w-md mx-auto text-center space-y-lg py-3xl">
        {/* Logo removed */}
        <h1 className="text-2xl font-serif font-bold text-foreground">Link inválido</h1>
        <p className="text-muted-foreground">Este link de redefinição de senha é inválido ou já expirou.</p>
        <Button onClick={() => navigate(AppRoute.LOGIN)} className="text-primary hover:underline font-medium">
          Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-xl py-3xl">
      <div className="text-center space-y-md">
        {/* Logo removed */}
        <h1 className="text-3xl font-serif font-bold text-foreground">Nova Senha</h1>
        <p className="text-muted-foreground font-serif italic">Defina sua nova senha abaixo.</p>
      </div>

      <div className="bg-card border border-border rounded-premium p-xl space-y-lg">
        {error && (
          <div className="p-md bg-destructive/10 border border-destructive/20 rounded-premium text-sm text-destructive font-medium">{error}</div>
        )}
        {success ? (
          <div className="p-md bg-primary/10 border border-primary/20 rounded-premium text-sm text-primary font-medium text-center">
            Senha atualizada com sucesso! Redirecionando...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-xs block">Nova Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-md py-sm rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-xs block">Confirmar Senha</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                placeholder="Repita a nova senha"
                className="w-full px-md py-sm rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full py-md bg-foreground text-background rounded-full font-black uppercase text-xs tracking-widest shadow-premium-hover hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50">
              {loading ? 'Aguarde...' : 'Atualizar Senha'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;