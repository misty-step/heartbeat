import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

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

describe("Footer", () => {
  test("renders legal and contact links", () => {
    render(<Footer />);
    expect(screen.getByText("Terms")).toHaveAttribute("href", "/terms");
    expect(screen.getByText("Privacy")).toHaveAttribute("href", "/privacy");
    expect(screen.getByText("Contact")).toHaveAttribute(
      "href",
      "mailto:hello@mistystep.io",
    );
  });

  test("shows attribution with correct year and linked company name", () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Misty Step" });
    expect(link).toHaveAttribute("href", "https://mistystep.io");
  });
});
