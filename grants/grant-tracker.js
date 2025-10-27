#!/usr/bin/env node

/**
 * Grant Application Tracker
 * Tracks grant applications, deadlines, and status
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

// Configuration
const CONFIG = {
  GRANTS_DB_PATH: './grants/grant-database.json',
  APPLICATIONS_PATH: './grants/applications.json',
  TRACKING_PATH: './grants/tracking.json'
};

class GrantTracker {
  constructor() {
    this.grants = this.loadGrants();
    this.applications = this.loadApplications();
    this.tracking = this.loadTracking();
  }

  loadGrants() {
    try {
      const data = fs.readFileSync(CONFIG.GRANTS_DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading grants database:', error.message);
      return { grants: [] };
    }
  }

  loadApplications() {
    try {
      if (fs.existsSync(CONFIG.APPLICATIONS_PATH)) {
        const data = fs.readFileSync(CONFIG.APPLICATIONS_PATH, 'utf8');
        return JSON.parse(data);
      }
      return { applications: [] };
    } catch (error) {
      console.error('Error loading applications:', error.message);
      return { applications: [] };
    }
  }

  loadTracking() {
    try {
      if (fs.existsSync(CONFIG.TRACKING_PATH)) {
        const data = fs.readFileSync(CONFIG.TRACKING_PATH, 'utf8');
        return JSON.parse(data);
      }
      return { tracking: [] };
    } catch (error) {
      console.error('Error loading tracking:', error.message);
      return { tracking: [] };
    }
  }

  saveApplications() {
    try {
      fs.writeFileSync(CONFIG.APPLICATIONS_PATH, JSON.stringify(this.applications, null, 2));
    } catch (error) {
      console.error('Error saving applications:', error.message);
    }
  }

  saveTracking() {
    try {
      fs.writeFileSync(CONFIG.TRACKING_PATH, JSON.stringify(this.tracking, null, 2));
    } catch (error) {
      console.error('Error saving tracking:', error.message);
    }
  }

  // Get grants by priority
  getGrantsByPriority(priority = 'high') {
    return this.grants.grants.filter(grant => grant.priority === priority);
  }

  // Get grants by category
  getGrantsByCategory(category) {
    return this.grants.grants.filter(grant => grant.category === category);
  }

  // Get grants by deadline
  getGrantsByDeadline(days = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.grants.grants.filter(grant => {
      const deadline = new Date(grant.deadline);
      return deadline >= now && deadline <= futureDate;
    });
  }

  // Get grants for individuals
  getGrantsForIndividuals() {
    return this.grants.grants.filter(grant => grant.eligibility.individuals === true);
  }

  // Create new application
  createApplication(grantId, status = 'draft') {
    const grant = this.grants.grants.find(g => g.id === grantId);
    if (!grant) {
      throw new Error(`Grant with ID ${grantId} not found`);
    }

    const application = {
      id: `app-${Date.now()}`,
      grantId: grantId,
      grantName: grant.name,
      organization: grant.organization,
      amount: grant.amount,
      status: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: grant.deadline,
      documents: {
        proposal: null,
        budget: null,
        resume: null,
        demo: null,
        references: []
      },
      notes: '',
      nextSteps: []
    };

    this.applications.applications.push(application);
    this.saveApplications();

    return application;
  }

  // Update application status
  updateApplicationStatus(applicationId, status, notes = '') {
    const application = this.applications.applications.find(app => app.id === applicationId);
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    application.status = status;
    application.updatedAt = new Date().toISOString();
    if (notes) {
      application.notes = notes;
    }

    this.saveApplications();

    // Add to tracking
    this.tracking.tracking.push({
      applicationId: applicationId,
      status: status,
      timestamp: new Date().toISOString(),
      notes: notes
    });
    this.saveTracking();

    return application;
  }

  // Add document to application
  addDocument(applicationId, documentType, documentPath) {
    const application = this.applications.applications.find(app => app.id === applicationId);
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    application.documents[documentType] = documentPath;
    application.updatedAt = new Date().toISOString();
    this.saveApplications();

    return application;
  }

  // Get application status
  getApplicationStatus(applicationId) {
    const application = this.applications.applications.find(app => app.id === applicationId);
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    return {
      status: application.status,
      grantName: application.grantName,
      organization: application.organization,
      amount: application.amount,
      deadline: application.deadline,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      documents: application.documents,
      notes: application.notes
    };
  }

  // Get all applications
  getAllApplications() {
    return this.applications.applications.map(app => ({
      id: app.id,
      grantName: app.grantName,
      organization: app.organization,
      amount: app.amount,
      status: app.status,
      deadline: app.deadline,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
  }

  // Get applications by status
  getApplicationsByStatus(status) {
    return this.applications.applications.filter(app => app.status === status);
  }

  // Get upcoming deadlines
  getUpcomingDeadlines(days = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.applications.applications.filter(app => {
      const deadline = new Date(app.deadline);
      return deadline >= now && deadline <= futureDate;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  // Generate application report
  generateReport() {
    const totalApplications = this.applications.applications.length;
    const statusCounts = {};
    const totalRequested = this.applications.applications.reduce((sum, app) => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      return sum + (app.amount.max || 0);
    }, 0);

    const upcomingDeadlines = this.getUpcomingDeadlines(30);

    return {
      summary: {
        totalApplications,
        totalRequested,
        statusCounts,
        upcomingDeadlines: upcomingDeadlines.length
      },
      applications: this.getAllApplications(),
      upcomingDeadlines: upcomingDeadlines,
      recommendations: this.getRecommendations()
    };
  }

  // Get recommendations
  getRecommendations() {
    const recommendations = [];
    
    // Check for high-priority grants not yet applied to
    const highPriorityGrants = this.getGrantsByPriority('high');
    const appliedGrantIds = this.applications.applications.map(app => app.grantId);
    const unappliedHighPriority = highPriorityGrants.filter(grant => 
      !appliedGrantIds.includes(grant.id)
    );

    if (unappliedHighPriority.length > 0) {
      recommendations.push({
        type: 'high_priority',
        message: `Apply to ${unappliedHighPriority.length} high-priority grants`,
        grants: unappliedHighPriority.map(g => ({ id: g.id, name: g.name, deadline: g.deadline }))
      });
    }

    // Check for upcoming deadlines
    const upcomingDeadlines = this.getUpcomingDeadlines(7);
    if (upcomingDeadlines.length > 0) {
      recommendations.push({
        type: 'deadline',
        message: `${upcomingDeadlines.length} applications due within 7 days`,
        applications: upcomingDeadlines.map(app => ({ id: app.id, grantName: app.grantName, deadline: app.deadline }))
      });
    }

    // Check for draft applications
    const draftApplications = this.getApplicationsByStatus('draft');
    if (draftApplications.length > 0) {
      recommendations.push({
        type: 'draft',
        message: `${draftApplications.length} applications in draft status`,
        applications: draftApplications.map(app => ({ id: app.id, grantName: app.grantName }))
      });
    }

    return recommendations;
  }

  // Export application data
  exportData(format = 'json') {
    const data = {
      grants: this.grants,
      applications: this.applications,
      tracking: this.tracking,
      report: this.generateReport(),
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(data.applications.applications);
    }

    return data;
  }

  // Convert to CSV
  convertToCSV(applications) {
    const headers = ['ID', 'Grant Name', 'Organization', 'Amount Min', 'Amount Max', 'Status', 'Deadline', 'Created At', 'Updated At'];
    const rows = applications.map(app => [
      app.id,
      app.grantName,
      app.organization,
      app.amount.min,
      app.amount.max,
      app.status,
      app.deadline,
      app.createdAt,
      app.updatedAt
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// CLI Interface
function main() {
  const tracker = new GrantTracker();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'list':
        const priority = args[0] || 'high';
        const grants = tracker.getGrantsByPriority(priority);
        console.log(`\n📋 ${priority.toUpperCase()} PRIORITY GRANTS:`);
        grants.forEach(grant => {
          console.log(`\n🎯 ${grant.name}`);
          console.log(`   Organization: ${grant.organization}`);
          console.log(`   Amount: $${grant.amount.min.toLocaleString()} - $${grant.amount.max.toLocaleString()}`);
          console.log(`   Deadline: ${grant.deadline}`);
          console.log(`   Success Rate: ${(grant.success_rate * 100).toFixed(1)}%`);
          console.log(`   URL: ${grant.application_url}`);
        });
        break;

      case 'individuals':
        const individualGrants = tracker.getGrantsForIndividuals();
        console.log(`\n👤 GRANTS FOR INDIVIDUALS:`);
        individualGrants.forEach(grant => {
          console.log(`\n🎯 ${grant.name}`);
          console.log(`   Organization: ${grant.organization}`);
          console.log(`   Amount: $${grant.amount.min.toLocaleString()} - $${grant.amount.max.toLocaleString()}`);
          console.log(`   Deadline: ${grant.deadline}`);
        });
        break;

      case 'deadlines':
        const days = parseInt(args[0]) || 30;
        const upcomingGrants = tracker.getGrantsByDeadline(days);
        console.log(`\n⏰ GRANTS DUE WITHIN ${days} DAYS:`);
        upcomingGrants.forEach(grant => {
          console.log(`\n🎯 ${grant.name}`);
          console.log(`   Organization: ${grant.organization}`);
          console.log(`   Deadline: ${grant.deadline}`);
          console.log(`   Amount: $${grant.amount.min.toLocaleString()} - $${grant.amount.max.toLocaleString()}`);
        });
        break;

      case 'apply':
        const grantId = args[0];
        if (!grantId) {
          console.error('❌ Please provide grant ID');
          process.exit(1);
        }
        const application = tracker.createApplication(grantId);
        console.log(`\n✅ Application created: ${application.id}`);
        console.log(`   Grant: ${application.grantName}`);
        console.log(`   Status: ${application.status}`);
        console.log(`   Deadline: ${application.deadline}`);
        break;

      case 'status':
        const applicationId = args[0];
        if (!applicationId) {
          console.error('❌ Please provide application ID');
          process.exit(1);
        }
        const status = tracker.getApplicationStatus(applicationId);
        console.log(`\n📊 APPLICATION STATUS:`);
        console.log(`   ID: ${applicationId}`);
        console.log(`   Grant: ${status.grantName}`);
        console.log(`   Organization: ${status.organization}`);
        console.log(`   Status: ${status.status}`);
        console.log(`   Amount: $${status.amount.min.toLocaleString()} - $${status.amount.max.toLocaleString()}`);
        console.log(`   Deadline: ${status.deadline}`);
        console.log(`   Created: ${status.createdAt}`);
        console.log(`   Updated: ${status.updatedAt}`);
        break;

      case 'update':
        const appId = args[0];
        const newStatus = args[1];
        const notes = args[2] || '';
        if (!appId || !newStatus) {
          console.error('❌ Please provide application ID and status');
          process.exit(1);
        }
        tracker.updateApplicationStatus(appId, newStatus, notes);
        console.log(`\n✅ Application ${appId} updated to ${newStatus}`);
        break;

      case 'report':
        const report = tracker.generateReport();
        console.log(`\n📈 GRANT APPLICATION REPORT:`);
        console.log(`   Total Applications: ${report.summary.totalApplications}`);
        console.log(`   Total Requested: $${report.summary.totalRequested.toLocaleString()}`);
        console.log(`   Upcoming Deadlines: ${report.summary.upcomingDeadlines}`);
        console.log(`\n📊 STATUS BREAKDOWN:`);
        Object.entries(report.summary.statusCounts).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
        console.log(`\n💡 RECOMMENDATIONS:`);
        report.recommendations.forEach(rec => {
          console.log(`   ${rec.message}`);
        });
        break;

      case 'export':
        const format = args[0] || 'json';
        const data = tracker.exportData(format);
        const filename = `grant-data-${new Date().toISOString().split('T')[0]}.${format}`;
        fs.writeFileSync(filename, data);
        console.log(`\n✅ Data exported to ${filename}`);
        break;

      default:
        console.log(`
🎯 Grant Application Tracker

Usage: node grant-tracker.js <command> [args]

Commands:
  list [priority]           List grants by priority (high/medium/low)
  individuals              List grants available for individuals
  deadlines [days]         List grants due within specified days
  apply <grantId>          Create new application for grant
  status <applicationId>   Get application status
  update <appId> <status> [notes]  Update application status
  report                   Generate application report
  export [format]          Export data (json/csv)

Examples:
  node grant-tracker.js list high
  node grant-tracker.js individuals
  node grant-tracker.js deadlines 30
  node grant-tracker.js apply ton-foundation-2025
  node grant-tracker.js status app-1234567890
  node grant-tracker.js update app-1234567890 submitted
  node grant-tracker.js report
  node grant-tracker.js export csv
        `);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GrantTracker, CONFIG };
