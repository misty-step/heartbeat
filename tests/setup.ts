// tests/setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock ResizeObserver which is used by Recharts and not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock SVGPathElement.getTotalLength which isn't available in JSDOM
// Used by ZenUptimeChart for path animation
if (typeof window !== "undefined" && typeof SVGElement !== "undefined") {
  Object.defineProperty(SVGElement.prototype, "getTotalLength", {
    writable: true,
    value: vi.fn(() => 100),
  });
}

// Mock Next.js useRouter and other router utilities if needed by components
// This is a minimal example, more comprehensive mocks might be needed depending on components
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    asPath: "/",
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock Clerk's useUser and useAuth for components that rely on it
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: true,
    user: {
      id: "user_test_id",
      fullName: "Test User",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: "user_test_id",
    sessionId: "session_test_id",
    getToken: vi.fn(() => Promise.resolve("mock_token")),
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
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useMutation: vi.fn(() => vi.fn()),
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
}));

// Mock next-themes for theme toggle component
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));
