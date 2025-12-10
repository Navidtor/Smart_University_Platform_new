import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  LoadingSkeleton, 
  PageLoadingSkeleton, 
  DashboardLoadingSkeleton, 
  ListLoadingSkeleton,
  InlineSpinner,
  LoadingOverlay 
} from '../LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  it('renders card skeleton by default', () => {
    const { container } = render(<LoadingSkeleton />);
    
    // Should render 3 cards by default
    const skeletons = container.querySelectorAll('div > div > div');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders specified count of skeletons', () => {
    const { container } = render(<LoadingSkeleton count={5} type="row" />);
    
    // Should have 5 row skeletons
    const rows = container.querySelectorAll('div > div');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('renders text skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="text" count={1} />);
    
    // Text skeleton should have multiple lines
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders avatar skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="avatar" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders button skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="button" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders metric skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="metric" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders sensor skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="sensor" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders table skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="table" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders form skeleton type', () => {
    const { container } = render(<LoadingSkeleton type="form" count={1} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('includes shimmer animation styles', () => {
    const { container } = render(<LoadingSkeleton />);
    
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('shimmer');
  });
});

describe('PageLoadingSkeleton Component', () => {
  it('renders without title', () => {
    const { container } = render(<PageLoadingSkeleton />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with title placeholder', () => {
    const { container } = render(<PageLoadingSkeleton title="Loading..." />);
    
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('DashboardLoadingSkeleton Component', () => {
  it('renders sensor grid skeleton', () => {
    const { container } = render(<DashboardLoadingSkeleton />);
    
    // Should render 4 sensor skeletons
    const grid = container.firstChild as HTMLElement;
    expect(grid).toBeInTheDocument();
    expect(grid.children.length).toBe(4);
  });
});

describe('ListLoadingSkeleton Component', () => {
  it('renders default 3 row skeletons', () => {
    const { container } = render(<ListLoadingSkeleton />);
    
    const list = container.firstChild as HTMLElement;
    expect(list.children.length).toBe(3);
  });

  it('renders specified count of row skeletons', () => {
    const { container } = render(<ListLoadingSkeleton count={5} />);
    
    const list = container.firstChild as HTMLElement;
    expect(list.children.length).toBe(5);
  });
});

describe('InlineSpinner Component', () => {
  it('renders spinner with default size', () => {
    const { container } = render(<InlineSpinner />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toBeInTheDocument();
    expect(spinner.style.width).toBe('20px');
    expect(spinner.style.height).toBe('20px');
  });

  it('renders spinner with custom size', () => {
    const { container } = render(<InlineSpinner size={32} />);
    
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.style.width).toBe('32px');
    expect(spinner.style.height).toBe('32px');
  });

  it('includes spin animation styles', () => {
    const { container } = render(<InlineSpinner />);
    
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('spin');
  });
});

describe('LoadingOverlay Component', () => {
  it('renders with default message', () => {
    render(<LoadingOverlay />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Please wait..." />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('has fixed positioning for overlay', () => {
    const { container } = render(<LoadingOverlay />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.style.position).toBe('fixed');
  });

  it('includes spinner animation', () => {
    const { container } = render(<LoadingOverlay />);
    
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('spin');
  });
});
