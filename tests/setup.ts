// tests/setup.ts
import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by Recharts and not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js useRouter and other router utilities if needed by components
// This is a minimal example, more comprehensive mocks might be needed depending on components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    asPath: '/',
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Clerk's useUser and useAuth for components that rely on it
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: true,
    user: {
      id: 'user_test_id',
      fullName: 'Test User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'user_test_id',
    sessionId: 'session_test_id',
    getToken: jest.fn(() => Promise.resolve('mock_token')),
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
  SignInButton: () => null,
  SignUpButton: () => null,
  RedirectToSignIn: () => null,
}));

// Mock Convex hooks if needed by components
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => ({ data: [], isLoading: false })),
  useMutation: jest.fn(() => jest.fn()),
  useConvexAuth: jest.fn(() => ({ isAuthenticated: true, isLoading: false })),
}));

// Mock next-themes for theme toggle component
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));