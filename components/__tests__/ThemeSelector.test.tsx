import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeSelector } from "@/components/ThemeSelector";

describe("ThemeSelector", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  test("shows selected theme and vital badge for pulse tier", () => {
    render(
      <ThemeSelector value="ukiyo" onChange={onChange} userTier="pulse" />,
    );

    expect(screen.getByRole("button", { name: /Ukiyo Refined/i }));
    expect(screen.getByText("Vital")).toBeInTheDocument();
  });

  test("does not show vital badge for pulse theme", () => {
    render(
      <ThemeSelector value="glass" onChange={onChange} userTier="pulse" />,
    );

    expect(screen.queryByText("Vital")).not.toBeInTheDocument();
  });

  test("toggles listbox visibility", () => {
    render(
      <ThemeSelector value="glass" onChange={onChange} userTier="pulse" />,
    );

    const trigger = screen.getByRole("button", { name: /Kyoto Moss/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("closes listbox on escape and outside click", () => {
    render(
      <ThemeSelector value="glass" onChange={onChange} userTier="pulse" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Kyoto Moss/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Kyoto Moss/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("selects theme on click", () => {
    render(
      <ThemeSelector value="glass" onChange={onChange} userTier="pulse" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Kyoto Moss/i }));
    fireEvent.click(screen.getByRole("option", { name: /Ukiyo Refined/i }));

    expect(onChange).toHaveBeenCalledWith("ukiyo");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("selects theme via keyboard and ignores other keys", () => {
    render(
      <ThemeSelector value="glass" onChange={onChange} userTier="pulse" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Kyoto Moss/i }));
    const option = screen.getByRole("option", { name: /Memphis Pop/i });

    fireEvent.keyDown(option, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(option, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("memphis");

    fireEvent.click(screen.getByRole("button", { name: /Kyoto Moss/i }));
    const spaceOption = screen.getByRole("option", { name: /Blueprint/i });
    fireEvent.keyDown(spaceOption, { key: " " });
    expect(onChange).toHaveBeenCalledWith("blueprint");
  });
});
