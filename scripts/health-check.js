import process from 'node:process';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!VITE_SUPABASE_URL) {
  fail('Health Check Failed: VITE_SUPABASE_URL is not set.');
}

if (!VITE_SUPABASE_ANON_KEY) {
  fail('Health Check Failed: VITE_SUPABASE_ANON_KEY is not set.');
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
