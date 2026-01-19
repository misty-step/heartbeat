import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("HomePage", () => {
  test("shows hero headline and primary CTA", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Heartbeat",
    );
    expect(screen.getByRole("link", { name: /Start Free/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  test("includes footer metadata", () => {
    render(<HomePage />);
    expect(screen.getByText("© 2025 Misty Step")).toBeInTheDocument();
  });
});
