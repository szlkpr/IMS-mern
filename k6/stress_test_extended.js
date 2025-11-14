import http from 'k6/http';
import { check, sleep } from 'k6';

// Extended stress test to find breaking point
// This test ramps up to 500 VUs to identify where the system fails
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4200';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Ramp to 100 VUs
    { duration: '1m', target: 100 },     // Hold at 100
    { duration: '30s', target: 200 },    // Ramp to 200
    { duration: '1m', target: 200 },     // Hold at 200
    { duration: '30s', target: 300 },    // Ramp to 300
    { duration: '1m', target: 300 },     // Hold at 300
    { duration: '30s', target: 400 },    // Ramp to 400
    { duration: '1m', target: 400 },     // Hold at 400
    { duration: '30s', target: 500 },    // Ramp to 500
    { duration: '1m', target: 500 },     // Hold at 500 (breaking point expected here)
    { duration: '30s', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // Allow up to 10% errors to see breaking point
    http_req_duration: ['p(95)<2000'],   // Relaxed threshold for stress test
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/products`);
  
  check(res, {
    'GET status is 200': r => r.status === 200,
    'GET response time < 5s': r => r.timings.duration < 5000,
  });
  
  sleep(0.5); // Reduced think time for higher throughput
}

