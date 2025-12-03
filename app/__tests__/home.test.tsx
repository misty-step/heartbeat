import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('HomePage', () => {
  test('shows hero copy and primary CTA', () => {
    render(<HomePage />);
    expect(screen.getByText(/Your infrastructure,/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start Monitoring/i })).toHaveAttribute('href', '/dashboard');
  });

  test('includes footer metadata', () => {
    render(<HomePage />);
    expect(screen.getByText('© 2025 Heartbeat')).toBeInTheDocument();
  });
});
