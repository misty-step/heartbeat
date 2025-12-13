import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotFound from "../not-found";

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

describe("NotFound", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders StatusIndicator with down status", () => {
    const { container } = render(<NotFound />);
    const downIndicator = container.querySelector(".bg-down");
    expect(downIndicator).toBeInTheDocument();
  });

  it("has link to home page", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /Return Home/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
