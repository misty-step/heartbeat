import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusHeader } from '../StatusHeader';

describe('StatusHeader', () => {
  beforeEach(() => {
    // Mock Date.now for consistent time-based tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders project name', () => {
    render(
      <StatusHeader
        overallStatus="up"
        projectName="My Project"
      />
    );
    expect(screen.getByText('My Project')).toBeDefined();
  });

  test('displays correct status message for up status', () => {
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
      />
    );
    expect(screen.getByText('All systems operational')).toBeDefined();
  });

  test('displays correct status message for degraded status', () => {
    render(
      <StatusHeader
        overallStatus="degraded"
        projectName="Test"
      />
    );
    expect(screen.getByText('Some systems experiencing issues')).toBeDefined();
  });

  test('displays correct status message for down status', () => {
    render(
      <StatusHeader
        overallStatus="down"
        projectName="Test"
      />
    );
    expect(screen.getByText('Major outage in progress')).toBeDefined();
  });

  test('displays correct status message for unknown status', () => {
    render(
      <StatusHeader
        overallStatus="unknown"
        projectName="Test"
      />
    );
    expect(screen.getByText('Status unknown')).toBeDefined();
  });

  test('formats last updated as "Just now" for recent update', () => {
    const justNow = new Date('2024-01-15T11:59:45Z'); // 15 seconds ago
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        lastUpdated={justNow}
      />
    );
    expect(screen.getByText('Last checked Just now')).toBeDefined();
  });

  test('formats last updated as "1 minute ago"', () => {
    const oneMinAgo = new Date('2024-01-15T11:59:00Z');
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        lastUpdated={oneMinAgo}
      />
    );
    expect(screen.getByText('Last checked 1 minute ago')).toBeDefined();
  });

  test('formats last updated as "X minutes ago"', () => {
    const fiveMinsAgo = new Date('2024-01-15T11:55:00Z');
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        lastUpdated={fiveMinsAgo}
      />
    );
    expect(screen.getByText('Last checked 5 minutes ago')).toBeDefined();
  });

  test('formats last updated as "1 hour ago"', () => {
    const oneHourAgo = new Date('2024-01-15T11:00:00Z');
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        lastUpdated={oneHourAgo}
      />
    );
    expect(screen.getByText('Last checked 1 hour ago')).toBeDefined();
  });

  test('formats last updated as "X hours ago"', () => {
    const threeHoursAgo = new Date('2024-01-15T09:00:00Z');
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        lastUpdated={threeHoursAgo}
      />
    );
    expect(screen.getByText('Last checked 3 hours ago')).toBeDefined();
  });

  test('does not show last updated when not provided', () => {
    render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
      />
    );
    expect(screen.queryByText(/Last checked/)).toBeNull();
  });

  test('applies sticky classes when sticky=true', () => {
    const { container } = render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        sticky={true}
      />
    );
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv.className).toContain('sticky');
    expect(headerDiv.className).toContain('top-0');
  });

  test('does not apply sticky classes when sticky=false', () => {
    const { container } = render(
      <StatusHeader
        overallStatus="up"
        projectName="Test"
        sticky={false}
      />
    );
    const headerDiv = container.firstChild as HTMLElement;
    expect(headerDiv.className).not.toContain('sticky');
  });
});
