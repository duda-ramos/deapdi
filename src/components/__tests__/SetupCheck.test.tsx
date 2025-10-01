import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SetupCheck } from '../SetupCheck';
import { initializeSupabaseClient } from '../../lib/supabase';

describe('SetupCheck', () => {
  const originalFetch = global.fetch;
  const ensureEnv = () => {
    const meta = import.meta as unknown as { env: Record<string, any> | undefined };
    if (!meta.env) {
      meta.env = {};
    }
    return meta.env;
  };
  const originalEnv = { ...ensureEnv() };

  const setEnv = (overrides: Record<string, string | undefined>) => {
    const meta = import.meta as unknown as { env: Record<string, any> };
    meta.env = { ...originalEnv, ...overrides };
  };

  const getFetchMock = () => global.fetch as jest.Mock;
  const getInitializeSupabaseClientMock = () => initializeSupabaseClient as jest.MockedFunction<typeof initializeSupabaseClient>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setEnv({});
    global.fetch = jest.fn() as unknown as typeof global.fetch;
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    setEnv({});
    global.fetch = originalFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    const meta = import.meta as unknown as { env: Record<string, any> };
    meta.env = { ...originalEnv };
  });

  it('exibe configuração manual quando variáveis de ambiente estão ausentes', async () => {
    setEnv({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_ANON_KEY: undefined
    });

    render(<SetupCheck onSetupComplete={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText('URL do Supabase')).toBeInTheDocument();
      expect(screen.getByLabelText('Chave Anônima (Anon Key)')).toBeInTheDocument();
    });

    expect(getFetchMock()).not.toHaveBeenCalled();
  });

  it('realiza fluxo de sucesso realizando múltiplos fetch e inicializa Supabase', async () => {
    const url = 'https://example.supabase.co';
    const key = 'anon-key';
    setEnv({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key
    });

    const fetchMock = getFetchMock();
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({ external_email_enabled: true })
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' } as Response);

    render(<SetupCheck onSetupComplete={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('✅ Supabase Configurado!')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${url}/rest/v1/`, expect.objectContaining({ headers: expect.any(Object) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${url}/auth/v1/settings`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${url}/rest/v1/profiles?select=count&head=true`, expect.objectContaining({ method: 'HEAD' }));

    const removeItemMock = window.localStorage.removeItem as jest.Mock;
    expect(removeItemMock).toHaveBeenCalledWith('OFFLINE_MODE');

    const initializeMock = getInitializeSupabaseClientMock();
    expect(initializeMock).toHaveBeenCalledWith(true);
  });

  it.each([
    {
      status: 401,
      statusText: 'Unauthorized',
      expected: 'Chave de API inválida. Verifique se a ANON_KEY está correta.'
    },
    {
      status: 404,
      statusText: 'Not Found',
      expected: 'Projeto não encontrado. Verifique se a URL do Supabase está correta.'
    }
  ])('mapeia erro HTTP $status para mensagem amigável', async ({ status, statusText, expected }) => {
    const url = 'https://example.supabase.co';
    const key = 'anon-key';
    setEnv({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key
    });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({ ok: false, status, statusText } as Response);

    render(<SetupCheck onSetupComplete={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('apresenta mensagem de timeout quando a conexão demora demais', async () => {
    const url = 'https://example.supabase.co';
    const key = 'anon-key';
    setEnv({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key
    });

    const fetchMock = getFetchMock();
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(<SetupCheck onSetupComplete={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(screen.getByText('Connection test timed out. Please check your Supabase configuration.')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('habilita modo offline e executa callbacks ao acionar o botão', () => {
    setEnv({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_ANON_KEY: undefined
    });

    const onSetupComplete = jest.fn();
    const initializeMock = getInitializeSupabaseClientMock();

    render(<SetupCheck onSetupComplete={onSetupComplete} />);

    const offlineButton = screen.getByRole('button', { name: /Continuar em Modo Offline/i });
    fireEvent.click(offlineButton);

    const setItemMock = window.localStorage.setItem as jest.Mock;
    expect(setItemMock).toHaveBeenCalledWith('OFFLINE_MODE', 'true');
    expect(initializeMock).toHaveBeenCalledWith(true);
    expect(onSetupComplete).toHaveBeenCalled();
  });
});
