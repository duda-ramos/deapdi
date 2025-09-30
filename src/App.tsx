import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

/**
 * Certifique-se de definir as variáveis de ambiente abaixo antes do build:
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_ANON_KEY
 *
 * No Vite, elas precisam começar com o prefixo `VITE_` para ficarem disponíveis em `import.meta.env`.
 * Crie/atualize o arquivo `.env` na raiz do projeto com as chaves reais do projeto Supabase
 * e reinicie o servidor de desenvolvimento para que as variáveis sejam propagadas para o cliente.
 */

const SESSION_TIMEOUT_MS = 5000;

type UiState = 'loading' | 'error' | 'unauthenticated' | 'authenticated';

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const LoginScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <main className="app-screen app-screen--login">
    <h1>Acesso necessário</h1>
    <p>Entre com suas credenciais para continuar.</p>
    <button type="button" onClick={onRetry} className="app-button">
      Recarregar status da sessão
    </button>
  </main>
);

const DashboardScreen: React.FC<{ session: Session }> = ({ session }) => (
  <main className="app-screen app-screen--dashboard">
    <h1>Dashboard</h1>
    <p>Sessão ativa para o usuário autenticado.</p>
    <dl>
      <dt>ID do usuário</dt>
      <dd>{session.user.id}</dd>
      {session.user.email ? (
        <>
          <dt>Email</dt>
          <dd>{session.user.email}</dd>
        </>
      ) : null}
    </dl>
  </main>
);

function App() {
  const [uiState, setUiState] = useState<UiState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const supabaseClient = useMemo(() => supabase, []);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      if (!supabaseClient) {
        console.error('[Auth] Supabase não foi inicializado. Verifique as variáveis de ambiente.');
        if (!isActive) return;
        setErrorMessage('Erro ao conectar. Tente novamente mais tarde.');
        setUiState('error');
        return;
      }

      setUiState('loading');
      setErrorMessage(null);

      try {
        const response = await withTimeout(
          supabaseClient.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'Tempo de resposta do Supabase excedido.'
        );

        if (!isActive) return;

        if (response.error) {
          console.error('[Auth] Erro ao obter sessão:', response.error);
          setErrorMessage('Erro ao conectar. Tente novamente mais tarde.');
          setUiState('error');
          return;
        }

        if (response.data.session) {
          setSession(response.data.session);
          setUiState('authenticated');
        } else {
          setSession(null);
          setUiState('unauthenticated');
        }
      } catch (error) {
        console.error('[Auth] Falha ao buscar sessão:', error);
        if (!isActive) return;
        setErrorMessage('Erro ao conectar. Tente novamente mais tarde.');
        setUiState('error');
      }
    };

    void loadSession();

    if (!supabaseClient) {
      return () => {
        isActive = false;
      };
    }

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      if (!isActive) return;

      if (newSession) {
        setSession(newSession);
        setUiState('authenticated');
      } else {
        setSession(null);
        setUiState('unauthenticated');
      }
    });

    return () => {
      isActive = false;
      listener?.subscription?.unsubscribe();
    };
  }, [retryCount, supabaseClient]);

  const handleRetry = () => {
    setRetryCount((current) => current + 1);
  };

  if (uiState === 'loading') {
    return (
      <main className="app-screen app-screen--loading">
        <p>Carregando...</p>
      </main>
    );
  }

  if (uiState === 'error') {
    return (
      <main className="app-screen app-screen--error">
        <p>{errorMessage ?? 'Erro ao conectar. Tente novamente mais tarde.'}</p>
        <button type="button" onClick={handleRetry} className="app-button">
          Tentar novamente
        </button>
      </main>
    );
  }

  if (uiState === 'unauthenticated') {
    return <LoginScreen onRetry={handleRetry} />;
  }

  if (!session) {
    return (
      <main className="app-screen app-screen--error">
        <p>Erro ao conectar. Tente novamente mais tarde.</p>
        <button type="button" onClick={handleRetry} className="app-button">
          Tentar novamente
        </button>
      </main>
    );
  }

  return <DashboardScreen session={session} />;
}

export default App;

/**
 * Boas práticas para ambientes Bolt.new / WebContainer:
 *
 * 1. Configure o CORS no painel do Supabase para permitir o domínio exibido pelo Bolt.new
 *    (geralmente https://<hash>.bolt.new). Sem isso, o navegador bloqueará as requisições.
 * 2. Garanta que o `.env` contenha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e que o Vite
 *    esteja lendo essas variáveis (reinicie `npm run dev` após mudanças).
 * 3. Evite operações assíncronas sem cancelamento; use `Promise.race` com timeout ou
 *    `AbortController` para impedir que promessas pendentes bloqueiem a UI caso o Supabase
 *    não responda.
 */
