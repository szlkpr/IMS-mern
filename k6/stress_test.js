import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
// BASE_URL defaults to local backend discovered at http://localhost:4200
// Provide env vars to enable write ops (optional):
// - K6_AUTH_TOKEN: Bearer token for protected routes (POST/PUT)
// - K6_CATEGORY_ID: Existing category ObjectId for creating products
// - K6_PRODUCT_ID: Existing product ObjectId for updating
// Example:
// k6 run -e BASE_URL=https://api.your-inventory.com \
//        -e K6_AUTH_TOKEN=xxxxx \
//        -e K6_CATEGORY_ID=664abc... \
//        -e K6_PRODUCT_ID=665def... k6/stress_test.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4200';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || '';
const CATEGORY_ID = __ENV.K6_CATEGORY_ID || '';
const PRODUCT_ID = __ENV.K6_PRODUCT_ID || '';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp to 100 VUs
    { duration: '1m', target: 100 },  // hold
    { duration: '30s', target: 200 }, // ramp to 200
    { duration: '1m', target: 200 },  // hold
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],     // < 5% errors overall
    http_req_duration: ['p(95)<1200'],  // p95 under 1200ms (tune for your target)
  },
};

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return headers;
}

function doGetProducts() {
  const res = http.get(`${BASE_URL}/api/v1/products`);
  check(res, { 'GET 200': r => r.status === 200 });
}

function maybeCreateProduct() {
  if (!AUTH_TOKEN || !CATEGORY_ID) return; // skip if not configured
  const payload = JSON.stringify({
    name: `k6 item ${Math.random().toString(36).slice(2, 8)}`,
    description: 'load test product',
    retailPrice: 19.99,
    wholesalePrice: 14.99,
    wholesaleThreshold: 10,
    stock: 5,
    category: CATEGORY_ID,
  });
  const res = http.post(`${BASE_URL}/api/v1/products`, payload, { headers: getHeaders(true) });
  check(res, {
    'POST status 201/200/409': r => [200, 201, 409].includes(r.status),
  });
}

function maybeUpdateProduct() {
  if (!AUTH_TOKEN || !PRODUCT_ID) return; // skip if not configured
  const payload = JSON.stringify({
    description: 'updated by k6',
  });
  // Note: backend uses PATCH for update according to routes scaffold
  const res = http.patch(`${BASE_URL}/api/v1/products/${PRODUCT_ID}`, payload, { headers: getHeaders(true) });
  check(res, {
    'PATCH status 200/204': r => [200, 204].includes(r.status),
  });
}

export default function () {
  // Mix of traffic: mostly reads; writes only if env allows
  const roll = Math.random();
  if (roll < 0.7) {
    doGetProducts();
  } else if (roll < 0.85) {
    maybeCreateProduct();
  } else {
    maybeUpdateProduct();
  }

  sleep(0.5);
}


