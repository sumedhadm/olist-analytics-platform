# Decisions

## Data quality findings
- 8 delivered orders have no delivery date, so they are excluded from delay calculations.
- 547 orders have more than one review, so I take care to avoid double counting when joining.
- 610 products have no category, so I label them "unknown" in category charts.

## Metric definitions
- Revenue = sum of item price (freight is not included).
- Only orders with status "delivered" count towards revenue and AOV.
- AOV (average order value) = revenue / number of delivered orders.
- Delay = actual delivery date minus estimated delivery date (in days).