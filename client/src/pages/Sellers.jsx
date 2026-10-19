import { useEffect, useState } from 'react';
import { api } from '../api';

const money = (n) => 'R$ ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export default function Sellers() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/seller-scorecard').then(setRows).catch((e) => setError(e.message));
  }, []);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const shown = (filter === 'all' ? rows : rows.filter((r) => r.status === filter)).slice(0, 50);

  return (
    <>
      {error && <p className="error">{error}</p>}

      <div className="kpi-grid">
        <div className="card kpi">
          <div className="muted">Sellers graded</div>
          <div className="kpi-value">{rows.length}</div>
        </div>
        <div className="card kpi">
          <div className="muted">Green</div>
          <div className="kpi-value">{count('green')}</div>
        </div>
        <div className="card kpi">
          <div className="muted">Amber</div>
          <div className="kpi-value">{count('amber')}</div>
        </div>
        <div className="card kpi">
          <div className="muted">Red</div>
          <div className="kpi-value">{count('red')}</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-row">
          <h3>Seller scorecard</h3>
          <div>
            {['all', 'green', 'amber', 'red'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'chip active' : 'chip'}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small">
          Sellers with 30+ delivered orders, ranked by revenue (top 50 shown).
          Red: late rate above 15% or average review below 3.5.
          Green: late rate 5% or less and average review 4.2 or more.
        </p>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th><th>Location</th><th>Orders</th><th>Revenue</th>
                <th>Late %</th><th>Cancel %</th><th>Avg review</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.seller_id}>
                  <td>{r.seller_id.slice(0, 8)}</td>
                  <td>{r.city}, {r.state}</td>
                  <td>{r.delivered_orders}</td>
                  <td>{money(r.revenue)}</td>
                  <td>{r.late_pct}</td>
                  <td>{r.cancel_pct}</td>
                  <td>{r.avg_review}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}