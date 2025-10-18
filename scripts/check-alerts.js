#!/usr/bin/env node

import { SecurityMonitor  } from '../scripts/security-monitor';

const monitor = new SecurityMonitor();

async function runAlerts() {
  try {
    const report = await monitor.monitorEnvironment('production');
    
    if (report.score < 80) {
      console.log('🚨 Security score below threshold:', report.score);
      // Send alert notification
      await monitor.sendAlerts([report]);
    }
    
    console.log('✅ Alert check completed');
  } catch (error) {
    console.error('❌ Alert check failed:', error.message);
  }
}

runAlerts();
