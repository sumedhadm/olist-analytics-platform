import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const STAGES = [
  { label: 'On time or early', short: 'On time', stars: 4.29, orders: 88163 },
  { label: 'Up to 3 days late', short: '1–3 days', stars: 3.77, orders: 2636 },
  { label: '3 to 7 days late', short: '3–7 days', stars: 2.32, orders: 1773 },
  { label: 'Over 7 days late', short: '7+ days', stars: 1.73, orders: 3252 },
];

export default function Landing() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const stage = STAGES[i];
  const drop = (STAGES[0].stars - stage.stars).toFixed(2);
  const target = user ? '/app' : '/login';

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-glow" style={{ opacity: i / 3 }} aria-hidden="true" />

        <header className="land-nav">
          <span className="brand">Olist Analytics</span>
          <Link className="nav-link" to={target}>
            {user ? 'Open dashboard' : 'Sign in'}
          </Link>
        </header>

        <div className="hero-body">
          <div className="hero-copy">
            <h1>Late deliveries cost Olist more than two stars.</h1>
            <p>
              An analysis of 96,478 delivered orders from Olist, a Brazilian online
              marketplace, between 2016 and 2018. Drag the slider to see what a late
              package does to the review.
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" to={target}>
                {user ? 'Open the dashboard' : 'Sign in to explore'}
              </Link>
              {!user && <span className="hero-hint">Demo accounts are on the sign-in page.</span>}
            </div>
          </div>

          <div className="meter" role="group" aria-label="Delivery delay explorer">
            <p className="meter-q">How late was the package?</p>

            <div className="stars" aria-hidden="true">
              <span className="stars-base">★★★★★</span>
              <span className="stars-fill" style={{ width: `${(stage.stars / 5) * 100}%` }}>★★★★★</span>
            </div>

            <div className="meter-score">
              {stage.stars.toFixed(2)}
              <span>average review</span>
            </div>

            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={i}
              onChange={(e) => setI(Number(e.target.value))}
              aria-label="Delivery delay"
              aria-valuetext={stage.label}
            />

            <div className="ticks">
              {STAGES.map((s, k) => (
                <button
                  key={s.short}
                  type="button"
                  className={k === i ? 'tick on' : 'tick'}
                  onClick={() => setI(k)}
                >
                  {s.short}
                </button>
              ))}
            </div>

            <p className="meter-note">
              {stage.orders.toLocaleString('en-US')} orders in this group
              {i > 0 && `, ${drop} stars below on-time orders`}.
            </p>
          </div>
        </div>
      </section>

      <section className="land-body">
        <h2>What's inside</h2>
        <div className="inside">
          <div>
            <h3>Overview</h3>
            <p>Orders, revenue, average order value and the monthly revenue trend.</p>
          </div>
          <div>
            <h3>Sales</h3>
            <p>The top product categories and the states that bring in the most revenue.</p>
          </div>
          <div className="hot">
            <h3>Delivery</h3>
            <p>Review score by delivery delay, the analysis behind this page.</p>
          </div>
          <div>
            <h3>Sellers</h3>
            <p>A green, amber and red scorecard for every seller with 30 or more orders.</p>
          </div>
          <div>
            <h3>Add order</h3>
            <p>An admin-only form with server-side checks that saves each order in one transaction.</p>
          </div>
        </div>

        <p className="land-foot">
          Built with PostgreSQL, Express, React and Recharts. Data: the Olist Brazilian
          E-Commerce dataset from Kaggle.
        </p>
      </section>
    </div>
  );
}