import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../state/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    
    // Initial state - dark mode, button should say "switch to light mode"
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    
    // Click to toggle to light
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Click to toggle back to dark
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('renders with label when showLabel is true', () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>
    );

    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { rerender } = render(
      <ThemeProvider>
        <ThemeToggle size="sm" />
      </ThemeProvider>
    );

    const smallButton = screen.getByRole('button');
    expect(smallButton).toHaveStyle({ width: '28px' });

    rerender(
      <ThemeProvider>
        <ThemeToggle size="lg" />
      </ThemeProvider>
    );

    const largeButton = screen.getByRole('button');
    expect(largeButton).toHaveStyle({ width: '44px' });
  });
});
