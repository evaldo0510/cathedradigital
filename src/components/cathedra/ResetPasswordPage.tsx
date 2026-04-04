import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/constants';
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
    // Check for recovery token in URL hash
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
      <div className="max-w-md mx-auto text-center space-y-6 py-20">
        <Logo className="w-16 h-16 mx-auto" />
        <h1 className="text-2xl font-serif font-bold text-foreground">Link inválido</h1>
        <p className="text-muted-foreground">Este link de redefinição de senha é inválido ou já expirou.</p>
        <button onClick={() => navigate(AppRoute.LOGIN)} className="text-primary hover:underline font-medium">
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 py-20">
      <div className="text-center space-y-4">
        <Logo className="w-16 h-16 mx-auto" />
        <h1 className="text-3xl font-serif font-bold text-foreground">Nova Senha</h1>
        <p className="text-muted-foreground font-serif italic">Defina sua nova senha abaixo.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm text-destructive font-medium">{error}</div>
        )}
        {success ? (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-sm text-primary font-medium text-center">
            Senha atualizada com sucesso! Redirecionando...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nova Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Confirmar Senha</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                placeholder="Repita a nova senha"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50">
              {loading ? 'Aguarde...' : 'Atualizar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
