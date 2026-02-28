import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import HomePage from "../page";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock convex/react — page.tsx uses useAction and useConvexAuth
vi.mock("convex/react", () => ({
  useAction: () => vi.fn(),
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: false }),
}));

// Mock framer-motion to avoid JSDOM issues with animation APIs
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
    nav: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <nav {...props}>{children}</nav>,
    section: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <section {...props}>{children}</section>,
  },
  useReducedMotion: () => false,
}));

describe("HomePage - Bento Zen Landing", () => {
  test("renders hero section with main headline", () => {
    render(<HomePage />);
    // The h1 contains structured headline text
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Know before/);
    expect(heading).toHaveTextContent(/your users/);
    expect(heading).toHaveTextContent(/do\./);
  });

  test("displays truthful trial messaging - no false 'free forever' claims", () => {
    render(<HomePage />);
    // Should show 14-day trial, not "free forever" or "free tier"
    expect(screen.getAllByText(/Start 14-Day Trial/i).length).toBeGreaterThan(0);
    // Multiple elements may contain "14-day free trial" copy
    expect(screen.getAllByText(/14-day free trial/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Plans from \$9\/mo after trial/i).length,
    ).toBeGreaterThan(0);
  });

  test("primary CTA links to sign-up page", () => {
    render(<HomePage />);
    const trialLinks = screen.getAllByRole("link", {
      name: /Start 14-Day Trial/i,
    });
    expect(trialLinks.length).toBeGreaterThan(0);
    expect(trialLinks[0]).toHaveAttribute("href", "/sign-up");
  });

  test("navigation includes sign-in link", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /Sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("displays key product stats in trust bar", () => {
    render(<HomePage />);
    expect(screen.getAllByText("3 min").length).toBeGreaterThan(0);
    expect(screen.getAllByText("<30s").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3×").length).toBeGreaterThan(0);
    expect(screen.getAllByText("30–90d").length).toBeGreaterThan(0);
  });

  test("features section renders all bento cards", () => {
    render(<HomePage />);
    expect(screen.getAllByText("Always watching").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Zero false alarms").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Keep users informed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Full check history").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Down in seconds").length).toBeGreaterThan(0);
  });

  test("includes footer with correct year and company", () => {
    render(<HomePage />);
    // Year and company name may be split across elements (year + linked company)
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Misty Step" })).toBeInTheDocument();
  });

  test("footer contains essential navigation links", () => {
    render(<HomePage />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    // Check footer-specific links using within()
    const footerDashboardLink = within(footer).getByRole("link", {
      name: "Dashboard",
    });
    expect(footerDashboardLink).toHaveAttribute("href", "/dashboard");

    // Pricing in the landing page footer is an anchor link to the pricing section
    const footerPricingLink = within(footer).getByRole("link", {
      name: "Pricing",
    });
    expect(footerPricingLink).toHaveAttribute("href", "#pricing");

    const footerTermsLink = within(footer).getByRole("link", { name: "Terms" });
    expect(footerTermsLink).toHaveAttribute("href", "/terms");

    const footerPrivacyLink = within(footer).getByRole("link", {
      name: "Privacy",
    });
    expect(footerPrivacyLink).toHaveAttribute("href", "/privacy");
  });
});
