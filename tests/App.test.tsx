import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App smoke test', () => {
  it('renders something from App', () => {
    render(<App />);
    // Try a few safe queries — presence of app root or a Loading text
    const maybeLoading = screen.queryByText(/loading/i);
    const maybePortal = screen.queryByText(/portal/i);
    const any = maybeLoading || maybePortal || document.querySelector('main');
    expect(any).toBeTruthy();
  });
});
