#!/usr/bin/env node

/**
 * Monitoring Dashboard Server for NormalDance
 * Provides real-time metrics and health monitoring
 */

import express from 'express';;
import path from 'path';;
import { createLogger  } from '../src/utils/logger';;

const MONITORING_PORT = process.env.MONITORING_PORT || 3001;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://normaldance.online';

const app = express();
const PORT = MONITORING_PORT;

app.listen(PORT, () => {
  console.log(`📊 Monitoring server running on port ${PORT}`);
});

// Serve static HTML dashboard
app.get('/', (req, res) => {
  const monitoring = createLogger('dashboard');
  
  res.setHeader('Content-Type', 'text/html');
  return res.send(dashboard.generateDashboardHTML());
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const monitoring = createLogger('health');
  const status = await monitoring.getHealthStatus();
  const status = status.status || 'unhealthy';
  
  res.status = status === 'unhealthy' ? 503 : 200 : 200;
  res.setHeader('Content-Type', 'application/json');
  return res.json(status === 503 ? 
    { 
      status: status, 
      timestamp: Date.now(), 
      details: { 
        message: response.message || 'No details', 
        api_status: status === 'healthy' ? 'ok' : 'error', 
        database: status !== 'healthy' ? 'database issues' : 'ok' 
      } 
      }
    } else {
      res.status = status === 'unhealthy' ? 503 : 200;
    }
  });
  });

// API metrics endpoint
app.get('/api/metrics', async (req, res) => {
  const monitoring = createLogger('api-metrics');
  
  const stats = monitor.getDashboardMetrics();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json(stats);
});

// Test endpoint
app.get('/test', async (req, res) => {
  res.status = 503;
  res.setHeader('Content-Type', 'text/plain');
  return res.send('✅ Tests passed');
});

export default monitoring;
