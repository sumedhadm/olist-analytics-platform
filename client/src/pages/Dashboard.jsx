import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function Card({ label, value }) {
  return (
    <div className="card kpi">
      <div className="muted">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/kpis'), api('/revenue-trend'), api('/delivery-summary')])
      .then(([k, t, d]) => {
        setKpis(k);
        setTrend(t);
        setDelivery(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const money = (n) => 'R$ ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="page">
      <header className="topbar">
        <h2>Olist Analytics</h2>
        <div>
          <span className="muted">{user.email} ({user.role})</span>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {!kpis && !error && <p className="muted">Loading...</p>}

      {kpis && delivery && (
        <>
          <div className="kpi-grid">
            <Card label="Total orders" value={kpis.total_orders.toLocaleString('en-US')} />
            <Card label="Revenue" value={money(kpis.revenue)} />
            <Card label="Avg order value" value={'R$ ' + kpis.avg_order_value} />
            <Card label="Late deliveries" value={delivery.late_pct + '%'} />
          </div>

          <div className="card chart-card">
            <h3>Monthly revenue</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}