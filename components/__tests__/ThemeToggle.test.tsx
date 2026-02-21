import { test, expect, describe, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

// Mock next-themes with configurable theme
const mockSetTheme = vi.fn();
let currentTheme = "light";
vi.mock("next-themes", () => ({
  useTheme: () => ({
    get theme() {
      return currentTheme;
    },
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    currentTheme = "light";
  });

  test("renders toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle theme" });
    expect(button).toBeDefined();
  });

  test("toggles from light to dark on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle theme" });
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  test("toggles from dark to light on click", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle theme" });
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  test("renders with correct aria-label", () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText("Toggle theme")).toBeDefined();
  });
});
