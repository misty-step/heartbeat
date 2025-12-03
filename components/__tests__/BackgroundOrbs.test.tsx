import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { BackgroundOrbs } from '../BackgroundOrbs';

describe('BackgroundOrbs', () => {
  test('renders three gradient orbs with configured sizes', () => {
    const { container } = render(<BackgroundOrbs />);
    const orbs = container.getElementsByClassName('gradient-orb');
    expect(orbs.length).toBe(3);
    expect((orbs[0] as HTMLElement).style.width).toBe('600px');
    expect((orbs[1] as HTMLElement).style.height).toBe('500px');
    expect((orbs[2] as HTMLElement).style.opacity).toBe('0.04');
  });
});
