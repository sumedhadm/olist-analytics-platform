import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <Link to="/" className="brand">Olist Analytics</Link>
        <p className="auth-quote">Orders delivered more than 7 days late average 1.73 stars.</p>
      </aside>

      <main className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <p className="muted">Use a demo account to explore the dashboard.</p>

          <div className="demo">
            <button type="button" className="btn-quiet"
              onClick={() => { setEmail('admin@olist.dev'); setPassword('Admin@123'); }}>
              Use admin demo
            </button>
            <button type="button" className="btn-quiet"
              onClick={() => { setEmail('viewer@olist.dev'); setPassword('Viewer@123'); }}>
              Use viewer demo
            </button>
          </div>

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
}