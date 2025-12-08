import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Parse a .env file and return an object with the key-value pairs
 */
const parseEnvFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }
      
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
    
    return env;
  } catch {
    return {};
  }
};

/**
 * Load environment variables from .env files.
 * Priority order (later files override earlier ones, process.env takes highest priority):
 * 1. .env
 * 2. .env.local
 * 3. .env.production (fallback for production setups)
 * 4. process.env (highest priority - allows manual overrides)
 */
const loadEnvVariables = () => {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
  ];
  
  let combined = {};
  
  for (const file of envFiles) {
    const filePath = path.join(projectRoot, file);
    const parsed = parseEnvFile(filePath);
    combined = { ...combined, ...parsed };
  }
  
  // Process.env takes highest priority (allows manual overrides)
  return {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || combined.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || combined.VITE_SUPABASE_ANON_KEY,
  };
};

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = loadEnvVariables();

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!VITE_SUPABASE_URL) {
  fail('Health Check Failed: VITE_SUPABASE_URL is not set. Please ensure a .env, .env.local, or .env.production file exists with this variable.');
}

if (!VITE_SUPABASE_ANON_KEY) {
  fail('Health Check Failed: VITE_SUPABASE_ANON_KEY is not set. Please ensure a .env, .env.local, or .env.production file exists with this variable.');
}

const healthEndpoint = `${VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/health_check`;

const isHealthyStatus = (status) => {
  if (typeof status !== 'string') return false;
  const normalized = status.toLowerCase();
  return normalized === 'healthy' || normalized === 'ok' || normalized === 'up';
};

const run = async () => {
  try {
    const response = await fetch(healthEndpoint, {
      method: 'POST',
      headers: {
        apikey: VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      fail(`Health Check Failed: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!isHealthyStatus(data?.status)) {
      fail(`Health Check Failed: status=${data?.status ?? 'unknown'}`);
    }

    console.log('Health Check Passed:', data.status);
    process.exit(0);
  } catch (error) {
    fail(`Health Check Failed: ${error.message}`);
  }
};

run();
