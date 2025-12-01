import { test, expect, describe, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  test('renders toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle theme' });
    expect(button).toBeDefined();
  });

  test('toggles theme on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle theme' });
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  test('renders with correct aria-label', () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Toggle theme')).toBeDefined();
  });
});
