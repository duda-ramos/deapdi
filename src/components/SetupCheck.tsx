import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Database,
  Wifi,
  WifiOff,
  Copy,
  ExternalLink,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { ConnectionDiagnostics } from './ConnectionDiagnostics';

type AuthStatus = 'pending' | 'passed' | 'unauthorized' | 'skipped' | 'error';

interface SetupStatus {
  hasUrl: boolean;
  hasKey: boolean;
  urlValue: string;
  keyValue: string;
  connectionWorking: boolean;
  connectionError: string;
  authEnabled: boolean;
  projectOnline: boolean;
  authStatus: AuthStatus;
  authStatusMessage: string;
}

interface SetupCheckProps {
  onSetupComplete: () => void;
  initialError?: string | null;
  isExpiredToken?: boolean;
  isInvalidKey?: boolean;
  isBoltToken?: boolean;
}

export const SetupCheck: React.FC<SetupCheckProps> = ({ onSetupComplete, initialError, isExpiredToken, isInvalidKey, isBoltToken }) => {
  const [status, setStatus] = useState<SetupStatus>({
    hasUrl: false,
    hasKey: false,
    urlValue: '',
    keyValue: '',
    connectionWorking: false,
    connectionError: initialError || '',
    authEnabled: false,
    projectOnline: false,
    authStatus: 'pending',
    authStatusMessage: ''
  });
  
  const [manualConfig, setManualConfig] = useState({
    url: '',
    key: ''
  });

  const [showManualSetup, setShowManualSetup] = useState(false);
  const [testing, setTesting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  // Show token warnings if detected
  useEffect(() => {
    if (isBoltToken) {
      setStatus(prev => ({
        ...prev,
        connectionError: initialError || 'Bolt-generated token detected. You must use a valid Supabase ANON_KEY from your Supabase project dashboard.'
      }));
    } else if (isExpiredToken) {
      setStatus(prev => ({
        ...prev,
        connectionError: initialError || 'Your Supabase credentials have expired. Please update your .env file.'
      }));
    } else if (isInvalidKey) {
      setStatus(prev => ({
        ...prev,
        connectionError: initialError || 'Your Supabase API key is invalid. Please check your VITE_SUPABASE_ANON_KEY in the .env file.'
      }));
    }
  }, [isExpiredToken, isInvalidKey, isBoltToken, initialError]);

  const checkEnvironmentVariables = async () => {
    console.log('🔍 SetupCheck: Checking environment variables...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔍 SetupCheck: URL exists:', !!url);
    console.log('🔍 SetupCheck: Key exists:', !!key);
    console.log('🔍 SetupCheck: URL value:', url ? `${url.substring(0, 30)}...` : 'MISSING');
    console.log('🔍 SetupCheck: Key value:', key ? `${key.substring(0, 20)}...` : 'MISSING');
    
    const newStatus: SetupStatus = {
      hasUrl: !!url,
      hasKey: !!key,
      urlValue: url || '',
      keyValue: key || '',
      connectionWorking: false,
      connectionError: '',
      authEnabled: false,
      projectOnline: false,
      authStatus: 'pending',
      authStatusMessage: ''
    };
    
    setStatus(newStatus);
    
    if (url && key) {
      await testConnection(url, key);
    } else {
      setShowManualSetup(true);
    }
  };

  const testConnection = async (url: string, key: string) => {
    console.log('🧪 SetupCheck: Testing connection...');
    setTesting(true);

    // Add connection timeout
    const timeoutId = setTimeout(() => {
      console.error('⏱️ SetupCheck: Connection test timed out');
      setStatus(prev => ({
        ...prev,
        connectionWorking: false,
        connectionError: 'Connection test timed out. Please check your Supabase configuration.',
        authEnabled: false,
        projectOnline: false,
        authStatus: 'error',
        authStatusMessage: 'Teste interrompido por timeout.'
      }));
      setTesting(false);
    }, 10000);

    try {
      // Test 1: Basic connection
      console.log('🧪 SetupCheck: Test 1 - Basic connection');
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      console.log('🧪 SetupCheck: Basic connection response:', response.status);
      const acceptableStatuses = [200, 204, 404];

      if (acceptableStatuses.includes(response.status)) {
        if (response.status === 404) {
          console.log('🧪 SetupCheck: Received 404 from /rest/v1/ but treating as reachable project');
        }
      } else if ([401, 403].includes(response.status)) {
        clearTimeout(timeoutId);
        setStatus(prev => ({
          ...prev,
          connectionWorking: false,
          connectionError: 'A chave anônima fornecida não tem permissão para acessar a API REST pública. Confirme se você copiou a anon key correta das configurações do projeto.',
          authEnabled: false,
          projectOnline: true,
          authStatus: 'unauthorized',
          authStatusMessage: 'O endpoint público /rest/v1/ recusou a anon key fornecida.'
        }));
        return;
      } else {
        clearTimeout(timeoutId);
        setStatus(prev => ({
          ...prev,
          connectionWorking: false,
          connectionError: `Resposta inesperada do endpoint público (HTTP ${response.status}). Verifique se o projeto Supabase está ativo.`,
          authEnabled: false,
          projectOnline: false,
          authStatus: 'error',
          authStatusMessage: ''
        }));
        return;
      }

      // Optional Auth endpoint check
      console.log('🧪 SetupCheck: Test 2 - Auth endpoint (optional)');
      let authStatus: AuthStatus = 'skipped';
      let authStatusMessage = '';
      let authEnabled = false;

      try {
        const authResponse = await fetch(`${url}/auth/v1/settings`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });

        console.log('🧪 SetupCheck: Auth response:', authResponse.status);

        if (authResponse.ok) {
          const authSettings = await authResponse.json();
          console.log('🧪 SetupCheck: Auth settings:', authSettings);
          authEnabled = authSettings.external_email_enabled !== false;
          authStatus = 'passed';
          authStatusMessage = 'Endpoint de configurações acessível com a anon key.';
        } else if ([401, 403].includes(authResponse.status)) {
          authStatus = 'unauthorized';
          authStatusMessage = 'Endpoint de autenticação não é público. Teste marcado como não realizado.';
        } else if (authResponse.status === 404) {
          authStatus = 'skipped';
          authStatusMessage = 'Endpoint de autenticação não encontrado neste projeto.';
        } else {
          authStatus = 'error';
          authStatusMessage = `Falha ao testar autenticação (HTTP ${authResponse.status}).`;
        }
      } catch (authError) {
        console.error('⚠️ SetupCheck: Falha ao verificar endpoint de autenticação:', authError);
        authStatus = 'error';
        authStatusMessage = 'Não foi possível testar o endpoint de autenticação.';
      }

      setStatus(prev => ({
        ...prev,
        connectionWorking: true,
        connectionError: '',
        authEnabled,
        projectOnline: true,
        authStatus,
        authStatusMessage
      }));

      console.log('✅ SetupCheck: All tests passed!');
      clearTimeout(timeoutId);

      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ SetupCheck: Connection test failed:', error);

        let errorMessage = 'Ocorreu um erro inesperado durante o teste de conexão.';
        const errorMessageText = typeof (error as { message?: unknown })?.message === 'string'
          ? (error as { message: string }).message
          : '';

        if (errorMessageText.includes('Failed to fetch')) {
          errorMessage = 'Não foi possível conectar ao Supabase. Verifique se a URL está correta e se o projeto está online.';
        } else if (errorMessageText.includes('401') || errorMessageText.includes('403')) {
          errorMessage = 'A anon key não foi aceita pelo Supabase. Verifique se você está usando a chave pública (anon).';
        } else if (errorMessageText.includes('404')) {
          errorMessage = 'Projeto não encontrado. Verifique se a URL do Supabase está correta.';
        }

        setStatus(prev => ({
          ...prev,
          connectionWorking: false,
          connectionError: errorMessage,
          authEnabled: false,
          projectOnline: false,
          authStatus: 'error',
          authStatusMessage: ''
        }));
      } finally {
        setTesting(false);
      }
  };

  const handleManualSetup = async () => {
    if (!manualConfig.url || !manualConfig.key) {
      alert('Por favor, preencha URL e Chave de API');
      return;
    }
    
    // Save to localStorage for this session
    localStorage.setItem('TEMP_SUPABASE_URL', manualConfig.url);
    localStorage.setItem('TEMP_SUPABASE_ANON_KEY', manualConfig.key);
    
    await testConnection(manualConfig.url, manualConfig.key);
  };

  const enableOfflineMode = () => {
    setOfflineMode(true);
    localStorage.setItem('OFFLINE_MODE', 'true');
    onSetupComplete();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (working: boolean, error: string) => {
    if (error) return <XCircle className="text-red-500" size={20} />;
    if (working) return <CheckCircle className="text-green-500" size={20} />;
    return <AlertTriangle className="text-yellow-500" size={20} />;
  };

  const getAuthStatusDisplay = (authStatus: AuthStatus) => {
    switch (authStatus) {
      case 'passed':
        return { label: 'Autenticação', text: 'Testado', color: 'text-green-600', messageColor: 'text-green-600', icon: <CheckCircle className="text-green-500" size={20} /> };
      case 'unauthorized':
        return { label: 'Autenticação', text: 'Não testado (restrito)', color: 'text-yellow-600', messageColor: 'text-yellow-600', icon: <AlertTriangle className="text-yellow-500" size={20} /> };
      case 'skipped':
        return { label: 'Autenticação', text: 'Não testado', color: 'text-gray-500', messageColor: 'text-gray-500', icon: <AlertTriangle className="text-yellow-500" size={20} /> };
      case 'error':
        return { label: 'Autenticação', text: 'Falha ao testar', color: 'text-red-600', messageColor: 'text-red-600', icon: <XCircle className="text-red-500" size={20} /> };
      default:
        return { label: 'Autenticação', text: 'Aguardando teste', color: 'text-gray-500', messageColor: 'text-gray-500', icon: <AlertTriangle className="text-yellow-500" size={20} /> };
    }
  };

  const authDisplay = getAuthStatusDisplay(status.authStatus);

  if (status.connectionWorking) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="p-8 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            ✅ Supabase Configurado!
          </h2>
          <p className="text-gray-600 mb-6">
            Conexão estabelecida com sucesso. Você pode continuar usando o sistema.
          </p>
          <Button onClick={onSetupComplete} className="w-full">
            Continuar para Login
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (showDiagnostics) {
    return <ConnectionDiagnostics onClose={() => setShowDiagnostics(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="text-red-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Configuração Necessária</h1>
            <p className="text-gray-600 mt-2">O Supabase precisa ser configurado para continuar</p>
          </div>

          {/* Token Warnings */}
          {(isBoltToken || isExpiredToken || isInvalidKey) && (
            <Card className="p-6 mb-6 bg-red-50 border-red-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    {isBoltToken ? '⚠️ Token Gerado pelo Bolt (Inválido)' :
                     isExpiredToken ? 'Token Expirado' : 'Chave de API Inválida'}
                  </h3>
                  <p className="text-red-800 mb-4">
                    {isBoltToken
                      ? 'Seu .env contém um token gerado pelo Bolt/sistema de desenvolvimento, não pelo Supabase. Este token NÃO funcionará em produção.'
                      : isExpiredToken
                      ? 'Suas credenciais do Supabase expiraram. Para continuar, você precisa atualizar o arquivo .env com novas credenciais.'
                      : 'Sua chave de API do Supabase é inválida. Por favor, verifique o valor de VITE_SUPABASE_ANON_KEY no seu arquivo .env.'}
                  </p>

                  {isBoltToken && (
                    <div className="bg-orange-100 border border-orange-200 p-3 rounded-lg text-sm mb-3">
                      <p className="font-semibold text-orange-900 mb-1">🔴 Problema Detectado:</p>
                      <p className="text-orange-800">
                        Token com <code className="bg-orange-200 px-1 rounded">issuer: "bolt"</code> detectado.
                        Tokens Bolt têm tempo de vida ZERO (iat === exp) e não são aceitos pela API Supabase.
                      </p>
                    </div>
                  )}

                  <div className="bg-red-100 p-3 rounded-lg text-sm">
                    <p className="font-medium text-red-900 mb-2">✅ Como resolver:</p>
                    <ol className="list-decimal list-inside space-y-1 text-red-800">
                      <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
                      <li>Selecione seu projeto (ou crie um novo)</li>
                      <li>Vá em <strong>Settings → API</strong></li>
                      <li>Copie a <strong>Project URL</strong> (formato: https://[id].supabase.co)</li>
                      <li>Copie a <strong>anon/public key</strong> (NÃO a service_role)</li>
                      <li>Cole as credenciais no arquivo <code className="bg-red-200 px-1 rounded">.env</code></li>
                      <li>Reinicie o servidor: <code className="bg-red-200 px-1 rounded">npm run dev</code></li>
                    </ol>
                  </div>

                  {isBoltToken && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                      <p className="text-yellow-900">
                        <strong>💡 Dica:</strong> Tokens válidos do Supabase têm <code className="bg-yellow-200 px-1">issuer: "supabase"</code> e lifetime &gt; 1 hora.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Diagnostic Panel */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database className="mr-2" size={20} />
              Diagnóstico do Sistema
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.hasUrl, '')}
                  <span className="font-medium">URL do Supabase</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${status.hasUrl ? 'text-green-600' : 'text-red-600'}`}>
                    {status.hasUrl ? 'Configurada' : 'Ausente'}
                  </span>
                  {status.hasUrl && (
                    <div className="text-xs text-gray-500">
                      {status.urlValue.substring(0, 30)}...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.hasKey, '')}
                  <span className="font-medium">Chave de API</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${status.hasKey ? 'text-green-600' : 'text-red-600'}`}>
                    {status.hasKey ? 'Configurada' : 'Ausente'}
                  </span>
                  {status.hasKey && (
                    <div className="text-xs text-gray-500">
                      {status.keyValue.substring(0, 20)}...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {status.connectionWorking ?
                    <Wifi className="text-green-500" size={20} /> :
                    <WifiOff className="text-red-500" size={20} />
                  }
                  <span className="font-medium">Conexão</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${status.connectionWorking ? 'text-green-600' : 'text-red-600'}`}>
                    {testing ? 'Testando...' : status.connectionWorking ? 'Funcionando' : 'Falhou'}
                  </span>
                  {status.connectionError && (
                    <div className="text-xs text-red-500 max-w-xs">
                      {status.connectionError}
                    </div>
                  )}
                </div>
              </div>

              {status.authStatus !== 'pending' && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {authDisplay.icon}
                    <span className="font-medium">{authDisplay.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${authDisplay.color}`}>
                      {authDisplay.text}
                    </span>
                    {status.authStatusMessage && (
                      <div className={`text-xs ${authDisplay.messageColor} max-w-xs mt-1 text-left md:text-right`}>
                        {status.authStatusMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <Button
                onClick={checkEnvironmentVariables}
                variant="secondary"
                size="sm"
                loading={testing}
              >
                <RefreshCw size={16} className="mr-2" />
                Testar Novamente
              </Button>
              <Button
                onClick={() => setShowDiagnostics(true)}
                variant="outline"
                size="sm"
              >
                <Activity size={16} className="mr-2" />
                Diagnóstico Completo
              </Button>
            </div>
          </Card>

          {/* Manual Setup */}
          {(!status.hasUrl || !status.hasKey || !status.connectionWorking) && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Configuração Manual</h3>
              
              {!showManualSetup ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    As variáveis de ambiente não foram encontradas ou a conexão falhou.
                  </p>
                  <Button onClick={() => setShowManualSetup(true)}>
                    Configurar Manualmente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="URL do Supabase"
                    value={manualConfig.url}
                    onChange={(e) => setManualConfig({ ...manualConfig, url: e.target.value })}
                    placeholder="https://seu-projeto.supabase.co"
                  />
                  
                  <Input
                    label="Chave Anônima (Anon Key)"
                    value={manualConfig.key}
                    onChange={(e) => setManualConfig({ ...manualConfig, key: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                  
                  <Button onClick={handleManualSetup} loading={testing} className="w-full">
                    Testar Configuração
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Como Configurar</h3>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">1. Obtenha suas credenciais do Supabase</h4>
                <p className="text-blue-800 mb-2">Acesse seu projeto no Supabase Dashboard:</p>
                <div className="bg-blue-100 p-2 rounded font-mono text-xs">
                  https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/settings/api
                </div>
                <button 
                  onClick={() => window.open('https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/settings/api', '_blank')}
                  className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Abrir Supabase Dashboard
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">2. Copie as credenciais corretas</h4>
                <p className="text-green-800 mb-2">Na página de API Settings:</p>
                <ul className="text-green-800 space-y-1">
                  <li>• Copie a <strong>Project URL</strong></li>
                  <li>• Copie a <strong>anon/public key</strong> (NÃO a service_role)</li>
                  <li>• Cole no arquivo .env do projeto</li>
                  <li>• Reinicie o servidor: npm run dev</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">⚠️ Erro 400 - API Key Inválida</h4>
                <p className="text-red-800 mb-2">O erro 400 indica que sua API key está:</p>
                <ul className="text-red-800 space-y-1">
                  <li>• Gerada pelo Bolt (issuer inválido)</li>
                  <li>• Expirada ou inválida</li>
                  <li>• Mal formatada (caracteres faltando)</li>
                  <li>• Usando service_role ao invés de anon key</li>
                  <li>• Projeto Supabase pausado ou deletado</li>
                  <li>• Tempo de vida zero (iat === exp)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Clear Cache Button */}
          {(isBoltToken || isExpiredToken || isInvalidKey) && (
            <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold mb-2 text-yellow-900">Limpar Cache e Sessões</h3>
              <p className="text-yellow-800 mb-4 text-sm">
                Se você já atualizou o .env com credenciais válidas, clique abaixo para limpar sessões antigas e tentar novamente.
              </p>
              <Button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                variant="outline"
                className="w-full border-yellow-400 text-yellow-900 hover:bg-yellow-100"
              >
                🧹 Limpar Cache e Recarregar
              </Button>
            </Card>
          )}

          {/* Offline Mode */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Modo Offline (Desenvolvimento)</h3>
            <p className="text-gray-600 mb-4">
              Continue o desenvolvimento sem Supabase usando dados mockados.
            </p>
            <Button onClick={enableOfflineMode} variant="secondary" className="w-full">
              Continuar em Modo Offline
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};