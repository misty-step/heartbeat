import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StatusPagePreviewBanner } from "@/components/StatusPagePreviewBanner";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

const mutationMocks = vi.hoisted(() => ({
  updateMonitor: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    monitors: {
      update: "monitors.update",
    },
  },
}));

const mockUseMutation = vi.mocked(useMutation);

const monitorId = "monitor_1" as Id<"monitors">;

describe("StatusPagePreviewBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mutationMocks.updateMonitor);
  });

  test("renders theme and vital badge for premium theme", () => {
    render(
      <StatusPagePreviewBanner
        themeId="ukiyo"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    expect(screen.getAllByText("Ukiyo Refined").length).toBeGreaterThan(0);
    expect(screen.getByText("VITAL")).toBeInTheDocument();
  });

  test("navigates to previous theme with wraparound", () => {
    render(
      <StatusPagePreviewBanner
        themeId="glass"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    fireEvent.click(screen.getByLabelText("Previous theme"));
    expect(routerMocks.replace).toHaveBeenCalledWith(
      "/status/alpha?preview=mission-control",
    );
  });

  test("navigates to next theme with wraparound", () => {
    render(
      <StatusPagePreviewBanner
        themeId="mission-control"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    fireEvent.click(screen.getByLabelText("Next theme"));
    expect(routerMocks.replace).toHaveBeenCalledWith(
      "/status/alpha?preview=glass",
    );
  });

  test("switches theme from quick access pills", () => {
    render(
      <StatusPagePreviewBanner
        themeId="glass"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    fireEvent.click(screen.getByTitle("Blueprint"));
    expect(routerMocks.replace).toHaveBeenCalledWith(
      "/status/alpha?preview=blueprint",
    );
  });

  test("applies theme and exits preview on success", async () => {
    let resolvePromise: (() => void) | undefined;
    const applyPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mutationMocks.updateMonitor.mockReturnValueOnce(applyPromise);

    render(
      <StatusPagePreviewBanner
        themeId="glass"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    const applyButton = screen.getByRole("button", { name: "Apply" });
    fireEvent.click(applyButton);

    expect(mutationMocks.updateMonitor).toHaveBeenCalledWith({
      id: monitorId,
      theme: "glass",
    });
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveTextContent("Applying...");

    resolvePromise?.();

    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith("/status/alpha");
    });
  });

  test("restores state on apply error", async () => {
    const error = new Error("nope");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mutationMocks.updateMonitor.mockRejectedValueOnce(error);

    render(
      <StatusPagePreviewBanner
        themeId="glass"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    const applyButton = screen.getByRole("button", { name: "Apply" });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to apply theme:", error);
    });

    expect(routerMocks.push).not.toHaveBeenCalled();
    expect(applyButton).not.toBeDisabled();
    expect(applyButton).toHaveTextContent("Apply");

    consoleSpy.mockRestore();
  });

  test("exits preview on exit click", () => {
    render(
      <StatusPagePreviewBanner
        themeId="glass"
        monitorId={monitorId}
        statusSlug="alpha"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(routerMocks.push).toHaveBeenCalledWith("/status/alpha");
  });
});
