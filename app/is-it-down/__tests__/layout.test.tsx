import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import IsItDownLayout from "../layout";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme toggle</div>,
}));

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe("IsItDownLayout", () => {
  test("renders navigation links and sign-in action", () => {
    render(
      <IsItDownLayout>
        <div>Diagnostic body</div>
      </IsItDownLayout>,
    );

    const nav = screen.getByRole("navigation");

    expect(
      within(nav).getByRole("link", { name: "Heartbeat" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(nav).getByRole("link", { name: "Is It Down" }),
    ).toHaveAttribute("href", "/is-it-down");
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(within(nav).getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("renders children, theme toggle, and footer shell", () => {
    render(
      <IsItDownLayout>
        <section>Page payload</section>
      </IsItDownLayout>,
    );

    expect(screen.getByText("Page payload")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});
