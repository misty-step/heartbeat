import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { BackgroundAtmosphere } from '../BackgroundAtmosphere';

describe('BackgroundAtmosphere', () => {
  test('renders svg definitions and radial gradient', () => {
    const { container } = render(<BackgroundAtmosphere />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('#dot-matrix')).not.toBeNull();

    const gradientDiv = Array.from(container.querySelectorAll('div')).find((el) => {
      const style = (el as HTMLElement).style.background;
      return style && style.includes('radial-gradient');
    }) as HTMLElement | undefined;

    expect(gradientDiv).toBeDefined();
    expect(gradientDiv?.style.opacity).toBe('0.05');
  });
});
