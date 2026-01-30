import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeUpgradePrompt } from "@/components/ThemeUpgradePrompt";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const posthogMocks = vi.hoisted(() => ({
  capture: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => posthogMocks,
}));

describe("ThemeUpgradePrompt", () => {
  const onKeepCurrent = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders prompt and tracks shown event", () => {
    render(
      <ThemeUpgradePrompt
        themeId="ukiyo"
        onKeepCurrent={onKeepCurrent}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Ukiyo Refined looks great!/i }),
    ).toBeInTheDocument();
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "theme_upgrade_prompt_shown",
      {
        theme_id: "ukiyo",
        theme_name: "Ukiyo Refined",
      },
    );
  });

  test("tracks upgrade and navigates to billing", () => {
    render(
      <ThemeUpgradePrompt
        themeId="ukiyo"
        onKeepCurrent={onKeepCurrent}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /upgrade to vital/i }));

    expect(posthogMocks.capture).toHaveBeenCalledWith("theme_upgrade_clicked", {
      theme_id: "ukiyo",
      theme_name: "Ukiyo Refined",
    });
    expect(routerMocks.push).toHaveBeenCalledWith(
      "/dashboard/settings/billing?theme=ukiyo",
    );
    expect(onClose).toHaveBeenCalled();
  });

  test("keeps current theme from buttons and escape", () => {
    render(
      <ThemeUpgradePrompt
        themeId="ukiyo"
        onKeepCurrent={onKeepCurrent}
        onClose={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /keep current theme/i }),
    );
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "theme_upgrade_dismissed",
      {
        theme_id: "ukiyo",
        theme_name: "Ukiyo Refined",
      },
    );
    expect(onKeepCurrent).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Close"));
    expect(onKeepCurrent).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onKeepCurrent).toHaveBeenCalledTimes(3);
  });

  test("handles backdrop click only on the backdrop", () => {
    const { container } = render(
      <ThemeUpgradePrompt
        themeId="ukiyo"
        onKeepCurrent={onKeepCurrent}
        onClose={onClose}
      />,
    );

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onKeepCurrent).toHaveBeenCalledTimes(1);

    const card = container.querySelector(".max-w-md") as HTMLElement;
    fireEvent.click(card);
    expect(onKeepCurrent).toHaveBeenCalledTimes(1);
  });
});
