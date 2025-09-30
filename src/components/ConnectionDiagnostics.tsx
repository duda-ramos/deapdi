import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: string;
}

export const ConnectionDiagnostics: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Check environment variables
    results.push({
      name: 'Environment Variables',
      status: 'checking',
      message: 'Checking...'
    });
    setDiagnostics([...results]);

    await new Promise(resolve => setTimeout(resolve, 500));

    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    results[0] = {
      name: 'Environment Variables',
      status: hasUrl && hasKey ? 'success' : 'error',
      message: hasUrl && hasKey ? 'Credentials found' : 'Missing credentials',
      details: `URL: ${hasUrl ? 'Present' : 'Missing'}, Key: ${hasKey ? 'Present' : 'Missing'}`
    };
    setDiagnostics([...results]);

    // 2. Check Supabase client
    results.push({
      name: 'Supabase Client',
      status: 'checking',
      message: 'Checking...'
    });
    setDiagnostics([...results]);

    await new Promise(resolve => setTimeout(resolve, 500));

    results[1] = {
      name: 'Supabase Client',
      status: supabase ? 'success' : 'error',
      message: supabase ? 'Client initialized' : 'Client is null',
      details: supabase ? 'Ready to use' : 'Check your .env file'
    };
    setDiagnostics([...results]);

    if (!supabase) {
      setIsRunning(false);
      return;
    }

    // 3. Check network connectivity
    results.push({
      name: 'Network Connectivity',
      status: 'checking',
      message: 'Testing...'
    });
    setDiagnostics([...results]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        signal: controller.signal,
        mode: 'no-cors'
      });

      clearTimeout(timeoutId);

      results[2] = {
        name: 'Network Connectivity',
        status: 'success',
        message: 'Internet connection OK'
      };
    } catch (error) {
      results[2] = {
        name: 'Network Connectivity',
        status: 'error',
        message: 'No internet connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setDiagnostics([...results]);

    // 4. Check Supabase URL reachability
    results.push({
      name: 'Supabase URL',
      status: 'checking',
      message: 'Testing...'
    });
    setDiagnostics([...results]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      results[3] = {
        name: 'Supabase URL',
        status: response.ok || response.status === 404 ? 'success' : 'error',
        message: response.ok || response.status === 404 ? 'Supabase reachable' : `HTTP ${response.status}`,
        details: `Status: ${response.status}`
      };
    } catch (error) {
      results[3] = {
        name: 'Supabase URL',
        status: 'error',
        message: 'Cannot reach Supabase',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setDiagnostics([...results]);

    // 5. Test database query
    results.push({
      name: 'Database Query',
      status: 'checking',
      message: 'Testing...'
    });
    setDiagnostics([...results]);

    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      results[4] = {
        name: 'Database Query',
        status: !error || error.code === 'PGRST116' ? 'success' : 'error',
        message: !error || error.code === 'PGRST116' ? 'Database accessible' : 'Query failed',
        details: error ? `${error.code}: ${error.message}` : 'Query executed successfully'
      };
    } catch (error) {
      results[4] = {
        name: 'Database Query',
        status: 'error',
        message: 'Database error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setDiagnostics([...results]);

    // 6. Test Auth API
    results.push({
      name: 'Auth API',
      status: 'checking',
      message: 'Testing...'
    });
    setDiagnostics([...results]);

    try {
      const { data, error } = await supabase.auth.getSession();

      results[5] = {
        name: 'Auth API',
        status: !error ? 'success' : 'error',
        message: !error ? 'Auth API working' : 'Auth API error',
        details: error ? error.message : 'API is functional'
      };
    } catch (error) {
      results[5] = {
        name: 'Auth API',
        status: 'error',
        message: 'Auth API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setDiagnostics([...results]);

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader className="animate-spin text-blue-500" size={20} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
    }
  };

  const allSuccess = diagnostics.length > 0 && diagnostics.every(d => d.status === 'success');
  const hasErrors = diagnostics.some(d => d.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h2>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={isRunning ? 'animate-spin' : ''} size={16} />
            <span className="ml-2">Retry</span>
          </Button>
        </div>

        <div className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(diagnostic.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {diagnostic.name}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    diagnostic.status === 'success' ? 'bg-green-100 text-green-800' :
                    diagnostic.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {diagnostic.status === 'checking' ? 'Checking' :
                     diagnostic.status === 'success' ? 'OK' : 'Failed'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {diagnostic.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isRunning && (
          <div className="mt-6 p-4 rounded-lg bg-gray-100">
            {allSuccess ? (
              <div className="flex items-center text-green-700">
                <CheckCircle className="mr-2" size={20} />
                <span className="font-medium">All systems operational</span>
              </div>
            ) : hasErrors ? (
              <div>
                <div className="flex items-center text-red-700 mb-2">
                  <AlertCircle className="mr-2" size={20} />
                  <span className="font-medium">Connection issues detected</span>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Please check the failed items above. Common solutions:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Verify your .env file has correct Supabase credentials</li>
                  <li>Check your internet connection</li>
                  <li>Ensure Supabase project is active and not paused</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {onClose && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};