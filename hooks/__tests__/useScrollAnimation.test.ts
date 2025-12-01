import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollAnimation } from '../useScrollAnimation';

// Store the callback for triggering intersections
let intersectionCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

// Create a proper mock class for IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
    intersectionCallback = callback;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

describe('useScrollAnimation', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    mockObserve.mockClear();
    mockUnobserve.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns ref and isVisible state', () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });

  test('starts with isVisible false', () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current.isVisible).toBe(false);
  });

  test('sets isVisible to true when element intersects', () => {
    const { result } = renderHook(() => useScrollAnimation());

    const mockElement = document.createElement('div');
    // @ts-expect-error - Setting ref.current manually for testing
    result.current.ref.current = mockElement;

    // Simulate intersection
    act(() => {
      intersectionCallback(
        [{ isIntersecting: true, target: mockElement } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(true);
  });

  test('does not change isVisible on non-intersecting entry', () => {
    const { result } = renderHook(() => useScrollAnimation());

    const mockElement = document.createElement('div');
    // @ts-expect-error - Setting ref.current manually for testing
    result.current.ref.current = mockElement;

    act(() => {
      intersectionCallback(
        [{ isIntersecting: false, target: mockElement } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(false);
  });

  test('accepts custom threshold parameter', () => {
    const { result } = renderHook(() => useScrollAnimation(0.5));
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });

  test('accepts custom rootMargin parameter', () => {
    const { result } = renderHook(() => useScrollAnimation(0.1, '10px'));
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });
});
