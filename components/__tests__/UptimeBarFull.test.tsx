import { describe, expect, test, vi, beforeEach, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import { UptimeBar } from '../UptimeBar';
import { useQuery } from 'convex/react';

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = useQuery as unknown as Mock;

describe('UptimeBar', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  test('shows loading skeleton while stats are loading', () => {
    mockUseQuery.mockReturnValue(undefined);
    const { container } = render(<UptimeBar monitorId={'monitor-1' as any} days={5} />);
    const placeholders = container.querySelectorAll('.animate-pulse');
    expect(placeholders.length).toBe(5);
  });

  test('renders bars for degraded uptime', () => {
    mockUseQuery.mockReturnValue({ uptimePercentage: 95, failedChecks: 1 });
    const { container } = render(<UptimeBar monitorId={'monitor-2' as any} days={4} />);
    const bars = container.querySelectorAll('.flex-1.h-6');
    expect(bars.length).toBe(4);
    // Last bar should reflect a failed check (down state)
    expect((bars[bars.length - 1] as HTMLElement).className).toContain('bg-down');
  });

  test('marks all bars down when uptime is poor', () => {
    mockUseQuery.mockReturnValue({ uptimePercentage: 20, failedChecks: 4 });
    const { container } = render(<UptimeBar monitorId={'monitor-3' as any} days={4} />);
    const bars = Array.from(container.querySelectorAll('.flex-1.h-6'));
    // With failedChecks equal to days, every bar should be down-colored
    bars.forEach((bar) => {
      expect((bar as HTMLElement).className).toContain('bg-down');
    });
  });
});
