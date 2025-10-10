# Performance Monitoring Guide

## Overview

This guide explains the enhanced performance monitoring and alerting system for NormalDance. The system provides comprehensive visibility into application performance, helping identify and resolve issues before they impact users.

## Key Components

### 1. Performance Dashboard

The Performance Dashboard provides real-time insights into application performance metrics:

- **Application Performance Score**: Overall health indicator
- **Response Time Percentiles**: 50th, 90th, 95th, and 99th percentiles
- **Database Query Performance**: Query execution times
- **Cache Efficiency**: Hit ratios and effectiveness
- **Audio Streaming Performance**: Streaming success rates
- **File Upload Performance**: Upload duration metrics
- **WebSocket Connection Performance**: Connection success rates
- **API Rate Limiting**: Throttling metrics

### 2. Alerting System

The enhanced alerting system monitors critical performance indicators and notifies teams when thresholds are exceeded:

#### Response Time Alerts

- **Warning**: 95th percentile response time > 1 second for 5 minutes
- **Critical**: 95th percentile response time > 2 seconds for 5 minutes

#### Error Rate Alerts

- **Warning**: Error rate > 5% for 5 minutes
- **Critical**: Error rate > 10% for 5 minutes

#### Database Performance Alerts

- **Warning**: Average query time > 0.5 seconds for 5 minutes
- **Critical**: Average query time > 1 second for 5 minutes

#### Cache Efficiency Alerts

- **Warning**: Cache hit ratio < 80% for 5 minutes
- **Critical**: Cache hit ratio < 50% for 5 minutes

#### Audio Streaming Alerts

- **Warning**: Streaming error rate > 5% for 5 minutes
- **Critical**: Streaming error rate > 10% for 5 minutes

#### File Upload Alerts

- **Warning**: Average upload time > 30 seconds for 5 minutes
- **Critical**: Average upload time > 60 seconds for 5 minutes

#### WebSocket Connection Alerts

- **Warning**: Connection error rate > 10% for 5 minutes
- **Critical**: Connection error rate > 20% for 5 minutes

#### API Rate Limiting Alerts

- **Warning**: Rate limited requests > 1 per second for 5 minutes
- **Critical**: Rate limited requests > 5 per second for 5 minutes

#### Performance Score Alerts

- **Warning**: Performance score < 70% for 5 minutes
- **Critical**: Performance score < 50% for 5 minutes

#### System Load Alerts

- **Warning**: System load average > 5 for 5 minutes
- **Critical**: System load average > 10 for 5 minutes

## Implementation

### Metrics Collection

The system collects metrics from multiple sources:

1. **Application Layer**: HTTP requests, response times, error rates
2. **Database Layer**: Query execution times, connection counts
3. **Cache Layer**: Hit/miss ratios, eviction rates
4. **Infrastructure Layer**: CPU, memory, disk usage
5. **Business Layer**: User-specific metrics, feature usage

### Alert Routing

Alerts are routed based on severity:

- **Critical**: Emergency notifications to on-call team
- **Warning**: Notifications to development team
- **Info**: General awareness notifications

### Notification Channels

The system supports multiple notification channels:

1. **Email**: Detailed alert information
2. **Slack**: Real-time notifications in dedicated channels
3. **Webhooks**: Integration with incident management systems

## Best Practices

### 1. Proactive Monitoring

- Regularly review dashboard metrics
- Identify trends before they become issues
- Set up automated reports for key stakeholders

### 2. Alert Tuning

- Adjust thresholds based on historical data
- Minimize false positives to maintain alert credibility
- Regularly review and update alert rules

### 3. Performance Optimization

- Use cache hit ratio metrics to optimize caching strategies
- Monitor database query performance to identify slow queries
- Track response times to identify performance bottlenecks

### 4. Capacity Planning

- Monitor system load metrics to plan capacity
- Track concurrent user counts to scale infrastructure
- Use performance trends to forecast resource needs

## Troubleshooting

### Common Issues

1. **High Response Times**

   - Check database query performance
   - Review cache hit ratios
   - Investigate infrastructure resource usage

2. **High Error Rates**

   - Review application logs
   - Check external service dependencies
   - Verify infrastructure health

3. **Low Cache Efficiency**
   - Review caching strategies
   - Check cache key design
   - Monitor cache eviction rates

### Diagnostic Steps

1. **Identify the Issue**

   - Review dashboard metrics
   - Check alert details
   - Correlate with recent changes

2. **Investigate Root Cause**

   - Analyze logs and traces
   - Check infrastructure metrics
   - Review recent deployments

3. **Implement Fix**

   - Apply performance optimizations
   - Scale resources if needed
   - Update configuration

4. **Verify Resolution**
   - Monitor metrics post-fix
   - Confirm alerts are resolved
   - Document the solution

## Configuration

### Prometheus Configuration

The `prometheus.yml` file includes:

```yaml
rule_files:
  - "alert_rules.yml"
  - "performance_alerts.yml"
```

### Alert Rules

Performance alert rules are defined in `performance_alerts.yml`:

```yaml
groups:
  - name: normaldance-performance-alerts
    rules:
      # Example rule
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds for 5 minutes"
```

### Alertmanager Configuration

Alert routing is configured in `alertmanager.yml`:

```yaml
routes:
  - match:
      severity: critical
    receiver: "critical"
    continue: true

  - match:
      severity: warning
    receiver: "warning"
    continue: true
```

## Conclusion

The enhanced performance monitoring system provides comprehensive visibility into NormalDance application performance. By proactively monitoring key metrics and responding quickly to alerts, teams can maintain high application performance and minimize user impact.

Regular review and tuning of the monitoring system ensures it remains effective as the application evolves and scales.
