import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';

const money = (n) => 'R$ ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export default function Sales() {
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/category-revenue'), api('/state-revenue')])
      .then(([c, s]) => {
        setCategories(c.slice(0, 10));
        setStates(s.slice(0, 10));
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      {error && <p className="error">{error}</p>}

      <div className="grid2">
        <div className="card chart-card">
          <h3>Top 10 categories by revenue</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={categories} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => v / 1000 + 'k'} />
              <YAxis type="category" dataKey="category" width={140} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="revenue" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Top 10 states by revenue</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={states}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis tickFormatter={(v) => v / 1000 + 'k'} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="revenue" fill="#3b1d5a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}