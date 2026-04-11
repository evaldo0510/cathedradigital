import React, { useState } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

interface AuthProps {
  onSuccess: () => void;
  onSignupSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess, onSignupSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Se este email estiver cadastrado, você receberá um link para redefinir sua senha.');
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Conta criada! Fazendo login...');
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setSuccess('Conta criada com sucesso! Você já pode fazer login.');
          setMode('login');
        } else {
          if (onSignupSuccess) onSignupSuccess();
          else onSuccess();
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : signInError.message);
      } else {
        onSuccess();
      }
    }
    setLoading(false);
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {/* Logo removed */}
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {mode === 'login' ? 'Acessar Cathedra' : mode === 'signup' ? 'Criar Conta' : 'Redefinir Senha'}
        </h1>
        <p className="text-muted-foreground font-serif italic">
          {mode === 'login' ? 'Entre para acessar recursos exclusivos.' : mode === 'signup' ? 'Junte-se à comunidade de fé e estudo.' : 'Informe seu email para receber o link de redefinição.'}
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm text-destructive font-medium">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-sm text-primary font-medium">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nome</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50">
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
          </button>
        </form>

        <div className="relative flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              const result = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setError('Erro ao entrar com Google. Tente novamente.');
              } else if (!result.redirected) {
                onSuccess();
              }
              setLoading(false);
            }}
            disabled={loading}
            className="w-full py-3.5 bg-background text-foreground border border-border rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-muted transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Icons.Google className="w-5 h-5" />
            Google
          </button>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              const result = await lovable.auth.signInWithOAuth('apple', {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setError('Erro ao entrar com Apple. Tente novamente.');
              } else if (!result.redirected) {
                onSuccess();
              }
              setLoading(false);
            }}
            disabled={loading}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Icons.Apple className="w-5 h-5" />
            Apple
          </button>
        </div>

        <div className="text-center space-y-2">
          {mode === 'login' && (
            <button onClick={() => switchMode('forgot')} className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium block w-full">
              Esqueci minha senha
            </button>
          )}
          <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-primary hover:underline font-medium">
            {mode === 'login' ? 'Não tem conta? Criar agora' : mode === 'signup' ? 'Já tem conta? Fazer login' : 'Voltar ao login'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        O acesso básico é <span className="font-bold text-foreground">100% gratuito</span>. Recursos de IA requerem plano PRO.
      </p>
    </div>
  );
};

export default Auth;
