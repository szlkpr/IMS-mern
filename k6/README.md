## k6 Load and Stress Tests

Prereqs:
- Install k6: https://k6.io/docs/get-started/installation/

Base URL:
- Default is `http://localhost:4200` (see backend `PORT` env in `backend/src/index.js`).
- Override with `-e BASE_URL=https://api.your-inventory.com`.

### Load test (GET products)

Run:

```bash
k6 run -e BASE_URL=http://localhost:4200 k6/load_test.js
```

Key outputs: req/s, p(95) latency, and error rate are shown in the summary.

### Stress test (staged ramp; optional writes)

By default only GETs are executed. To enable POST/PUT, provide env vars:

- `K6_AUTH_TOKEN`: Bearer token for protected routes
- `K6_CATEGORY_ID`: Existing category ObjectId for product creation
- `K6_PRODUCT_ID`: Existing product ObjectId for update

Run:

```bash
k6 run \
  -e BASE_URL=http://localhost:4200 \
  -e K6_AUTH_TOKEN=YOUR_JWT \
  -e K6_CATEGORY_ID=64b... \
  -e K6_PRODUCT_ID=64c... \
  k6/stress_test.js
```

Notes:
- Products APIs are mounted at `/api/v1/products`.
- POST and PATCH are protected by JWT (`verifyJWT`).
- Thresholds are set for error rate and p95 latency; tune as needed.


