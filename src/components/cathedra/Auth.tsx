import React, { useState } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CathedraCard } from './CathedraCard';

interface AuthProps {
  onSuccess: () => void;
  onSignupSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess, onSignupSuccess }) => {
  const navigate = useNavigate();
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
    <div className="max-w-md mx-auto space-y-xl relative">
      <Button 
        variant="ghost"
        size="sm"
        onClick={() => navigate(AppRoute.HOME)}
        className="absolute -top-2xl left-0 flex items-center gap-xs text-muted-foreground hover:text-primary transition-colors group shadow-none"
      >
        <ArrowLeft className="w-md h-md group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Voltar para Início</span>
      </Button>

      <div className="text-center space-y-md">
        <div className="flex justify-center">
          <Icons.Logo variant="blue" className="w-3xl h-3xl" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {mode === 'login' ? 'Acessar Cathedra' : mode === 'signup' ? 'Criar Conta' : 'Redefinir Senha'}
        </h1>
        <p className="text-muted-foreground font-serif italic">
          {mode === 'login' ? 'Entre para acessar recursos exclusivos.' : mode === 'signup' ? 'Junte-se à comunidade de fé e estudo.' : 'Informe seu email para receber o link de redefinição.'}
        </p>
      </div>

      <CathedraCard padding="md" className="space-y-lg">
        {error && (
          <div className="p-md bg-destructive/10 border border-destructive/20 rounded-premium text-sm text-destructive font-medium">{error}</div>
        )}
        {success && (
          <div className="p-md bg-primary/10 border border-primary/20 rounded-premium text-sm text-primary font-medium">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-md">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-xs block">Nome</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Seu nome completo"
                className="w-full px-md py-sm rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-xs block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              className="w-full px-md py-sm rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-xs block">Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-md py-sm rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <Button type="submit" isLoading={loading} className="w-full h-2xl rounded-full">
            {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
          </Button>
        </form>

        <div className="relative flex items-center gap-md my-xs">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setLoading(true);
              setError('');
              const result = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: `${window.location.origin}${AppRoute.LOGIN}`,
                extraParams: {
                  prompt: 'select_account',
                }
              });
              if (result.error) {
                console.error('Google Auth Error:', result.error);
                setError('Não foi possível conectar com o Google. Verifique sua conexão e tente novamente.');
              } else if (!result.redirected) {
                onSuccess();
              }
              setLoading(false);
            }}
            isLoading={loading}
            className="w-full h-2xl flex items-center justify-center gap-sm group"
          >
            <Icons.Google className="w-md h-md transition-transform group-hover:scale-110" />
            Google
          </Button>

          <Button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              const result = await lovable.auth.signInWithOAuth('apple', {
                redirect_uri: `${window.location.origin}${AppRoute.LOGIN}`,
              });
              if (result.error) {
                console.error('Apple Auth Error:', result.error);
                setError('Não foi possível conectar com a Apple. Tente novamente em instantes.');
              } else if (!result.redirected) {
                onSuccess();
              }
              setLoading(false);
            }}
            isLoading={loading}
            className="w-full h-2xl flex items-center justify-center gap-sm group"
          >
            <Icons.Apple className="w-md h-md transition-transform group-hover:scale-110" />
            Apple
          </Button>
        </div>

        {error && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => { setError(''); setLoading(false); }}
            className="w-full h-xl shadow-none"
          >
            Tentar novamente
          </Button>
        )}

        <div className="text-center space-y-xs">
          {mode === 'login' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => switchMode('forgot')} 
              className="text-muted-foreground hover:text-primary font-medium w-full shadow-none capitalize tracking-normal text-sm"
            >
              Esqueci minha senha
            </Button>
          )}
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-primary hover:text-primary/80 font-medium w-full shadow-none capitalize tracking-normal text-sm"
          >
            {mode === 'login' ? 'Não tem conta? Criar agora' : mode === 'signup' ? 'Já tem conta? Fazer login' : 'Voltar ao login'}
          </Button>
        </div>
      </CathedraCard>

      <p className="text-center text-xs text-muted-foreground">
        O acesso básico é <span className="font-bold text-foreground">100% gratuito</span>. Recursos de IA requerem plano PRO.
      </p>
    </div>
  );
};

export default Auth;
