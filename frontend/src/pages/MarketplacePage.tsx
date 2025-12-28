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
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  createdAt?: string;
};

// Product category icons
const getCategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('book') || lowerName.includes('textbook')) return '📚';
  if (lowerName.includes('laptop') || lowerName.includes('computer')) return '💻';
  if (lowerName.includes('ticket') || lowerName.includes('event')) return '🎟️';
  if (lowerName.includes('lab') || lowerName.includes('equipment')) return '🔬';
  if (lowerName.includes('coffee') || lowerName.includes('food')) return '☕';
  if (lowerName.includes('print') || lowerName.includes('copy')) return '🖨️';
  return '📦';
};

export const MarketplacePage: React.FC = () => {
  const api = useConfiguredApi();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Create product form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('10');
  const [newStock, setNewStock] = useState('10');
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get<Product[]>('/market/products'),
          api.get<Order[]>('/market/orders/mine')
        ]);
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
      } catch (error) {
        // Orders endpoint might not exist yet
        try {
          const productsRes = await api.get<Product[]>('/market/products');
          setProducts(productsRes.data);
        } catch (e) {
          showToast('Failed to load products', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleAddToCart = (product: Product) => {
    const raw = quantities[product.id] ?? '1';
    const parsed = parseInt(raw, 10);
    const quantity = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} items in stock`, 'warning');
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          showToast(`Only ${product.stock} items in stock`, 'warning');
          return prev;
        }
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity
      }];
    });

    showToast(`Added ${quantity}x ${product.name} to cart`, 'success');
    setQuantities(prev => ({ ...prev, [product.id]: '1' }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const product = products.find(p => p.id === productId);
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (delta > 0 && product && newQty > product.stock) {
        showToast(`Only ${product.stock} items in stock`, 'warning');
        return item;
      }
      return { ...item, quantity: newQty };
    }));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      const res = await api.post<Order>('/market/orders/checkout', payload);
      showToast(`Order ${res.data.id.slice(0, 8)}... placed successfully!`, 'success');
      setCartItems([]);
      setShowCheckoutModal(false);
      setIsCartOpen(false);
      
      // Refresh products to get updated stock
      const productsRes = await api.get<Product[]>('/market/products');
      setProducts(productsRes.data);
      
      // Add to orders
      setOrders(prev => [res.data, ...prev]);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 402) {
        showToast('Payment failed. Please try again.', 'error');
      } else if (status === 409) {
        showToast('Some items are out of stock. Please review your cart.', 'warning');
      } else {
        showToast(err.response?.data?.message ?? 'Checkout failed', 'error');
      }
    } finally {
      setIsCheckingOut(false);
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
      setProducts(prev => [...prev, res.data]);
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

  return (
    <div className="marketplace-page">
      {/* Header with tabs and cart */}
      <div className="marketplace-header">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            🛍️ Shop
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 My Orders
            {orders.length > 0 && <span className="orders-badge">{orders.length}</span>}
          </button>
        </div>

        <button
          className="cart-button"
          onClick={() => setIsCartOpen(true)}
        >
          🛒 Cart
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </button>
      </div>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="title-icon">🏪</span>
                Campus Marketplace
              </div>
              <div className="card-subtitle">Digital goods and materials from faculty</div>
            </div>
            <div className="chip">Saga checkout</div>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="product-skeleton">
                  <div className="skeleton-icon" />
                  <div className="skeleton-text" />
                  <div className="skeleton-price" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Teacher product creation form */}
              {isTeacherOrAdmin && (
                <form onSubmit={handleCreateProduct} className="create-product-form">
                  <h4>➕ Add New Product</h4>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Name</label>
                      <input
                        className="form-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Product name"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Price (€)</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Stock</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Description (optional)</label>
                    <input
                      className="form-input"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>
                  <button type="submit" className="btn-primary">Create Product</button>
                  {createMessage && <p className="form-message">{createMessage}</p>}
                </form>
              )}

              {/* Products grid */}
              <div className="products-grid">
                {products.map(p => (
                  <div key={p.id} className="product-card">
                    <div className="product-icon">{getCategoryIcon(p.name)}</div>
                    <div className="product-info">
                      <h3 className="product-name">{p.name}</h3>
                      <p className="product-desc">{p.description || 'No description'}</p>
                      <div className="product-meta">
                        <span className="product-price">€{p.price.toFixed(2)}</span>
                        <span className={`product-stock ${p.stock < 5 ? 'low' : ''}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                    <div className="product-actions">
                      <input
                        aria-label={`Quantity for ${p.name}`}
                        className="quantity-input"
                        type="number"
                        min="1"
                        max={p.stock}
                        value={quantities[p.id] ?? '1'}
                        onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                      />
                      <button
                        className="btn-primary add-btn"
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock === 0}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="empty-products">
                    <span className="empty-icon">🏪</span>
                    <p>No products available yet.</p>
                    {isTeacherOrAdmin && <p>Use the form above to add products.</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="title-icon">📋</span>
                Order History
              </div>
              <div className="card-subtitle">Your past purchases</div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders">
              <span className="empty-icon">📭</span>
              <p>No orders yet.</p>
              <p className="empty-hint">Browse the shop and make your first purchase!</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-header-left">
                      <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                      {/* FIX #3: Display order date */}
                      {order.createdAt && (
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <span className={`order-status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span>{getCategoryIcon(item.productName)} {item.productName}</span>
                        <span>×{item.quantity}</span>
                        <span>€{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-footer">
                    <span className="order-total">Total: €{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Cart Slide-out Panel */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-panel" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3>🛒 Your Cart</h3>
              <button className="cart-close" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <span>🛒</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => {
                    const stock = products.find(p => p.id === item.productId)?.stock;
                    const isAtStockLimit = stock !== undefined && item.quantity >= stock;

                    return (
                      <div key={item.productId} className="cart-item">
                        <span className="cart-item-icon">{getCategoryIcon(item.productName)}</span>
                        <div className="cart-item-info">
                          <span className="cart-item-name">{item.productName}</span>
                          <span className="cart-item-price">€{item.price.toFixed(2)} each</span>
                        </div>
                        <div className="cart-item-qty">
                          <button onClick={() => handleUpdateCartQuantity(item.productId, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.productId, 1)}
                            disabled={isAtStockLimit}
                          >
                            +
                          </button>
                        </div>
                        <span className="cart-item-total">€{(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          className="cart-item-remove"
                          onClick={() => handleRemoveFromCart(item.productId)}
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span className="cart-total-amount">€{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="btn-primary checkout-btn"
                    onClick={() => setShowCheckoutModal(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Order</h3>
              <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="checkout-summary">
                <h4>Order Summary</h4>
                {cartItems.map(item => (
                  <div key={item.productId} className="checkout-item">
                    <span>{getCategoryIcon(item.productName)} {item.productName} × {item.quantity}</span>
                    <span>€{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="checkout-total">
                  <span>Total</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="checkout-notice">
                <span>💳</span>
                <p>Payment will be processed using your registered payment method.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowCheckoutModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Processing...' : `Pay €${cartTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .marketplace-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .marketplace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tab-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg-elevated);
          color: var(--muted);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          border-color: var(--accent);
          color: var(--text);
        }

        .tab-btn.active {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .orders-badge {
          background: var(--accent);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          font-size: 0.75rem;
        }

        .cart-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg-elevated);
          color: var(--text);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
        }

        .cart-button:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
        }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--danger);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-icon {
          margin-right: 0.5rem;
        }

        /* Loading */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .product-skeleton {
          padding: 1.5rem;
          border-radius: var(--radius);
          background: var(--bg-elevated);
          animation: shimmer 1.5s infinite;
        }

        .skeleton-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--border);
          margin-bottom: 1rem;
        }

        .skeleton-text {
          width: 70%;
          height: 16px;
          border-radius: 4px;
          background: var(--border);
          margin-bottom: 0.5rem;
        }

        .skeleton-price {
          width: 40%;
          height: 24px;
          border-radius: 4px;
          background: var(--border);
        }

        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        /* Create product form */
        .create-product-form {
          padding: 1.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
        }

        .create-product-form h4 {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: var(--text);
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .form-message {
          margin: 0.5rem 0 0 0;
          font-size: 0.85rem;
          color: var(--success);
        }

        /* Products grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
        }

        .product-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .product-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
        }

        .product-desc {
          margin: 0 0 0.75rem 0;
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.4;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent);
        }

        .product-stock {
          font-size: 0.75rem;
          color: var(--success);
        }

        .product-stock.low {
          color: var(--warning);
        }

        .product-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .quantity-input {
          width: 60px;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg-surface);
          color: var(--text);
          text-align: center;
        }

        .add-btn {
          flex: 1;
          padding: 0.5rem !important;
          font-size: 0.85rem !important;
        }

        .empty-products, .empty-orders {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: var(--muted);
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .empty-hint {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        /* Orders */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-surface);
        }

        .order-id {
          font-weight: 600;
          color: var(--text);
          font-family: monospace;
        }

        /* FIX #3: Order date styles */
        .order-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .order-date {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .order-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .order-status.confirmed {
          background: var(--success-soft);
          color: var(--success);
        }

        .order-status.pending {
          background: var(--warning-soft);
          color: var(--warning);
        }

        .order-status.canceled {
          background: var(--danger-soft);
          color: var(--danger);
        }

        .order-items {
          padding: 1rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text);
          border-bottom: 1px dashed var(--border);
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
          text-align: right;
        }

        .order-total {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--accent);
        }

        /* Cart panel */
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        .cart-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 400px;
          max-width: 100%;
          background: var(--bg-surface);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .cart-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .cart-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--muted);
          cursor: pointer;
        }

        .cart-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .cart-empty span {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-elevated);
          border-radius: var(--radius);
          margin-bottom: 0.75rem;
        }

        .cart-item-icon {
          font-size: 1.5rem;
        }

        .cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .cart-item-name {
          display: block;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cart-item-price {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cart-item-qty button {
          width: 24px;
          height: 24px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text);
          cursor: pointer;
        }

        .cart-item-qty button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cart-item-total {
          font-weight: 600;
          color: var(--accent);
          min-width: 60px;
          text-align: right;
        }

        .cart-item-remove {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .cart-item-remove:hover {
          opacity: 1;
        }

        .cart-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .cart-total-amount {
          font-weight: 700;
          color: var(--accent);
        }

        .checkout-btn {
          width: 100%;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
        }

        .modal {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          max-width: 450px;
          width: 100%;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1.25rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .checkout-summary h4 {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: var(--muted);
        }

        .checkout-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.9rem;
          border-bottom: 1px dashed var(--border);
        }

        .checkout-total {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0 0 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent);
        }

        .checkout-notice {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding: 1rem;
          background: var(--accent-soft);
          border-radius: var(--radius);
          font-size: 0.85rem;
          color: var(--muted);
        }

        .checkout-notice span {
          font-size: 1.25rem;
        }

        .checkout-notice p {
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .cart-panel {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
