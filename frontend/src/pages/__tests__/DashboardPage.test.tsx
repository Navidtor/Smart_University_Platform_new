import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { DashboardPage } from '../DashboardPage';

const server = setupServer(
  http.get('http://localhost:8080/dashboard/sensors', () => {
    return HttpResponse.json([{ id: 's1', type: 'TEMPERATURE', label: 'Lecture Hall Temp', value: 22.5, unit: '°C', updatedAt: new Date().toISOString() }]);
  }),
  http.get('http://localhost:8080/dashboard/shuttles', () => {
    return HttpResponse.json([{ id: 'sh1', name: 'Shuttle A', latitude: 52.52, longitude: 13.405, updatedAt: new Date().toISOString() }]);
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
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  it('renders sensor cards from API', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Lecture Hall Temp/i)).toBeInTheDocument();
    });
  });

  it('renders shuttle dot from API', async () => {
    renderWithProviders();
    await waitFor(() => {
      // The shuttle dot uses the shuttle name as its title attribute
      expect(screen.getByTitle(/Shuttle A/i)).toBeInTheDocument();
    });
  });
});