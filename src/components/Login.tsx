import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, Eye, EyeOff, User, Briefcase, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export const Login: React.FC = () => {
  const { signIn, signUp, authError, clearAuthError } = useAuth();

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
    clearAuthError();

    try {
      await signIn(loginForm.email, loginForm.password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    clearAuthError();

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

    try {
      await signUp({
        email: signupForm.email,
        password: signupForm.password,
        name: signupForm.name,
        position: signupForm.position,
        level: signupForm.level
      });

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
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setError('');
    setSuccess('');
    clearAuthError();
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

  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">TalentFlow</h1>
            <p className="text-gray-600 mt-2">Plataforma de Desenvolvimento de Colaboradores</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={16} />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            {!isSignUp ? (
              /* Login Form */
              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
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
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Criar Nova Conta</h3>
                  <p className="text-sm text-gray-600">Preencha os dados para começar</p>
                </div>

                {/* Personal Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="mr-2" size={16} />
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Professional Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Briefcase className="mr-2" size={16} />
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
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lock className="mr-2" size={16} />
                    Credenciais de Acesso
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Repita a senha"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ Sua conta será criada como <strong>Colaborador</strong> e você poderá começar a usar o sistema imediatamente!
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
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