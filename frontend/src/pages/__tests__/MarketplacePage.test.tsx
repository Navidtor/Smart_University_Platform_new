import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { MarketplacePage } from '../MarketplacePage';

const productsPath = 'http://localhost:8080/market/products';
const checkoutPath = 'http://localhost:8080/market/orders/checkout';

const server = setupServer(
  http.get(productsPath, () => {
    return HttpResponse.json([
      { id: 'p1', name: 'Notebook', description: 'A5', price: 5.0, stock: 10 },
      { id: 'p2', name: 'Textbook', description: 'Algorithms', price: 50.0, stock: 5 }
    ]);
  }),
  http.post(checkoutPath, () => {
    return HttpResponse.json({ id: 'order-1' }, { status: 201 });
  }),
  http.post(productsPath, () => {
    return HttpResponse.json(
      {
        id: 'p3',
        name: 'Lab Manual',
        description: 'Chemistry experiments',
        price: 15.0,
        stock: 20
      },
      { status: 201 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function seedTeacherToken() {
  const payload = {
    sub: 'teacher-1',
    role: 'TEACHER',
    tenant: 'engineering'
  };
  const encoded = btoa(JSON.stringify(payload));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const token = `${header}.${encoded}.signature`;
  localStorage.setItem('sup_token', token);
  localStorage.setItem('sup_tenant', 'engineering');
}

function seedStudentToken() {
  const payload = {
    sub: 'student-1',
    role: 'STUDENT',
    tenant: 'engineering'
  };
  const encoded = btoa(JSON.stringify(payload));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const token = `${header}.${encoded}.signature`;
  localStorage.setItem('sup_token', token);
  localStorage.setItem('sup_tenant', 'engineering');
}

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MarketplacePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('MarketplacePage', () => {
  it('renders products fetched from API', async () => {
    seedStudentToken();
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
      expect(screen.getByText(/Textbook/i)).toBeInTheDocument();
    });
  });

  it('allows teacher to create a product', async () => {
    seedTeacherToken();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/New product name/i), { target: { value: 'Lab Manual' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Chemistry experiments' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Initial stock/i), { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: /Create product/i }));

    await waitFor(() => {
      expect(screen.getByText(/Product created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Lab Manual/i)).toBeInTheDocument();
    });
  });

  it('shows insufficient stock message on checkout conflict', async () => {
    seedStudentToken();
    server.use(
      http.post(checkoutPath, () => {
        return HttpResponse.json({ message: 'Insufficient stock' }, { status: 409 });
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Buy 1/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Insufficient stock for this product/i)).toBeInTheDocument();
    });
  });

  it('shows payment failure message on checkout 402', async () => {
    seedStudentToken();
    server.use(
      http.post(checkoutPath, () => {
        return HttpResponse.json({ message: 'Payment required' }, { status: 402 });
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Buy 1/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Payment authorization failed/i)).toBeInTheDocument();
    });
  });

  it('allows student to checkout multiple items from cart', async () => {
    seedStudentToken();

    let receivedBody: any = null;
    server.use(
      http.post(checkoutPath, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ id: 'order-cart-1' }, { status: 201 });
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Notebook/i)).toBeInTheDocument();
      expect(screen.getByText(/Textbook/i)).toBeInTheDocument();
    });

    // Add 2 notebooks to cart
    fireEvent.change(screen.getByLabelText(/Quantity for Notebook/i), {
      target: { value: '2' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Add to cart/i }));

    // Add 1 textbook to cart
    fireEvent.change(screen.getByLabelText(/Quantity for Textbook/i), {
      target: { value: '1' }
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Add to cart/i })[1]);

    fireEvent.click(screen.getByRole('button', { name: /Checkout cart/i }));

    await waitFor(() => {
      expect(screen.getByText(/Order order-cart-1 created successfully from cart./i)).toBeInTheDocument();
    });

    expect(receivedBody).not.toBeNull();
    expect(Array.isArray(receivedBody.items)).toBe(true);
    expect(receivedBody.items).toHaveLength(2);
    const quantities = receivedBody.items.reduce(
      (acc: Record<string, number>, item: any) => ({
        ...acc,
        [item.productId]: item.quantity
      }),
      {}
    );
    expect(quantities['p1']).toBe(2);
    expect(quantities['p2']).toBe(1);
  });
});