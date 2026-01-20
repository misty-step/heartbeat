import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  describe("variants", () => {
    it("renders primary variant by default", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-[var(--color-accent-primary)]");
    });

    it("renders secondary variant", () => {
      render(<Button variant="secondary">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("border");
    });

    it("renders ghost variant", () => {
      render(<Button variant="ghost">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
    });

    it("renders danger variant", () => {
      render(<Button variant="danger">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-[var(--color-status-down)]");
    });

    it("renders link variant", () => {
      render(<Button variant="link">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("sizes", () => {
    it("renders md size by default", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
    });

    it("renders sm size", () => {
      render(<Button size="sm">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
    });

    it("renders lg size", () => {
      render(<Button size="lg">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-12");
    });

    it("renders icon size", () => {
      render(<Button size="icon">X</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-10");
    });

    it("renders icon-sm size", () => {
      render(<Button size="icon-sm">X</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-8");
    });
  });

  describe("interaction", () => {
    it("handles click events", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("disables button when disabled prop is true", () => {
      render(<Button disabled>Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("disables button when loading is true", () => {
      render(<Button loading>Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("loading state", () => {
    it("shows spinner when loading", () => {
      render(<Button loading>Click me</Button>);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("svg");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("animate-spin");
    });

    it("still shows children text when loading", () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to button element", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Click me</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("className merging", () => {
    it("merges custom className with base classes", () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("inline-flex");
    });
  });
});
