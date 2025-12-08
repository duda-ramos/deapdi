import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { TextEncoder, TextDecoder } from 'util';

// Extend Jest matchers with accessibility testing matchers
expect.extend(toHaveNoViolations);

// Polyfills -----------------------------------------------------------------

// TextEncoder/TextDecoder for react-router-dom
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock import.meta.env
const mockEnv = {
  DEV: false,
  PROD: true,
  MODE: 'test',
  VITE_ENABLE_RATE_LIMITING: 'false',
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key'
};

// @ts-ignore
global.import = {
  meta: {
    env: mockEnv
  }
};

// Shared mocks --------------------------------------------------------------

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    }
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock as unknown as Storage,
  configurable: true
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn()
  },
  configurable: true
});

// Mock Supabase -------------------------------------------------------------

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn()
  }))
};

const mockInitializeSupabaseClient = jest.fn();

jest.mock('./lib/supabase', () => ({
  __esModule: true,
  supabase: mockSupabase,
  initializeSupabaseClient: mockInitializeSupabaseClient
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
} as any;