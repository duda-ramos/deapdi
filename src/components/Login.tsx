import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, Eye, EyeOff, User, Briefcase, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  
  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Signup form
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    level: 'Júnior'
  });

  const levelOptions = [
    { value: 'Estagiário', label: 'Estagiário' },
    { value: 'Júnior', label: 'Júnior' },
    { value: 'Pleno', label: 'Pleno' },
    { value: 'Sênior', label: 'Sênior' },
    { value: 'Especialista', label: 'Especialista' }
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    console.log('🔵 Login: Starting sign in...', loginForm.email);

    try {
      await signIn(loginForm.email, loginForm.password);
      console.log('✅ Login: Sign in successful');
    } catch (err: any) {
      console.error('❌ Login: Sign in failed:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (signupForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!signupForm.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!signupForm.position.trim()) {
      setError('Cargo é obrigatório');
      return;
    }

    setIsLoading(true);
    console.log('🔵 Login: Starting sign up...', signupForm.email);

    try {
      await signUp({
        email: signupForm.email,
        password: signupForm.password,
        name: signupForm.name,
        position: signupForm.position,
        level: signupForm.level
      });

      console.log('✅ Login: Sign up successful');
      setSuccess('Conta criada com sucesso! Você já pode fazer login.');
      setIsSignUp(false);
      setLoginForm({ email: signupForm.email, password: '' });
      setSignupForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        position: '',
        level: 'Júnior'
      });

    } catch (err: any) {
      console.error('❌ Login: Sign up failed:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setError('');
    setSuccess('');
    setLoginForm({ email: '', password: '' });
    setSignupForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      position: '',
      level: 'Júnior'
    });
  };

  const switchMode = (mode: boolean) => {
    setIsSignUp(mode);
    resetForms();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:flex sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-ink shadow-soft">
              <Trophy size={32} />
            </div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">TalentFlow</h1>
            <p className="mt-2 text-sm text-muted sm:text-base">Plataforma de Desenvolvimento de Colaboradores</p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-6 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => switchMode(false)}
              aria-pressed={!isSignUp}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                !isSignUp
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchMode(true)}
              aria-pressed={isSignUp}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isSignUp
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form Container */}
          <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
            {/* Messages */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3" role="alert" aria-live="assertive">
                <AlertCircle className="mt-0.5 text-rose-500" size={16} />
                <span className="text-sm text-rose-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3" role="status" aria-live="polite">
                <span className="text-sm text-emerald-700">{success}</span>
              </div>
            )}

            {!isSignUp ? (
              /* Login Form */
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-12 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                      placeholder="Sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  Entrar
                </Button>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/30 text-ink">
                    <UserPlus size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">Criar Nova Conta</h3>
                  <p className="text-sm text-muted">Preencha os dados para começar</p>
                </div>

                {/* Personal Info */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <h4 className="mb-3 flex items-center text-sm font-semibold text-ink">
                    <User className="mr-2 text-muted" size={16} />
                    Informações Pessoais
                  </h4>
                  <div className="space-y-3">
                    <Input
                      label="Nome Completo"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Professional Info */}
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <h4 className="mb-3 flex items-center text-sm font-semibold text-ink">
                    <Briefcase className="mr-2 text-muted" size={16} />
                    Informações Profissionais
                  </h4>
                  <div className="space-y-3">
                    <Input
                      label="Cargo/Posição"
                      value={signupForm.position}
                      onChange={(e) => setSignupForm({ ...signupForm, position: e.target.value })}
                      placeholder="Ex: Desenvolvedor, Analista, Designer..."
                      required
                    />
                    <Select
                      label="Nível Profissional"
                      value={signupForm.level}
                      onChange={(e) => setSignupForm({ ...signupForm, level: e.target.value })}
                      options={levelOptions}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h4 className="mb-3 flex items-center text-sm font-semibold text-ink">
                    <Lock className="mr-2 text-amber-500" size={16} />
                    Credenciais de Acesso
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
                          placeholder="Repita a senha"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm text-emerald-700">
                    ✅ Sua conta será criada como <strong>Colaborador</strong> e você poderá começar a usar o sistema imediatamente!
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  Criar Conta
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};