import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("useUnsavedChangesWarning", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let docAddEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let docRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    docAddEventListenerSpy = vi.spyOn(document, "addEventListener");
    docRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- beforeunload (browser unload guard) ---

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

  // --- document click interceptor (in-app navigation guard) ---

  test("does not add document click interceptor when hasChanges is false", () => {
    renderHook(() => useUnsavedChangesWarning(false));

    const clickCalls = docAddEventListenerSpy.mock.calls.filter(
      ([event]) => event === "click",
    );
    expect(clickCalls).toHaveLength(0);
  });

  test("adds document click interceptor when hasChanges is true", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    const clickCalls = docAddEventListenerSpy.mock.calls.filter(
      ([event]) => event === "click",
    );
    expect(clickCalls).toHaveLength(1);
    // Must be capture phase so it fires before Link's own onClick
    expect(clickCalls[0][2]).toBe(true);
  });

  test("removes document click interceptor on cleanup", () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));
    unmount();

    const clickCalls = docRemoveEventListenerSpy.mock.calls.filter(
      ([event]) => event === "click",
    );
    expect(clickCalls).toHaveLength(1);
  });

  // --- pendingNavigation state ---

  test("pendingNavigation is null initially", () => {
    const { result } = renderHook(() => useUnsavedChangesWarning(true));
    expect(result.current.pendingNavigation).toBeNull();
  });

  test("sets pendingNavigation when an internal link is clicked with hasChanges=true", () => {
    // Restore actual document.addEventListener so the click handler runs
    vi.restoreAllMocks();

    const { result } = renderHook(() => useUnsavedChangesWarning(true));

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/dashboard");
    document.body.appendChild(anchor);

    act(() => {
      anchor.click();
    });

    expect(result.current.pendingNavigation).toBe("/dashboard");

    document.body.removeChild(anchor);
  });

  test("does not set pendingNavigation for external links", () => {
    vi.restoreAllMocks();

    const { result } = renderHook(() => useUnsavedChangesWarning(true));

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "https://example.com");
    document.body.appendChild(anchor);

    act(() => {
      anchor.click();
    });

    expect(result.current.pendingNavigation).toBeNull();

    document.body.removeChild(anchor);
  });

  test("cancelNavigation clears pendingNavigation", () => {
    vi.restoreAllMocks();

    const { result } = renderHook(() => useUnsavedChangesWarning(true));

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/dashboard");
    document.body.appendChild(anchor);

    act(() => {
      anchor.click();
    });
    expect(result.current.pendingNavigation).toBe("/dashboard");

    act(() => {
      result.current.cancelNavigation();
    });
    expect(result.current.pendingNavigation).toBeNull();

    document.body.removeChild(anchor);
  });

  test("confirmNavigation calls router.push and navigates to pending href", () => {
    vi.restoreAllMocks();

    const { result } = renderHook(() => useUnsavedChangesWarning(true));

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/dashboard");
    document.body.appendChild(anchor);

    act(() => {
      anchor.click();
    });

    act(() => {
      result.current.confirmNavigation();
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard");

    document.body.removeChild(anchor);
  });

  test("pendingNavigation cleared when hasChanges becomes false", () => {
    vi.restoreAllMocks();

    const { result, rerender } = renderHook(
      ({ hasChanges }: { hasChanges: boolean }) =>
        useUnsavedChangesWarning(hasChanges),
      { initialProps: { hasChanges: true } },
    );

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/dashboard");
    document.body.appendChild(anchor);

    act(() => {
      anchor.click();
    });
    expect(result.current.pendingNavigation).toBe("/dashboard");

    act(() => {
      rerender({ hasChanges: false });
    });
    expect(result.current.pendingNavigation).toBeNull();

    document.body.removeChild(anchor);
  });
});
