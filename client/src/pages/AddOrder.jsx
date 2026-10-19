import { useEffect, useState } from 'react';
import { api } from '../api';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const empty = {
  category: '',
  product_id: '',
  seller_id: '',
  state: 'SP',
  city: '',
  price: '',
  freight: '0',
  payment_type: 'credit_card',
  purchase_date: '2018-08-15',
  est_days: '10',
  actual_days: '',
};

export default function AddOrder() {
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function loadRecent() {
    api('/admin/orders/recent').then(setRecent).catch((e) => setError(e.message));
  }

  useEffect(() => {
    Promise.all([api('/lookup/categories'), api('/lookup/sellers')])
      .then(([c, s]) => {
        setCategories(c);
        setSellers(s);
      })
      .catch((e) => setError(e.message));
    loadRecent();
  }, []);

  async function onCategoryChange(e) {
    const category = e.target.value;
    setForm({ ...form, category, product_id: '' });
    setProducts([]);
    if (!category) return;
    try {
      setProducts(await api(`/lookup/products?category=${encodeURIComponent(category)}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const result = await api('/admin/orders', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(`Order saved (${result.status}). ID: ${result.order_id.slice(0, 8)}...`);
      setForm({ ...form, product_id: '', price: '', freight: '0', city: '', actual_days: '' });
      loadRecent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card">
        <h3>Add a new order</h3>
        <p className="muted small">
          Leave "Actual delivery days" empty for an order still in processing.
          Fill it in to mark the order delivered, which updates revenue and delay numbers.
        </p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label>Product category</label>
            <select value={form.category} onChange={onCategoryChange} required>
              <option value="">Choose...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label>Product</label>
            <select value={form.product_id} onChange={set('product_id')} required disabled={!products.length}>
              <option value="">{products.length ? 'Choose...' : 'Pick a category first'}</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {form.category} - {p.product_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Seller</label>
            <select value={form.seller_id} onChange={set('seller_id')} required>
              <option value="">Choose...</option>
              {sellers.map((s) => (
                <option key={s.seller_id} value={s.seller_id}>
                  {s.seller_city} ({s.seller_state}) - {s.seller_id.slice(0, 6)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Customer state</label>
            <select value={form.state} onChange={set('state')} required>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label>Customer city</label>
            <input value={form.city} onChange={set('city')} required />
          </div>

          <div>
            <label>Price (R$)</label>
            <input type="number" step="0.01" min="0.01" value={form.price} onChange={set('price')} required />
          </div>

          <div>
            <label>Freight (R$)</label>
            <input type="number" step="0.01" min="0" value={form.freight} onChange={set('freight')} />
          </div>

          <div>
            <label>Payment type</label>
            <select value={form.payment_type} onChange={set('payment_type')}>
              <option value="credit_card">credit_card</option>
              <option value="boleto">boleto</option>
              <option value="voucher">voucher</option>
              <option value="debit_card">debit_card</option>
            </select>
          </div>

          <div>
            <label>Purchase date</label>
            <input type="date" value={form.purchase_date} onChange={set('purchase_date')} required />
          </div>

          <div>
            <label>Estimated delivery (days)</label>
            <input type="number" min="1" max="120" value={form.est_days} onChange={set('est_days')} required />
          </div>

          <div>
            <label>Actual delivery days (optional)</label>
            <input type="number" min="1" max="180" value={form.actual_days} onChange={set('actual_days')} />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save order'}</button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Orders added from this form</h3>
        {recent.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Status</th><th>Purchased</th><th>Total (R$)</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.order_id}>
                  <td>{o.order_id.slice(0, 8)}...</td>
                  <td>{o.status}</td>
                  <td>{o.purchased.slice(0, 10)}</td>
                  <td>{o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}