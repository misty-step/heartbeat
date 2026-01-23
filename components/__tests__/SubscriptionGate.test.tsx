import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionGate } from "../SubscriptionGate";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock convex/react
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock the api import
vi.mock("../../convex/_generated/api", () => ({
  api: {
    subscriptions: {
      hasActiveSubscription: "hasActiveSubscription",
    },
  },
}));

import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";

const mockUsePathname = vi.mocked(usePathname);
const mockUseConvexAuth = vi.mocked(useConvexAuth);
const mockUseQuery = vi.mocked(useQuery);

describe("SubscriptionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(true);
  });

  describe("bypass paths", () => {
    test("renders children directly for billing path", () => {
      mockUsePathname.mockReturnValue("/dashboard/settings/billing");

      render(
        <SubscriptionGate>
          <div data-testid="children">Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByTestId("children")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    test("renders children for billing subpath", () => {
      mockUsePathname.mockReturnValue("/dashboard/settings/billing/history");

      render(
        <SubscriptionGate>
          <div data-testid="children">Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByTestId("children")).toBeInTheDocument();
    });

    test("bypasses subscription check for billing path", () => {
      mockUsePathname.mockReturnValue("/dashboard/settings/billing");
      // Even with no subscription, should render children
      mockUseQuery.mockReturnValue(false);

      render(
        <SubscriptionGate>
          <div data-testid="children">Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByTestId("children")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    test("shows loading spinner when auth is loading", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("shows loading spinner when subscription check is pending", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(undefined);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("unauthenticated state", () => {
    test("shows sign in prompt when not authenticated", () => {
      // Auth check now happens BEFORE subscription query check
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(undefined); // Query skipped

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
      expect(
        screen.getByText("You need to be signed in to access the dashboard."),
      ).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("no subscription state", () => {
    test("shows upgrade prompt when subscription is inactive", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(false);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByText("Start monitoring")).toBeInTheDocument();
      expect(screen.getByText("View Plans")).toBeInTheDocument();
      expect(screen.getByText("Check billing status")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("upgrade prompt links to pricing page", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(false);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      const viewPlansLink = screen.getByText("View Plans").closest("a");
      expect(viewPlansLink).toHaveAttribute("href", "/pricing");
    });

    test("upgrade prompt links to billing page", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(false);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      const billingLink = screen.getByText("Check billing status").closest("a");
      expect(billingLink).toHaveAttribute(
        "href",
        "/dashboard/settings/billing",
      );
    });
  });

  describe("active subscription state", () => {
    test("renders children when subscription is active", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(true);

      render(
        <SubscriptionGate>
          <div data-testid="children">Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.getByTestId("children")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    test("does not show loading or upgrade prompts with active subscription", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(true);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.queryByText("View Plans")).not.toBeInTheDocument();
      expect(screen.queryByText("Sign in to continue")).not.toBeInTheDocument();
    });
  });

  describe("useQuery skip behavior", () => {
    test("skips subscription query when not authenticated", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      // useQuery should be called with "skip" when not authenticated
      expect(mockUseQuery).toHaveBeenCalledWith(
        "hasActiveSubscription",
        "skip",
      );
    });

    test("queries subscription when authenticated", () => {
      mockUseConvexAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(true);

      render(
        <SubscriptionGate>
          <div>Protected Content</div>
        </SubscriptionGate>,
      );

      // useQuery should be called with empty args when authenticated
      expect(mockUseQuery).toHaveBeenCalledWith("hasActiveSubscription", {});
    });
  });
});
