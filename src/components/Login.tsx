import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, Eye, EyeOff, User, Briefcase, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import { Button } from './ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    level: 'Estagiário'
  });
  const { login, loading: authLoading } = useAuth();

  const levelOptions = [
    { value: 'Estagiário', label: 'Estagiário' },
    { value: 'Assistente', label: 'Assistente' },
    { value: 'Júnior', label: 'Júnior' },
    { value: 'Pleno', label: 'Pleno' },
    { value: 'Sênior', label: 'Sênior' },
    { value: 'Especialista', label: 'Especialista' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Login: handleSubmit called with email:', email);
    setError('');
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('📝 Login: Calling login function...');
      await login(email, password);
      console.log('📝 Login: Login function completed successfully');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('Email ou senha incorretos. Verifique suas credenciais ou crie uma nova conta.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMessage('Este email já está cadastrado. Tente fazer login ou use outro email.');
      } else {
        setErrorMessage(err.message || 'Erro ao processar solicitação');
      }
      console.log('📝 Login: Login failed with error:', err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Login: handleSignUp called');
    setError('');
    setErrorMessage('');
    setSuccessMessage('');

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setSignUpLoading(true);
      console.log('📝 Login: Creating new account...');
      const result = await authService.signUp({
        email: signUpData.email,
        password: signUpData.password,
        name: signUpData.name,
        position: signUpData.position,
        level: signUpData.level,
        role: 'employee'
      });
      
      console.log('📝 Login: Signup successful', result);
      
      // Show success message and switch to login
      setError('');
      
      // Clear form
      setSignUpData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        position: '',
        level: 'Estagiário'
      });
      
      // Show success message and switch to login form
      setSuccessMessage('Conta criada com sucesso! Agora você pode fazer login com suas credenciais.');
      setIsSignUp(false); // Switch back to login form
      
      // Set email for login form
      setEmail(signUpData.email);
    } catch (err: any) {
      console.error('SignUp error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('Email ou senha incorretos. Verifique suas credenciais ou crie uma nova conta.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMessage('Este email já está cadastrado. Tente fazer login ou use outro email.');
      } else {
        setErrorMessage(err.message || 'Erro ao processar solicitação');
      }
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
      console.log('📝 Login: SignUp failed with error:', err);
    } finally {
      setSignUpLoading(false);
    }
  };

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

          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Forms */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}

            {!isSignUp ? (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={authLoading}
                  className="w-full"
                  size="lg"
                >
                  Entrar
                </Button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Criar Nova Conta</h3>
                  <p className="text-sm text-gray-600">Preencha os dados para começar</p>
                </div>

                {/* Informações Pessoais */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="mr-2" size={16} />
                    Informações Pessoais
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo
                      </label>
                      <input
                        id="signup-name"
                        name="name"
                        type="text"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          id="signup-email"
                          name="email"
                          type="email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Informações Profissionais */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Briefcase className="mr-2" size={16} />
                    Informações Profissionais
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="signup-position" className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo/Posição
                      </label>
                      <input
                        id="signup-position"
                        name="position"
                        type="text"
                        value={signUpData.position}
                        onChange={(e) => setSignUpData({ ...signUpData, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Desenvolvedor, Analista, Designer..."
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-level" className="block text-sm font-medium text-gray-700 mb-1">
                        Nível Profissional
                      </label>
                      <select
                        id="signup-level"
                        name="level"
                        value={signUpData.level}
                        onChange={(e) => setSignUpData({ ...signUpData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        {levelOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Senha */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lock className="mr-2" size={16} />
                    Credenciais de Acesso
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          id="signup-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
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
                      <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Repita a senha"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ Sua conta será criada como <strong>Colaborador</strong> e você poderá começar a usar o sistema imediatamente!
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={signUpLoading}
                  className="w-full"
                  size="lg"
                >
                  {signUpLoading ? 'Criando Conta...' : 'Criar Conta'}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};