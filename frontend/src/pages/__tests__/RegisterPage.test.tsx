import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { RegisterPage } from '../RegisterPage';

// Mock JWT token with encoded payload
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwicm9sZSI6IlNUVURFTlQiLCJ0ZW5hbnQiOiJlbmdpbmVlcmluZyJ9.mock';

const server = setupServer(
  http.post('http://localhost:8080/auth/register', () => {
    return HttpResponse.json(
      { token: mockToken },
      { status: 200 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  it('renders registration form with all fields', () => {
    renderWithProviders();

    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tenant \/ Faculty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('registers successfully and stores token', async () => {
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Tenant \/ Faculty/i), { target: { value: 'engineering' } });
    
    // Select STUDENT role (default)
    const roleSelect = screen.getByLabelText(/Role/i);
    fireEvent.change(roleSelect, { target: { value: 'STUDENT' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Registration failed/i)).not.toBeInTheDocument();
      expect(localStorage.getItem('sup_token')).toBe(mockToken);
    });
  });

  it('allows selecting TEACHER role', async () => {
    renderWithProviders();

    const roleSelect = screen.getByLabelText(/Role/i);
    fireEvent.change(roleSelect, { target: { value: 'TEACHER' } });

    expect(roleSelect).toHaveValue('TEACHER');
  });

  it('shows error message when registration fails', async () => {
    server.use(
      http.post('http://localhost:8080/auth/register', () => {
        return HttpResponse.json(
          { message: 'Username already exists' },
          { status: 400 }
        );
      })
    );

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Tenant \/ Faculty/i), { target: { value: 'engineering' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    // Delay response to test loading state
    server.use(
      http.post('http://localhost:8080/auth/register', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({ token: mockToken }, { status: 200 });
      })
    );

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    // Check for loading state
    expect(screen.getByRole('button', { name: /Creating…/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating…/i })).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/Creating…/i)).not.toBeInTheDocument();
    });
  });

  it('has link to login page', () => {
    renderWithProviders();

    const loginLink = screen.getByText(/Already have an account\? Sign in/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
