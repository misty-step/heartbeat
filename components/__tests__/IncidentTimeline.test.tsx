import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentTimeline } from '../IncidentTimeline';

describe('IncidentTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows empty state when no incidents', () => {
    render(<IncidentTimeline incidents={[]} />);
    expect(screen.getByText('No incidents to display')).toBeDefined();
  });

  test('renders incident title', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'API is down',
          status: 'investigating',
          startedAt: new Date('2024-01-15T10:00:00Z'),
        }]}
      />
    );
    expect(screen.getByText('API is down')).toBeDefined();
  });

  test('shows Incident History heading when incidents exist', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date(),
        }]}
      />
    );
    expect(screen.getByText('Incident History')).toBeDefined();
  });

  test('displays investigating status with correct label', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date(),
        }]}
      />
    );
    expect(screen.getByText('Investigating')).toBeDefined();
  });

  test('displays identified status with correct label', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'identified',
          startedAt: new Date(),
        }]}
      />
    );
    expect(screen.getByText('Identified')).toBeDefined();
  });

  test('displays monitoring status with correct label', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'monitoring',
          startedAt: new Date(),
        }]}
      />
    );
    expect(screen.getByText('Monitoring')).toBeDefined();
  });

  test('displays resolved status with correct label', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'resolved',
          startedAt: new Date('2024-01-15T10:00:00Z'),
          resolvedAt: new Date('2024-01-15T11:00:00Z'),
        }]}
      />
    );
    expect(screen.getByText('Resolved')).toBeDefined();
  });

  test('calculates duration in minutes correctly', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date('2024-01-15T11:45:00Z'), // 15 mins ago
        }]}
      />
    );
    expect(screen.getByText('15m')).toBeDefined();
  });

  test('calculates duration in hours correctly', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date('2024-01-15T10:00:00Z'), // 2 hours ago
        }]}
      />
    );
    expect(screen.getByText('2h')).toBeDefined();
  });

  test('calculates duration in hours and minutes', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date('2024-01-15T09:30:00Z'), // 2h 30m ago
        }]}
      />
    );
    expect(screen.getByText('2h 30m')).toBeDefined();
  });

  test('shows resolved time for resolved incidents', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'resolved',
          startedAt: new Date('2024-01-15T10:00:00Z'),
          resolvedAt: new Date('2024-01-15T11:00:00Z'),
        }]}
      />
    );
    // Duration should be 1h (between started and resolved)
    expect(screen.getByText('1h')).toBeDefined();
  });

  test('renders incident updates', () => {
    render(
      <IncidentTimeline
        incidents={[{
          id: '1',
          title: 'Test',
          status: 'investigating',
          startedAt: new Date(),
          updates: [
            {
              message: 'We are investigating the issue',
              timestamp: new Date(),
            },
          ],
        }]}
      />
    );
    expect(screen.getByText('We are investigating the issue')).toBeDefined();
  });

  test('renders multiple incidents', () => {
    render(
      <IncidentTimeline
        incidents={[
          {
            id: '1',
            title: 'First incident',
            status: 'resolved',
            startedAt: new Date('2024-01-14T10:00:00Z'),
            resolvedAt: new Date('2024-01-14T11:00:00Z'),
          },
          {
            id: '2',
            title: 'Second incident',
            status: 'investigating',
            startedAt: new Date('2024-01-15T10:00:00Z'),
          },
        ]}
      />
    );
    expect(screen.getByText('First incident')).toBeDefined();
    expect(screen.getByText('Second incident')).toBeDefined();
  });
});
