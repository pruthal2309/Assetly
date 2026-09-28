import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthRing } from '../HealthRing';

describe('HealthRing Component', () => {
  it('renders health score correctly', () => {
    render(<HealthRing score={85} />);
    expect(screen.getByText('85')).toBeDefined();
    expect(screen.getByText('Health')).toBeDefined();
  });

  it('clamps scores above 100', () => {
    render(<HealthRing score={120} />);
    expect(screen.getByText('100')).toBeDefined();
  });
});
