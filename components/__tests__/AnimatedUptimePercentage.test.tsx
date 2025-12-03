import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedUptimePercentage } from '../AnimatedUptimePercentage';

// Force scroll animation hook to report visible so the counter runs immediately
vi.mock('@/hooks/useScrollAnimation', () => ({
  useScrollAnimation: () => ({ ref: { current: null }, isVisible: true }),
}));

describe('AnimatedUptimePercentage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('applies cyan glow for ≥99.9%', async () => {
    render(<AnimatedUptimePercentage percentage={99.95} totalChecks={10} failedChecks={0} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    const value = await screen.findByText((text) => text.includes('99.95%'));
    expect(value.className).toContain('text-gradient-cyan');
    expect(value.className).toContain('shadow-glow-cyan');
  });

  test('uses success color for ≥99%', async () => {
    render(<AnimatedUptimePercentage percentage={99.1} totalChecks={10} failedChecks={0} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect((await screen.findByText((text) => text.includes('99.10%'))).className).toContain('text-success');
  });

  test('uses degraded color between 95% and 99%', async () => {
    render(<AnimatedUptimePercentage percentage={96} totalChecks={10} failedChecks={1} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect((await screen.findByText((text) => text.includes('96.00%'))).className).toContain('text-degraded');
  });

  test('uses down color below 95%', async () => {
    render(<AnimatedUptimePercentage percentage={80} totalChecks={10} failedChecks={2} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect((await screen.findByText((text) => text.includes('80.00%'))).className).toContain('text-down');
  });
});
