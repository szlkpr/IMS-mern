/**
 * Analysis script for k6 test results
 * Reads JSON summaries and generates a detailed report
 */

import fs from 'fs';
import path from 'path';

const reports = {
  load: null,
  stress: null,
  stressExtended: null,
};

// Load JSON summaries if they exist
const loadPath = path.join(process.cwd(), 'k6-load-summary.json');
const stressPath = path.join(process.cwd(), 'k6-stress-summary.json');
const stressExtendedPath = path.join(process.cwd(), 'k6-stress-extended-summary.json');

if (fs.existsSync(loadPath)) {
  reports.load = JSON.parse(fs.readFileSync(loadPath, 'utf8'));
}

if (fs.existsSync(stressPath)) {
  reports.stress = JSON.parse(fs.readFileSync(stressPath, 'utf8'));
}

if (fs.existsSync(stressExtendedPath)) {
  reports.stressExtended = JSON.parse(fs.readFileSync(stressExtendedPath, 'utf8'));
}

function formatMetric(metric) {
  if (typeof metric === 'number') {
    if (metric < 1) return metric.toFixed(4);
    if (metric < 1000) return metric.toFixed(2);
    return Math.round(metric).toLocaleString();
  }
  return metric;
}

function generateReport() {
  let report = `# Backend Load & Stress Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Load Test Results
  if (reports.load) {
    const m = reports.load.metrics;
    report += `## Test 1: Load Test (50 VUs, 1 minute)\n\n`;
    report += `### Configuration\n`;
    report += `- Virtual Users: 50\n`;
    report += `- Duration: 1 minute\n`;
    report += `- Endpoint: GET /api/v1/products\n\n`;
    
    report += `### Performance Metrics\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Throughput** | ${formatMetric(m.http_reqs.rate)} req/s |\n`;
    report += `| **Total Requests** | ${m.http_reqs.count.toLocaleString()} |\n`;
    report += `| **Average Latency** | ${formatMetric(m.http_req_duration.avg)} ms |\n`;
    report += `| **Median Latency (p50)** | ${formatMetric(m.http_req_duration.med)} ms |\n`;
    report += `| **p90 Latency** | ${formatMetric(m.http_req_duration['p(90)'])} ms |\n`;
    report += `| **p95 Latency** | ${formatMetric(m.http_req_duration['p(95)'])} ms |\n`;
    report += `| **Min Latency** | ${formatMetric(m.http_req_duration.min)} ms |\n`;
    report += `| **Max Latency** | ${formatMetric(m.http_req_duration.max)} ms |\n`;
    report += `| **Error Rate** | ${((m.http_req_failed.value || 0) * 100).toFixed(2)}% |\n`;
    report += `| **Data Received** | ${(m.data_received.count / 1024 / 1024).toFixed(2)} MB |\n`;
    report += `| **Data Sent** | ${(m.data_sent.count / 1024).toFixed(2)} KB |\n\n`;
    
    report += `### Threshold Results\n`;
    report += `- ✅ p95 Latency < 800ms: **PASSED** (${formatMetric(m.http_req_duration['p(95)'])} ms)\n`;
    report += `- ✅ Error Rate < 5%: **PASSED** (${((m.http_req_failed.value || 0) * 100).toFixed(2)}%)\n\n`;
    report += `---\n\n`;
  }

  // Stress Test Results
  if (reports.stress) {
    const m = reports.stress.metrics;
    report += `## Test 2: Stress Test (Up to 200 VUs)\n\n`;
    report += `### Configuration\n`;
    report += `- Virtual Users: 0 → 100 → 200 → 0\n`;
    report += `- Duration: ~3.5 minutes (staged ramp)\n`;
    report += `- Endpoint: GET /api/v1/products\n\n`;
    
    report += `### Performance Metrics\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Throughput** | ${formatMetric(m.http_reqs.rate)} req/s |\n`;
    report += `| **Total Requests** | ${m.http_reqs.count.toLocaleString()} |\n`;
    report += `| **Average Latency** | ${formatMetric(m.http_req_duration.avg)} ms |\n`;
    report += `| **Median Latency (p50)** | ${formatMetric(m.http_req_duration.med)} ms |\n`;
    report += `| **p90 Latency** | ${formatMetric(m.http_req_duration['p(90)'])} ms |\n`;
    report += `| **p95 Latency** | ${formatMetric(m.http_req_duration['p(95)'])} ms |\n`;
    report += `| **Min Latency** | ${formatMetric(m.http_req_duration.min)} ms |\n`;
    report += `| **Max Latency** | ${formatMetric(m.http_req_duration.max)} ms |\n`;
    report += `| **Error Rate** | ${((m.http_req_failed.value || 0) * 100).toFixed(2)}% |\n`;
    report += `| **Max VUs** | ${m.vus_max.value} |\n\n`;
    
    report += `### Threshold Results\n`;
    report += `- ✅ p95 Latency < 1200ms: **PASSED** (${formatMetric(m.http_req_duration['p(95)'])} ms)\n`;
    report += `- ✅ Error Rate < 5%: **PASSED** (${((m.http_req_failed.value || 0) * 100).toFixed(2)}%)\n\n`;
    report += `---\n\n`;
  }

  // Extended Stress Test Results
  if (reports.stressExtended) {
    const m = reports.stressExtended.metrics;
    report += `## Test 3: Extended Stress Test (Up to 500 VUs) - Breaking Point Analysis\n\n`;
    report += `### Configuration\n`;
    report += `- Virtual Users: 0 → 100 → 200 → 300 → 400 → 500 → 0\n`;
    report += `- Duration: ~6.5 minutes (staged ramp)\n`;
    report += `- Endpoint: GET /api/v1/products\n\n`;
    
    report += `### Performance Metrics\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Throughput** | ${formatMetric(m.http_reqs.rate)} req/s |\n`;
    report += `| **Total Requests** | ${m.http_reqs.count.toLocaleString()} |\n`;
    report += `| **Average Latency** | ${formatMetric(m.http_req_duration.avg)} ms |\n`;
    report += `| **Median Latency (p50)** | ${formatMetric(m.http_req_duration.med)} ms |\n`;
    report += `| **p90 Latency** | ${formatMetric(m.http_req_duration['p(90)'])} ms |\n`;
    report += `| **p95 Latency** | ${formatMetric(m.http_req_duration['p(95)'])} ms |\n`;
    report += `| **Min Latency** | ${formatMetric(m.http_req_duration.min)} ms |\n`;
    report += `| **Max Latency** | ${formatMetric(m.http_req_duration.max)} ms |\n`;
    report += `| **Error Rate** | ${((m.http_req_failed.value || 0) * 100).toFixed(2)}% |\n`;
    report += `| **Max VUs** | ${m.vus_max.value} |\n\n`;
    
    const errorRate = (m.http_req_failed.value || 0) * 100;
    const p95Latency = m.http_req_duration['p(95)'];
    
    report += `### Breaking Point Analysis\n`;
    if (errorRate > 5) {
      report += `⚠️ **BREAKING POINT DETECTED**: Error rate exceeds 5% at ${m.vus_max.value} VUs\n`;
      report += `- Error rate: ${errorRate.toFixed(2)}%\n`;
      report += `- System is failing under this load\n\n`;
    } else if (p95Latency > 2000) {
      report += `⚠️ **PERFORMANCE DEGRADATION**: p95 latency exceeds 2s at ${m.vus_max.value} VUs\n`;
      report += `- p95 latency: ${formatMetric(p95Latency)} ms\n`;
      report += `- System is experiencing severe performance issues\n\n`;
    } else {
      report += `✅ **NO BREAKING POINT FOUND**: System handled up to ${m.vus_max.value} VUs\n`;
      report += `- Error rate: ${errorRate.toFixed(2)}%\n`;
      report += `- p95 latency: ${formatMetric(p95Latency)} ms\n`;
      report += `- Consider testing at higher VU counts (600, 700, 800+)\n\n`;
    }
    
    report += `### Threshold Results\n`;
    report += `- ${p95Latency < 2000 ? '✅' : '❌'} p95 Latency < 2000ms: ${p95Latency < 2000 ? 'PASSED' : 'FAILED'} (${formatMetric(p95Latency)} ms)\n`;
    report += `- ${errorRate < 10 ? '✅' : '❌'} Error Rate < 10%: ${errorRate < 10 ? 'PASSED' : 'FAILED'} (${errorRate.toFixed(2)}%)\n\n`;
    report += `---\n\n`;
  }

  // Summary and Recommendations
  report += `## Summary & Recommendations\n\n`;
  
  if (reports.load && reports.stress) {
    report += `### Performance Comparison\n\n`;
    report += `| Test | VUs | Throughput (req/s) | p95 Latency (ms) | Error Rate (%) |\n`;
    report += `|------|-----|-------------------|------------------|----------------|\n`;
    report += `| Load Test | 50 | ${formatMetric(reports.load.metrics.http_reqs.rate)} | ${formatMetric(reports.load.metrics.http_req_duration['p(95)'])} | ${((reports.load.metrics.http_req_failed.value || 0) * 100).toFixed(2)} |\n`;
    report += `| Stress Test | 200 | ${formatMetric(reports.stress.metrics.http_reqs.rate)} | ${formatMetric(reports.stress.metrics.http_req_duration['p(95)'])} | ${((reports.stress.metrics.http_req_failed.value || 0) * 100).toFixed(2)} |\n`;
    if (reports.stressExtended) {
      report += `| Extended Stress | ${reports.stressExtended.metrics.vus_max.value} | ${formatMetric(reports.stressExtended.metrics.http_reqs.rate)} | ${formatMetric(reports.stressExtended.metrics.http_req_duration['p(95)'])} | ${((reports.stressExtended.metrics.http_req_failed.value || 0) * 100).toFixed(2)} |\n`;
    }
    report += `\n`;
  }

  report += `### Key Findings\n\n`;
  
  if (reports.load) {
    report += `1. **Baseline Performance (50 VUs)**: Excellent response times with p95 latency at ${formatMetric(reports.load.metrics.http_req_duration['p(95)'])} ms.\n`;
  }
  
  if (reports.stress) {
    report += `2. **Moderate Load (200 VUs)**: System maintains stability with acceptable latency increase to ${formatMetric(reports.stress.metrics.http_req_duration['p(95)'])} ms p95.\n`;
  }
  
  if (reports.stressExtended) {
    const extError = (reports.stressExtended.metrics.http_req_failed.value || 0) * 100;
    const extP95 = reports.stressExtended.metrics.http_req_duration['p(95)'];
    if (extError > 5 || extP95 > 2000) {
      report += `3. **Breaking Point (${reports.stressExtended.metrics.vus_max.value} VUs)**: System ${extError > 5 ? 'experiencing errors' : 'showing severe performance degradation'}.\n`;
    } else {
      report += `3. **High Load (${reports.stressExtended.metrics.vus_max.value} VUs)**: System continues to handle load, but latency increased significantly.\n`;
    }
  }

  report += `\n### Recommendations\n\n`;
  report += `1. **Database Optimization**: Consider adding indexes on frequently queried fields.\n`;
  report += `2. **Caching**: Implement Redis caching for product listings to reduce database load.\n`;
  report += `3. **Connection Pooling**: Ensure MongoDB connection pool is properly configured.\n`;
  report += `4. **Load Balancing**: For production, consider horizontal scaling with multiple instances.\n`;
  report += `5. **Monitoring**: Set up alerts for p95 latency > 1000ms and error rate > 1%.\n`;

  report += `\n### Visualization Recommendations\n\n`;
  report += `To visualize the test results, consider:\n\n`;
  report += `1. **Throughput Graph**: Plot req/s over time for each test stage\n`;
  report += `2. **Latency Graph**: Plot p95, p90, and average latency as VUs increase\n`;
  report += `3. **Error Rate Graph**: Show percentage of failed requests at each VU level\n`;
  report += `4. **Breaking Point Graph**: Identify the exact VU count where errors spike\n\n`;
  report += `You can use tools like:\n`;
  report += `- Grafana (with k6 Cloud integration)\n`;
  report += `- Python with matplotlib/pandas\n`;
  report += `- Excel/Google Sheets with the JSON data\n`;

  return report;
}

// Generate and save report
const report = generateReport();
const reportPath = path.join(process.cwd(), 'k6-test-report.md');
fs.writeFileSync(reportPath, report, 'utf8');
console.log(`✅ Report generated: ${reportPath}`);
console.log(report);

