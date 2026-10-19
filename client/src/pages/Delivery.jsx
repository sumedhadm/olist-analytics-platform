import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';

export default function Delivery() {
  const [impact, setImpact] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/delay-impact'), api('/delivery-summary')])
      .then(([i, s]) => {
        setImpact(i);
        setSummary(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  const onTime = impact.find((r) => r.bucket === 'On time or early');
  const veryLate = impact.find((r) => r.bucket === 'Over 7 days late');

  return (
    <>
      {error && <p className="error">{error}</p>}

      {summary && (
        <div className="kpi-grid">
          <div className="card kpi">
            <div className="muted">Delivered orders</div>
            <div className="kpi-value">{summary.delivered_orders.toLocaleString('en-US')}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Late orders</div>
            <div className="kpi-value">{summary.late_orders.toLocaleString('en-US')}</div>
          </div>
          <div className="card kpi">
            <div className="muted">Late rate</div>
            <div className="kpi-value">{summary.late_pct}%</div>
          </div>
        </div>
      )}

      <div className="card chart-card">
        <h3>Average review score by delivery delay</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={impact}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Bar dataKey="avg_review" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>

        {onTime && veryLate && (
          <p className="insight">
            Orders delivered more than 7 days late average {veryLate.avg_review} stars,
            compared with {onTime.avg_review} for on-time orders, a drop of{' '}
            {(onTime.avg_review - veryLate.avg_review).toFixed(2)} stars.
          </p>
        )}
      </div>
    </>
  );
}