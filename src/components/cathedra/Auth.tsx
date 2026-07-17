import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
  onSignupSuccess?: () => void;
}

/**
 * Auth — Sprint Visual 3.0 (extensão): padrão Noir & Gold aplicado à porta de entrada.
 * Toda a lógica de autenticação foi preservada verbatim; só a apresentação muda.
 */
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

  const title = mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Redefinir Senha';
  const subtitle =
    mode === 'login'
      ? 'Retorne ao silêncio. Prossiga na caminhada.'
      : mode === 'signup'
      ? 'Uma cátedra para a vida interior. Comece agora.'
      : 'Informe seu email para receber o link de redefinição.';

  // ─── estilos base compartilhados ──────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    borderBottom: '1px solid var(--noir-line-strong)',
    color: 'var(--noir-text)',
    fontFamily: "'Playfair Display', serif",
  };

  return (
    <div className="cathedra-noir relative flex min-h-screen w-full items-center justify-center px-6 py-16 md:px-12">
      <Helmet>
        <title>{title} · Cathedra</title>
        <meta name="description" content="Acesse a Cathedra para retomar sua caminhada de estudo, oração e formação." />
      </Helmet>

      {/* Halo dourado sutil, igual ao da Home */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 65%)',
        }}
      />

      {/* Voltar */}
      <button
        onClick={() => navigate(AppRoute.HOME)}
        className="group absolute left-6 top-6 inline-flex items-center gap-2 text-[10px] tracking-[0.28em] transition-colors md:left-12 md:top-10"
        style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--noir-text-faint)')}
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        VOLTAR
      </button>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Cabeçalho editorial */}
        <div data-rise className="mb-12 flex flex-col items-center text-center">
          <span
            className="mb-6 inline-block text-[10px] font-medium uppercase tracking-[0.32em]"
            style={{ color: 'var(--gold)', fontFamily: 'Inter, sans-serif' }}
          >
            Sanctuarium Spiritus
          </span>
          <h1
            className="mb-4 leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: 'clamp(2.5rem, 8vw, 3.75rem)',
              color: 'var(--noir-text)',
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </h1>
          <p
            className="max-w-sm text-base italic leading-relaxed"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--noir-text-muted)' }}
          >
            {subtitle}
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div
            data-rise="1"
            role="alert"
            className="mb-6 w-full px-4 py-3 text-sm"
            style={{
              borderLeft: '2px solid #b06060',
              color: '#e8b0b0',
              background: 'rgba(176,96,96,0.08)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            data-rise="1"
            role="status"
            className="mb-6 w-full px-4 py-3 text-sm"
            style={{
              borderLeft: '2px solid var(--gold)',
              color: 'var(--gold-light)',
              background: 'rgba(201,168,76,0.06)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {success}
          </div>
        )}

        {/* Formulário */}
        <form data-rise="2" onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
          {mode === 'signup' && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="auth-name"
                className="text-[10px] uppercase tracking-[0.28em]"
                style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
              >
                Nome
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Como devemos chamá-lo?"
                className="w-full py-2 text-lg placeholder:italic placeholder:opacity-40 focus:outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="auth-email"
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full py-2 text-lg placeholder:italic placeholder:opacity-40 focus:outline-none"
              style={inputStyle}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="auth-password"
                className="text-[10px] uppercase tracking-[0.28em]"
                style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
              >
                Senha
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Mínimo 6 caracteres"
                className="w-full py-2 text-lg placeholder:italic placeholder:opacity-40 focus:outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-2 inline-flex w-full items-center justify-center gap-3 border px-8 py-4 text-xs uppercase tracking-[0.32em] transition-all disabled:opacity-40"
            style={{
              borderColor: 'var(--gold)',
              color: 'var(--gold)',
              fontFamily: 'Inter, sans-serif',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.color = '#0a0a0a';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--gold)';
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
          </button>
        </form>

        {/* Divisor "ou" */}
        {mode !== 'forgot' && (
          <div data-rise="3" className="my-10 flex w-full items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'var(--noir-line)' }} />
            <span
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
            >
              ou
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--noir-line)' }} />
          </div>
        )}

        {/* OAuth */}
        {mode !== 'forgot' && (
          <div data-rise="3" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError('');
                const result = await lovable.auth.signInWithOAuth('google', {
                  redirect_uri: `${window.location.origin}${AppRoute.LOGIN}`,
                  extraParams: { prompt: 'select_account' },
                });
                if (result.error) {
                  console.error('Google Auth Error:', result.error);
                  setError('Não foi possível conectar com o Google. Verifique sua conexão e tente novamente.');
                } else if (!result.redirected) {
                  onSuccess();
                }
                setLoading(false);
              }}
              className="inline-flex items-center justify-center gap-3 border px-4 py-3 text-xs uppercase tracking-[0.28em] transition-colors disabled:opacity-40"
              style={{
                borderColor: 'var(--noir-line-strong)',
                color: 'var(--noir-text)',
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.color = 'var(--gold-light)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--noir-line-strong)';
                e.currentTarget.style.color = 'var(--noir-text)';
              }}
            >
              <Icons.Google className="h-4 w-4" />
              Google
            </button>

            <button
              type="button"
              disabled={loading}
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
              className="inline-flex items-center justify-center gap-3 border px-4 py-3 text-xs uppercase tracking-[0.28em] transition-colors disabled:opacity-40"
              style={{
                borderColor: 'var(--noir-line-strong)',
                color: 'var(--noir-text)',
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.color = 'var(--gold-light)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--noir-line-strong)';
                e.currentTarget.style.color = 'var(--noir-text)';
              }}
            >
              <Icons.Apple className="h-4 w-4" />
              Apple
            </button>
          </div>
        )}

        {/* Modo-switch links */}
        <div data-rise="4" className="mt-10 flex flex-col items-center gap-3 text-center">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-xs tracking-widest transition-colors"
              style={{ color: 'var(--noir-text-muted)', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--noir-text-muted)')}
            >
              Esqueci minha senha
            </button>
          )}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm tracking-wide transition-colors"
            style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          >
            {mode === 'login'
              ? 'Ainda não tem conta? Crie a sua'
              : mode === 'signup'
              ? 'Já tem conta? Entrar'
              : 'Voltar ao login'}
          </button>
        </div>

        {/* Rodapé leve */}
        <p
          className="mt-16 text-center text-[10px] uppercase tracking-[0.32em]"
          style={{ color: 'var(--noir-text-faint)', fontFamily: 'Inter, sans-serif' }}
        >
          Acesso essencial · 100% gratuito
        </p>
      </div>
    </div>
  );
};

export default Auth;
