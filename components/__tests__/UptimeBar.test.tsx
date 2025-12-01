import { test, expect, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UptimeBarSimple } from '../UptimeBar';

describe('UptimeBarSimple', () => {
  test('renders correct number of bars for default days (30)', () => {
    const { container } = render(<UptimeBarSimple percentage={100} />);
    const bars = container.querySelectorAll('.flex-1.h-6');
    expect(bars.length).toBe(30);
  });

  test('renders correct number of bars for custom days', () => {
    const { container } = render(<UptimeBarSimple percentage={100} days={7} />);
    const bars = container.querySelectorAll('.flex-1.h-6');
    expect(bars.length).toBe(7);
  });

  test('fills all bars when percentage is 100', () => {
    const { container } = render(<UptimeBarSimple percentage={100} days={10} />);
    const filledBars = container.querySelectorAll('.bg-foreground:not(.bg-foreground\\/10)');
    expect(filledBars.length).toBe(10);
  });

  test('fills no bars when percentage is 0', () => {
    const { container } = render(<UptimeBarSimple percentage={0} days={10} />);
    const emptyBars = container.querySelectorAll('.bg-foreground\\/10');
    expect(emptyBars.length).toBe(10);
  });

  test('fills half bars when percentage is 50', () => {
    const { container } = render(<UptimeBarSimple percentage={50} days={10} />);
    const allBars = container.querySelectorAll('.flex-1.h-6');
    const filledCount = Array.from(allBars).filter(
      bar => bar.className.includes('bg-foreground') && !bar.className.includes('bg-foreground/10')
    ).length;
    expect(filledCount).toBe(5);
  });

  test('shows date labels', () => {
    render(<UptimeBarSimple percentage={100} days={30} />);
    expect(screen.getByText('30 days ago')).toBeDefined();
    expect(screen.getByText('Today')).toBeDefined();
  });

  test('shows correct date label for custom days', () => {
    render(<UptimeBarSimple percentage={100} days={7} />);
    expect(screen.getByText('7 days ago')).toBeDefined();
    expect(screen.getByText('Today')).toBeDefined();
  });
});
