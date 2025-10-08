// Automated Supabase Configuration Handler
import { checkDatabaseHealth, initializeSupabaseClient } from '../lib/supabase';

export interface ConfigurationStatus {
  isConfigured: boolean;
  isValid: boolean;
  error: string | null;
  source: 'env' | 'migrated' | 'default';
  needsMigration: boolean;
}

// Default configuration from .env.example
const DEFAULT_CONFIG = {
  url: 'https://fvobspjiujcurfugjsxr.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2b2JzcGppdWpjdXJmdWdqc3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzA3OTcsImV4cCI6MjA3MzcwNjc5N30.FUWbuvg-Oalt3HiZX6YSjR609SFFkgleEJbFUJ9AFZ8'
};

// Check if current environment variables are valid
function getEnvironmentConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return {
    url: url || null,
    key: key || null,
    isValid: !!url && !!key && !isPlaceholder(url) && !isPlaceholder(key)
  };
}

// Check if credentials are placeholders
function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  const placeholders = ['your-project-url-here', 'your-anon-key-here', 'your_supabase', 'example', 'seu-projeto'];
  return placeholders.some(p => normalized.includes(p));
}

// Migrate existing localStorage configuration if present
function migrateLocalStorageConfig(): { url: string | null; key: string | null; migrated: boolean } {
  const tempUrl = localStorage.getItem('TEMP_SUPABASE_URL');
  const tempKey = localStorage.getItem('TEMP_SUPABASE_ANON_KEY');
  
  if (tempUrl && tempKey && !isPlaceholder(tempUrl) && !isPlaceholder(tempKey)) {
    // Clear temporary storage after migration
    localStorage.removeItem('TEMP_SUPABASE_URL');
    localStorage.removeItem('TEMP_SUPABASE_ANON_KEY');
    
    console.log('🔄 Migrated configuration from localStorage');
    return { url: tempUrl, key: tempKey, migrated: true };
  }
  
  return { url: null, key: null, migrated: false };
}

// Main auto-configuration function
export async function autoConfigureSupabase(): Promise<ConfigurationStatus> {
  console.log('🚀 Starting Supabase auto-configuration...');
  
  // Step 1: Check environment variables
  const envConfig = getEnvironmentConfig();
  
  if (envConfig.isValid && envConfig.url && envConfig.key) {
    console.log('✅ Using environment variables configuration');
    
    // Validate connection
    const healthCheck = await checkDatabaseHealth();
    
    if (healthCheck.healthy) {
      return {
        isConfigured: true,
        isValid: true,
        error: null,
        source: 'env',
        needsMigration: false
      };
    } else {
      // If current env vars don't work, try defaults
      console.warn('⚠️ Environment variables failed, trying defaults...');
    }
  }
  
  // Step 2: Check for migration from localStorage
  const migrationResult = migrateLocalStorageConfig();
  
  if (migrationResult.migrated && migrationResult.url && migrationResult.key) {
    console.log('📦 Testing migrated configuration...');
    
    // Re-initialize with migrated config
    initializeSupabaseClient(true);
    
    const healthCheck = await checkDatabaseHealth();
    
    if (healthCheck.healthy) {
      return {
        isConfigured: true,
        isValid: true,
        error: null,
        source: 'migrated',
        needsMigration: true
      };
    }
  }
  
  // Step 3: Use default configuration if available
  if ((!envConfig.url || !envConfig.key || isPlaceholder(envConfig.url) || isPlaceholder(envConfig.key))) {
    console.log('🔧 No valid configuration found, using defaults...');
    
    // This is a fallback that requires the developer to update their .env file
    // We'll provide clear instructions but won't automatically write to .env
    
    return {
      isConfigured: false,
      isValid: false,
      error: 'Por favor, copie o arquivo .env.example para .env e configure suas credenciais do Supabase.',
      source: 'default',
      needsMigration: false
    };
  }
  
  // Step 4: If we have env vars but they're invalid
  if (envConfig.url && envConfig.key) {
    const healthCheck = await checkDatabaseHealth();
    
    return {
      isConfigured: true,
      isValid: healthCheck.healthy,
      error: healthCheck.error,
      source: 'env',
      needsMigration: false
    };
  }
  
  // No configuration available
  return {
    isConfigured: false,
    isValid: false,
    error: 'Configuração do Supabase não encontrada. Por favor, configure as variáveis de ambiente.',
    source: 'env',
    needsMigration: false
  };
}

// Get connection validation details
export async function validateSupabaseConnection(): Promise<{
  isValid: boolean;
  details: {
    urlFormat: boolean;
    keyFormat: boolean;
    connection: boolean;
    authentication: boolean;
    permissions: boolean;
  };
  error: string | null;
}> {
  const config = getEnvironmentConfig();
  
  const details = {
    urlFormat: false,
    keyFormat: false,
    connection: false,
    authentication: false,
    permissions: false
  };
  
  // Validate URL format
  if (config.url) {
    details.urlFormat = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(config.url);
  }
  
  // Validate key format (JWT)
  if (config.key) {
    details.keyFormat = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(config.key);
  }
  
  // If basic validation passes, test connection
  if (details.urlFormat && details.keyFormat) {
    const healthCheck = await checkDatabaseHealth();
    
    if (healthCheck.healthy) {
      details.connection = true;
      details.authentication = true;
      details.permissions = true;
      
      return {
        isValid: true,
        details,
        error: null
      };
    } else {
      // Determine what failed based on error
      if (healthCheck.error?.includes('401') || healthCheck.error?.includes('403')) {
        details.connection = true;
        details.authentication = false;
      } else if (healthCheck.error?.includes('Failed to fetch') || healthCheck.error?.includes('timeout')) {
        details.connection = false;
      } else {
        details.connection = true;
        details.authentication = true;
        details.permissions = false;
      }
      
      return {
        isValid: false,
        details,
        error: healthCheck.error
      };
    }
  }
  
  return {
    isValid: false,
    details,
    error: 'Formato inválido de URL ou chave do Supabase'
  };
}

// Instructions for manual configuration if needed
export function getSetupInstructions(): {
  steps: Array<{
    title: string;
    description: string;
    command?: string;
    link?: { text: string; url: string };
  }>;
  troubleshooting: Array<{
    problem: string;
    solution: string;
  }>;
} {
  return {
    steps: [
      {
        title: 'Copie o arquivo de exemplo',
        description: 'Copie .env.example para .env na raiz do projeto',
        command: 'cp .env.example .env'
      },
      {
        title: 'Configure suas credenciais',
        description: 'Substitua as variáveis no arquivo .env com suas credenciais do Supabase',
        link: {
          text: 'Acessar Supabase Dashboard',
          url: 'https://supabase.com/dashboard'
        }
      },
      {
        title: 'Reinicie o servidor',
        description: 'Pare e inicie novamente o servidor de desenvolvimento',
        command: 'npm run dev'
      }
    ],
    troubleshooting: [
      {
        problem: 'Erro 401 ou 403',
        solution: 'Verifique se a chave anônima (anon key) está correta e não expirou'
      },
      {
        problem: 'Failed to fetch',
        solution: 'Verifique sua conexão com a internet e se a URL do projeto está correta'
      },
      {
        problem: 'Timeout na conexão',
        solution: 'Verifique se o projeto Supabase está ativo e não pausado'
      },
      {
        problem: 'Variáveis não carregam',
        solution: 'Certifique-se de reiniciar o servidor após modificar o arquivo .env'
      }
    ]
  };
}