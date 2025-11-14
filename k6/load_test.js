import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
// BASE_URL defaults to local backend discovered at http://localhost:4200
// You can override with: k6 run -e BASE_URL=https://api.your-inventory.com k6/load_test.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4200';

export const options = {
  vus: 50,              // 50 virtual users
  duration: '1m',       // run for 1 minute
  thresholds: {
    http_req_failed: ['rate<0.05'], // < 5% errors
    http_req_duration: ['p(95)<800'], // p95 latency under 800ms (tune for your target)
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/products`);

  check(res, {
    'status is 200': r => r.status === 200,
  });

  sleep(1); // user think time
}


