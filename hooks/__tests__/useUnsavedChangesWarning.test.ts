import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChangesWarning } from "../useUnsavedChangesWarning";

describe("useUnsavedChangesWarning", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does not add beforeunload listener when hasChanges is false", () => {
    renderHook(() => useUnsavedChangesWarning(false));

    const calls = addEventListenerSpy.mock.calls.filter(
      ([event]) => event === "beforeunload",
    );
    expect(calls).toHaveLength(0);
  });

  test("adds beforeunload listener when hasChanges is true", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    const calls = addEventListenerSpy.mock.calls.filter(
      ([event]) => event === "beforeunload",
    );
    expect(calls).toHaveLength(1);
  });

  test("removes beforeunload listener on cleanup when hasChanges is true", () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));
    unmount();

    const calls = removeEventListenerSpy.mock.calls.filter(
      ([event]) => event === "beforeunload",
    );
    expect(calls).toHaveLength(1);
  });

  test("removes listener and does not re-add when hasChanges changes from true to false", () => {
    const { rerender } = renderHook(
      ({ hasChanges }: { hasChanges: boolean }) =>
        useUnsavedChangesWarning(hasChanges),
      { initialProps: { hasChanges: true } },
    );

    // Confirm listener was added
    expect(
      addEventListenerSpy.mock.calls.filter(([e]) => e === "beforeunload"),
    ).toHaveLength(1);

    // Clear spy counts and toggle off
    addEventListenerSpy.mockClear();
    removeEventListenerSpy.mockClear();

    act(() => {
      rerender({ hasChanges: false });
    });

    // Old listener removed, no new listener added
    expect(
      removeEventListenerSpy.mock.calls.filter(([e]) => e === "beforeunload"),
    ).toHaveLength(1);
    expect(
      addEventListenerSpy.mock.calls.filter(([e]) => e === "beforeunload"),
    ).toHaveLength(0);
  });

  test("beforeunload handler calls preventDefault and sets returnValue", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    const [, handler] = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "beforeunload",
    ) as [string, EventListener];

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: "",
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalledOnce();
    expect(mockEvent.returnValue).toBe("");
  });
});
