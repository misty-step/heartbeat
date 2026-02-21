import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

describe("DeleteConfirmModal", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const monitorName = "My API";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders with monitor name in heading and body", () => {
    render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /delete monitor/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My API/)).toBeInTheDocument();
    expect(
      screen.getByText(/permanently delete all check history/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  test("calls onConfirm when Delete button is clicked", () => {
    render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("calls onCancel when Cancel button is clicked", () => {
    render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("calls onCancel on backdrop click", () => {
    const { container } = render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("calls onCancel on Escape key", () => {
    render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("shows isDeleting state when prop is true", () => {
    render(
      <DeleteConfirmModal
        monitorName={monitorName}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isDeleting
      />,
    );

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
