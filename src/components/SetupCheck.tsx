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
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { initializeSupabaseClient } from '../lib/supabase';

interface SetupStatus {
  hasUrl: boolean;
  hasKey: boolean;
  urlValue: string;
  keyValue: string;
  connectionWorking: boolean;
  connectionError: string;
  authEnabled: boolean;
  projectOnline: boolean;
}

interface SetupCheckProps {
  onSetupComplete: () => void;
  initialError?: string | null;
  isExpiredToken?: boolean;
}

export const SetupCheck: React.FC<SetupCheckProps> = ({ onSetupComplete, initialError, isExpiredToken }) => {
  const [status, setStatus] = useState<SetupStatus>({
    hasUrl: false,
    hasKey: false,
    urlValue: '',
    keyValue: '',
    connectionWorking: false,
    connectionError: initialError || '',
    authEnabled: false,
    projectOnline: false
  });
  
  const [manualConfig, setManualConfig] = useState({
    url: '',
    key: ''
  });

  const [showManualSetup, setShowManualSetup] = useState(false);
  const [testing, setTesting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const testingRef = React.useRef(false);
  const lastTestTimeRef = React.useRef(0);
  const TEST_COOLDOWN = 5000; // 5 seconds between tests

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  // Show expired token warning if detected
  useEffect(() => {
    if (isExpiredToken) {
      setStatus(prev => ({
        ...prev,
        connectionError: initialError || 'Your Supabase credentials have expired. Please update your .env file.'
      }));
    }
  }, [isExpiredToken, initialError]);

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
      projectOnline: false
    };
    
    setStatus(newStatus);
    
    if (url && key) {
      await testConnection(url, key);
    } else {
      setShowManualSetup(true);
    }
  };

  const testConnection = async (url: string, key: string) => {
    // Prevent concurrent tests
    if (testingRef.current) {
      console.warn('🧪 SetupCheck: Test already in progress');
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastTest = now - lastTestTimeRef.current;
    if (timeSinceLastTest < TEST_COOLDOWN) {
      const waitTime = Math.ceil((TEST_COOLDOWN - timeSinceLastTest) / 1000);
      console.warn(`🧪 SetupCheck: Please wait ${waitTime}s before testing again`);
      setStatus(prev => ({
        ...prev,
        connectionError: `Please wait ${waitTime} seconds before testing again.`
      }));
      return;
    }

    console.log('🧪 SetupCheck: Testing connection...');
    testingRef.current = true;
    lastTestTimeRef.current = now;
    setTesting(true);

    // Add connection timeout
    const timeoutId = setTimeout(() => {
      console.error('⏱️ SetupCheck: Connection test timed out');
      setStatus(prev => ({
        ...prev,
        connectionWorking: false,
        connectionError: 'Connection test timed out. Please check your Supabase configuration.',
        authEnabled: false,
        projectOnline: false
      }));
      setTesting(false);
      testingRef.current = false;
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Test 2: Auth endpoint
      console.log('🧪 SetupCheck: Test 2 - Auth endpoint');
      const authResponse = await fetch(`${url}/auth/v1/settings`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      console.log('🧪 SetupCheck: Auth response:', authResponse.status);
      
      let authEnabled = false;
      if (authResponse.ok) {
        const authSettings = await authResponse.json();
        console.log('🧪 SetupCheck: Auth settings:', authSettings);
        authEnabled = authSettings.external_email_enabled !== false;
      }
      
      // Test 3: Simple query
      console.log('🧪 SetupCheck: Test 3 - Simple query');
      const queryResponse = await fetch(`${url}/rest/v1/profiles?select=count&head=true`, {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      console.log('🧪 SetupCheck: Query response:', queryResponse.status);
      
      setStatus(prev => ({
        ...prev,
        connectionWorking: true,
        connectionError: '',
        authEnabled,
        projectOnline: true
      }));

      console.log('✅ SetupCheck: All tests passed!');
      clearTimeout(timeoutId);
      localStorage.removeItem('OFFLINE_MODE');
      initializeSupabaseClient(true);

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ SetupCheck: Connection test failed:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao Supabase. Verifique se a URL está correta e se o projeto está online.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Chave de API inválida. Verifique se a ANON_KEY está correta.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Projeto não encontrado. Verifique se a URL do Supabase está correta.';
      }
      
      setStatus(prev => ({
        ...prev,
        connectionWorking: false,
        connectionError: errorMessage,
        authEnabled: false,
        projectOnline: false
      }));
    } finally {
      setTesting(false);
      testingRef.current = false;
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
    initializeSupabaseClient(true);
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

          {/* Expired Token Warning */}
          {isExpiredToken && (
            <Card className="p-6 mb-6 bg-red-50 border-red-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Token Expirado
                  </h3>
                  <p className="text-red-800 mb-4">
                    Suas credenciais do Supabase expiraram. Para continuar, você precisa atualizar o arquivo .env com novas credenciais.
                  </p>
                  <div className="bg-red-100 p-3 rounded-lg text-sm">
                    <p className="font-medium text-red-900 mb-2">Como resolver:</p>
                    <ol className="list-decimal list-inside space-y-1 text-red-800">
                      <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                      <li>Vá em Settings → API</li>
                      <li>Copie a nova Project URL e anon/public key</li>
                      <li>Atualize seu arquivo .env</li>
                      <li>Reinicie o servidor de desenvolvimento</li>
                    </ol>
                  </div>
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
                <h4 className="font-medium text-blue-900 mb-2">1. Crie um arquivo .env</h4>
                <p className="text-blue-800 mb-2">Na raiz do projeto, crie um arquivo chamado <code>.env</code> com:</p>
                <div className="bg-blue-100 p-2 rounded font-mono text-xs">
                  VITE_SUPABASE_URL=https://seu-projeto.supabase.co<br/>
                  VITE_SUPABASE_ANON_KEY=sua-chave-anonima
                </div>
                <button 
                  onClick={() => copyToClipboard('VITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=')}
                  className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Copy size={14} className="mr-1" />
                  Copiar template
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">2. Obtenha as credenciais</h4>
                <p className="text-green-800 mb-2">No seu projeto Supabase:</p>
                <ul className="text-green-800 space-y-1">
                  <li>• Vá em Settings → API</li>
                  <li>• Copie a Project URL</li>
                  <li>• Copie a anon/public key</li>
                </ul>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 text-green-600 hover:text-green-800 flex items-center"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Abrir Supabase Dashboard
                </a>
              </div>
            </div>
          </Card>

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