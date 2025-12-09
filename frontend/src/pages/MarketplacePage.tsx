import React, { useEffect, useState } from 'react';
import { useConfiguredApi } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../components/Toast';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
};

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export const MarketplacePage: React.FC = () => {
  const api = useConfiguredApi();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('10');
  const [newStock, setNewStock] = useState('10');
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartBusy, setCartBusy] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  useEffect(() => {
    api
      .get<Product[]>('/market/products')
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [api]);

  const handleQuickCheckout = async (productId: string) => {
    setCheckoutMessage(null);
    setBusyId(productId);
    try {
      const payload = {
        items: [{ productId, quantity: 1 }]
      };
      const res = await api.post('/market/orders/checkout', payload);
      setCheckoutMessage(`Order ${res.data.id} created successfully.`);
      showToast(`Order ${res.data.id} created!`, 'success');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 402) {
        setCheckoutMessage('Payment authorization failed. Please try again later.');
        showToast('Payment failed', 'error');
      } else if (status === 409) {
        setCheckoutMessage('Insufficient stock for this product.');
        showToast('Stock insufficient', 'warning');
      } else {
        setCheckoutMessage(err.response?.data?.message ?? 'Checkout failed.');
        showToast('Checkout failed', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage(null);
    try {
      const payload = {
        name: newName,
        description: newDescription,
        price: parseFloat(newPrice),
        stock: parseInt(newStock, 10)
      };
      const res = await api.post<Product>('/market/products', payload);
      setProducts((prev) => [...prev, res.data]);
      setCreateMessage('Product created successfully.');
      showToast('Product created!', 'success');
      setNewName('');
      setNewDescription('');
      setNewPrice('10');
      setNewStock('10');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to create product.';
      setCreateMessage(msg);
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  };

  const handleAddToCart = (product: Product) => {
    const raw = quantities[product.id] ?? '1';
    const parsed = parseInt(raw, 10);
    const quantity = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId: product.id, productName: product.name, quantity }];
    });

    setCheckoutMessage(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCheckoutCart = async () => {
    if (cartItems.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    setCartBusy(true);
    setCheckoutMessage(null);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      const res = await api.post('/market/orders/checkout', payload);
      setCheckoutMessage(`Order ${res.data.id} created successfully from cart.`);
      setCartItems([]);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 402) {
        setCheckoutMessage('Payment authorization failed. Please try again later.');
      } else if (status === 409) {
        setCheckoutMessage('Insufficient stock for one or more products in your cart.');
      } else {
        setCheckoutMessage(err.response?.data?.message ?? 'Checkout failed.');
      }
    } finally {
      setCartBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Campus marketplace</div>
          <div className="card-subtitle">Digital goods and materials from teachers and admins</div>
        </div>
        <div className="chip">Saga checkout demo</div>
      </div>
      {loading && <div className="card-subtitle">Loading products…</div>}
      {!loading && (
        <>
          {isTeacherOrAdmin && (
            <form onSubmit={handleCreateProduct} style={{ marginBottom: '0.9rem' }}>
              <div className="form-field">
                <label className="form-label">New product name</label>
                <input
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Price (€)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Initial stock</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  step="1"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Create product
              </button>
              {createMessage && (
                <div className="card-subtitle" style={{ marginTop: '0.4rem' }}>
                  {createMessage}
                </div>
              )}
            </form>
          )}

          <div className="grid-sensors">
            {products.map((p) => (
              <div key={p.id} className="sensor-card">
                <div className="sensor-name">{p.name}</div>
                <div className="sensor-value">{p.price.toFixed(2)} €</div>
                <div className="sensor-meta">
                  {p.description || 'No description'} · stock {p.stock}
                </div>
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.4rem' }}>
                  <input
                    aria-label={`Quantity for ${p.name}`}
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={quantities[p.id] ?? '1'}
                    onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                    style={{ maxWidth: '4rem', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                    onClick={() => handleAddToCart(p)}
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                    onClick={() => handleQuickCheckout(p.id)}
                    disabled={busyId === p.id}
                  >
                    {busyId === p.id ? 'Processing…' : 'Buy 1'}
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="card-subtitle">No products available yet.</div>
            )}
          </div>

          <div className="card-subtitle" style={{ marginTop: '0.9rem' }}>
            Cart
          </div>
          {cartItems.length === 0 ? (
            <div className="card-subtitle">Your cart is empty.</div>
          ) : (
            <div className="card-subtitle" style={{ marginBottom: '0.5rem' }}>
              <ul style={{ paddingLeft: '1.2rem', marginBottom: '0.5rem' }}>
                {cartItems.map((item) => (
                  <li key={item.productId}>
                    {item.productName} × {item.quantity}{' '}
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => handleRemoveFromCart(item.productId)}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-primary"
                disabled={cartBusy}
                onClick={handleCheckoutCart}
              >
                {cartBusy ? 'Processing…' : 'Checkout cart'}
              </button>
            </div>
          )}

          {checkoutMessage && (
            <div className="card-subtitle" style={{ marginTop: '0.6rem' }}>
              {checkoutMessage}
            </div>
          )}
        </>
      )}
    </section>
  );
};