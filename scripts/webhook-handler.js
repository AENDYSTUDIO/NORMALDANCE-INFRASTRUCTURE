#!/usr/bin/env node

/**
 * Webhook Handler for NORMALDANCE Preview Deployments
 * 
 * This script handles incoming webhooks from GitHub and GitLab,
 * processes different types of events, and triggers preview deployments.
 * 
 * Features:
 * - GitHub webhook processing (pull requests, issues, comments)
 * - GitLab webhook processing (merge requests, issues, notes)
 * - Event deduplication and rate limiting
 * - Error handling and retry logic
 * - Logging and monitoring
 */

import fs from 'fs';.promises;
import path from 'path';;
import crypto from 'crypto';;
import https from 'https';;
import http from 'http';;
import { exec  } from 'child_process';;
import { promisify  } from 'util';;

const execAsync = promisify(exec);

class WebhookHandler {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      secret: config.secret || process.env.WEBHOOK_SECRET || '',
      githubToken: config.githubToken || process.env.GITHUB_TOKEN || '',
      gitlabToken: config.gitlabToken || process.env.GITLAB_TOKEN || '',
      vercelToken: config.vercelToken || process.env.VERCEL_TOKEN || '',
      vercelOrgId: config.vercelOrgId || process.env.VERCEL_ORG_ID || '',
      vercelProjectId: config.vercelProjectId || process.env.VERCEL_PROJECT_ID || '',
      logLevel: config.logLevel || 'info',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: config.rateLimitMax || 10,
      ...config
    };

    this.rateLimit = new Map();
    this.eventHistory = new Map();
    this.logger = this.createLogger();
    
    // Load trigger configuration
    this.triggerConfig = this.loadTriggerConfig();
  }

  /**
   * Create logger instance
   */
  createLogger() {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    return {
      log: (level, message, ...args) => {
        if (levels[level] <= levels[this.config.logLevel]) {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
        }
      },
      error: (message, ...args) => this.log('error', message, ...args),
      warn: (message, ...args) => this.log('warn', message, ...args),
      info: (message, ...args) => this.log('info', message, ...args),
      debug: (message, ...args) => this.log('debug', message, ...args)
    };
  }

  /**
   * Load trigger configuration
   */
  async loadTriggerConfig() {
    try {
      const configPath = path.join(__dirname, 'trigger-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      this.logger.warn('Failed to load trigger config, using defaults', error.message);
      return this.getDefaultTriggerConfig();
    }
  }

  /**
   * Get default trigger configuration
   */
  getDefaultTriggerConfig() {
    return {
      github: {
        enabled: true,
        events: {
          pull_request: ['opened', 'synchronize', 'reopened', 'edited'],
          issue_comment: ['created', 'edited'],
          pull_request_review: ['submitted', 'edited'],
          push: ['push']
        },
        branches: {
          include: ['main', 'develop', 'feature/*', 'hotfix/*', 'bugfix/*', 'release/*'],
          exclude: ['dependabot/*', 'renovate/*']
        },
        comment_triggers: ['/deploy', '/preview', '/deploy-preview'],
        auto_deploy: true,
        skip_tests_on: ['hotfix/*', 'bugfix/*'],
        force_deploy_after: 600000 // 10 minutes
      },
      gitlab: {
        enabled: false,
        events: {
          MergeRequestEvents: ['opened', 'updated', 'reopened'],
          IssueEvents: ['opened', 'updated'],
          NoteEvents: ['created', 'updated']
        },
        branches: {
          include: ['main', 'develop', 'feature/*', 'hotfix/*', 'bugfix/*', 'release/*'],
          exclude: ['dependabot/*', 'renovate/*']
        },
        comment_triggers: ['/deploy', '/preview', '/deploy-preview'],
        auto_deploy: true,
        skip_tests_on: ['hotfix/*', 'bugfix/*'],
        force_deploy_after: 600000
      }
    };
  }

  /**
   * Start webhook server
   */
  async start() {
    const server = http.createServer((req, res) => this.handleRequest(req, res));
    
    server.listen(this.config.port, () => {
      this.logger.info(`Webhook server started on port ${this.config.port}`);
    });

    server.on('error', (error) => {
      this.logger.error('Server error', error);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown(server));
    process.on('SIGINT', () => this.shutdown(server));
  }

  /**
   * Handle incoming HTTP request
   */
  async handleRequest(req, res) {
    try {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gitlab-Token, X-Hub-Signature-256');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Handle GET requests for health check
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // Handle POST requests
      if (req.method === 'POST') {
        const body = await this.getRequestBody(req);
        const signature = req.headers['x-hub-signature-256'];
        const gitlabToken = req.headers['x-gitlab-token'];

        // Verify signature for GitHub
        if (signature && this.config.secret) {
          if (!this.verifyGitHubSignature(body, signature)) {
            this.logger.warn('Invalid GitHub signature');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid signature' }));
            return;
          }
        }

        // Verify GitLab token
        if (gitlabToken && gitlabToken !== this.config.gitlabToken) {
          this.logger.warn('Invalid GitLab token');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid token' }));
          return;
        }

        // Process webhook
        const result = await this.processWebhook(body, req.headers);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      // Handle other methods
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    } catch (error) {
      this.logger.error('Error handling request', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  /**
   * Get request body
   */
  getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Verify GitHub signature
   */
  verifyGitHubSignature(body, signature) {
    if (!this.config.secret) return true;
    
    const hmac = crypto.createHmac('sha256', this.config.secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(body)).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  /**
   * Process webhook payload
   */
  async processWebhook(payload, headers) {
    try {
      const eventType = headers['x-github-event'] || headers['x-gitlab-event'];
      const eventSource = headers['x-github-event'] ? 'github' : 'gitlab';
      
      this.logger.info(`Processing ${eventSource} event: ${eventType}`, payload);

      // Check rate limiting
      if (!this.checkRateLimit(eventSource, payload)) {
        this.logger.warn('Rate limit exceeded, skipping event');
        return { status: 'skipped', reason: 'rate_limit' };
      }

      // Check for duplicate events
      if (this.isDuplicateEvent(eventSource, payload)) {
        this.logger.warn('Duplicate event detected, skipping');
        return { status: 'skipped', reason: 'duplicate' };
      }

      // Process based on event type and source
      let result;
      if (eventSource === 'github') {
        result = await this.processGitHubEvent(eventType, payload);
      } else if (eventSource === 'gitlab') {
        result = await this.processGitLabEvent(eventType, payload);
      } else {
        throw new Error(`Unsupported event source: ${eventSource}`);
      }

      // Store event in history
      this.storeEvent(eventSource, payload, result);

      return result;
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      throw error;
    }
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(eventSource, payload) {
    const key = `${eventSource}_${payload.repository?.id || payload.project_id}`;
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    if (!this.rateLimit.has(key)) {
      this.rateLimit.set(key, []);
    }
    
    const events = this.rateLimit.get(key);
    const recentEvents = events.filter(time => time > windowStart);
    
    if (recentEvents.length >= this.config.rateLimitMax) {
      return false;
    }
    
    recentEvents.push(now);
    this.rateLimit.set(key, recentEvents);
    
    return true;
  }

  /**
   * Check for duplicate events
   */
  isDuplicateEvent(eventSource, payload) {
    const key = `${eventSource}_${payload.repository?.id || payload.project_id}_${payload.id || payload.object_attributes?.iid}`;
    const now = Date.now();
    const eventWindow = 30000; // 30 seconds
    
    if (!this.eventHistory.has(key)) {
      this.eventHistory.set(key, []);
    }
    
    const events = this.eventHistory.get(key);
    const recentEvents = events.filter(time => now - time < eventWindow);
    
    if (recentEvents.length > 0) {
      return true;
    }
    
    events.push(now);
    this.eventHistory.set(key, events);
    
    return false;
  }

  /**
   * Store event in history
   */
  storeEvent(eventSource, payload, result) {
    const key = `${eventSource}_${payload.repository?.id || payload.project_id}_${payload.id || payload.object_attributes?.iid}`;
    const event = {
      timestamp: new Date().toISOString(),
      payload: payload,
      result: result
    };
    
    // Store in file system for persistence
    const eventDir = path.join(__dirname, '../data/webhook-events');
    const eventFile = path.join(eventDir, `${key}_${Date.now()}.json`);
    
    fs.mkdir(eventDir, { recursive: true })
      .then(() => fs.writeFile(eventFile, JSON.stringify(event, null, 2)))
      .catch(error => this.logger.warn('Failed to store event', error.message));
  }

  /**
   * Process GitHub events
   */
  async processGitHubEvent(eventType, payload) {
    const config = this.triggerConfig.github;
    
    if (!config.enabled) {
      return { status: 'skipped', reason: 'disabled' };
    }

    switch (eventType) {
      case 'pull_request':
        return await this.processGitHubPullRequest(payload, config);
      
      case 'issue_comment':
        return await this.processGitHubIssueComment(payload, config);
      
      case 'pull_request_review':
        return await this.processGitHubPullRequestReview(payload, config);
      
      case 'push':
        return await this.processGitHubPush(payload, config);
      
      default:
        this.logger.warn(`Unsupported GitHub event type: ${eventType}`);
        return { status: 'skipped', reason: 'unsupported_event' };
    }
  }

  /**
   * Process GitHub pull request events
   */
  async processGitHubPullRequest(payload, config) {
    const { action, pull_request, repository } = payload;
    const { head, number } = pull_request;
    
    // Check if action is enabled
    if (!config.events.pull_request.includes(action)) {
      return { status: 'skipped', reason: 'action_not_enabled' };
    }
    
    // Check branch patterns
    if (!this.matchesBranchPattern(head.ref, config.branches)) {
      return { status: 'skipped', reason: 'branch_not_matched' };
    }
    
    // Check if we should skip tests
    const skipTests = this.shouldSkipTests(head.ref, config);
    
    // Trigger deployment
    return await this.triggerGitHubDeployment({
      action,
      prNumber: number,
      prHead: head.ref,
      prBase: pull_request.base.ref,
      repository: repository.full_name,
      skipTests,
      forceDeploy: action === 'synchronize'
    });
  }

  /**
   * Process GitHub issue comment events
   */
  async processGitHubIssueComment(payload, config) {
    const { action, comment, issue, repository } = payload;
    const { body } = comment;
    
    // Check if action is enabled
    if (!config.events.issue_comment.includes(action)) {
      return { status: 'skipped', reason: 'action_not_enabled' };
    }
    
    // Check if comment contains trigger command
    const hasTrigger = config.comment_triggers.some(trigger => body.includes(trigger));
    if (!hasTrigger) {
      return { status: 'skipped', reason: 'no_trigger_command' };
    }
    
    // Check if it's a pull request
    if (!issue.pull_request) {
      return { status: 'skipped', reason: 'not_a_pull_request' };
    }
    
    // Get pull request details
    const prResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/pulls/${issue.number}`, {
      headers: {
        'Authorization': `token ${this.config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!prResponse.ok) {
      throw new Error(`Failed to fetch PR: ${prResponse.statusText}`);
    }
    
    const pr = await prResponse.json();
    
    // Check branch patterns
    if (!this.matchesBranchPattern(pr.head.ref, config.branches)) {
      return { status: 'skipped', reason: 'branch_not_matched' };
    }
    
    // Check if we should skip tests
    const skipTests = this.shouldSkipTests(pr.head.ref, config);
    
    // Trigger deployment
    return await this.triggerGitHubDeployment({
      action: 'comment_trigger',
      prNumber: issue.number,
      prHead: pr.head.ref,
      prBase: pr.base.ref,
      repository: repository.full_name,
      skipTests,
      forceDeploy: true,
      comment: body
    });
  }

  /**
   * Process GitHub pull request review events
   */
  async processGitHubPullRequestReview(payload, config) {
    const { action, pull_request, review, repository } = payload;
    
    // Check if action is enabled
    if (!config.events.pull_request_review.includes(action)) {
      return { status: 'skipped', reason: 'action_not_enabled' };
    }
    
    // Check if review is approved
    if (action === 'submitted' && review.state === 'approved') {
      // Trigger deployment on approval
      return await this.triggerGitHubDeployment({
        action: 'review_approved',
        prNumber: pull_request.number,
        prHead: pull_request.head.ref,
        prBase: pull_request.base.ref,
        repository: repository.full_name,
        skipTests: false,
        forceDeploy: true
      });
    }
    
    return { status: 'skipped', reason: 'not_approved' };
  }

  /**
   * Process GitHub push events
   */
  async processGitHubPush(payload, config) {
    const { ref, repository } = payload;
    
    // Check if it's a branch push
    if (!ref.startsWith('refs/heads/')) {
      return { status: 'skipped', reason: 'not_a_branch_push' };
    }
    
    const branch = ref.replace('refs/heads/', '');
    
    // Check branch patterns
    if (!this.matchesBranchPattern(branch, config.branches)) {
      return { status: 'skipped', reason: 'branch_not_matched' };
    }
    
    // Check if auto deploy is enabled
    if (!config.auto_deploy) {
      return { status: 'skipped', reason: 'auto_deploy_disabled' };
    }
    
    // Trigger deployment
    return await this.triggerGitHubDeployment({
      action: 'push',
      branch,
      repository: repository.full_name,
      skipTests: this.shouldSkipTests(branch, config),
      forceDeploy: false
    });
  }

  /**
   * Process GitLab events
   */
  async processGitLabEvent(eventType, payload) {
    const config = this.triggerConfig.gitlab;
    
    if (!config.enabled) {
      return { status: 'skipped', reason: 'disabled' };
    }

    switch (eventType) {
      case 'MergeRequestEvents':
        return await this.processGitLabMergeRequest(payload, config);
      
      case 'IssueEvents':
        return await this.processGitLabIssue(payload, config);
      
      case 'NoteEvents':
        return await this.processGitLabNote(payload, config);
      
      default:
        this.logger.warn(`Unsupported GitLab event type: ${eventType}`);
        return { status: 'skipped', reason: 'unsupported_event' };
    }
  }

  /**
   * Process GitLab merge request events
   */
  async processGitLabMergeRequest(payload, config) {
    const { object_attributes, project } = payload;
    const { action, source_branch, target_branch, iid } = object_attributes;
    
    // Check if action is enabled
    if (!config.events.MergeRequestEvents.includes(action)) {
      return { status: 'skipped', reason: 'action_not_enabled' };
    }
    
    // Check branch patterns
    if (!this.matchesBranchPattern(source_branch, config.branches)) {
      return { status: 'skipped', reason: 'branch_not_matched' };
    }
    
    // Check if we should skip tests
    const skipTests = this.shouldSkipTests(source_branch, config);
    
    // Trigger deployment
    return await this.triggerGitLabDeployment({
      action,
      mrNumber: iid,
      sourceBranch: source_branch,
      targetBranch: target_branch,
      project: project.path_with_namespace,
      skipTests,
      forceDeploy: action === 'update'
    });
  }

  /**
   * Process GitLab issue events
   */
  async processGitLabIssue(payload, config) {
    const { object_attributes, project } = payload;
    const { action, iid } = object_attributes;
    
    // Check if action is enabled
    if (!config.events.IssueEvents.includes(action)) {
      return { status: 'skipped', reason: 'action_not_enabled' };
    }
    
    // GitLab issues don't have direct deployment triggers
    return { status: 'skipped', reason: 'no_deployment_trigger' };
  }

  /**
   * Process GitLab note events
   */
  async processGitLabNote(payload, config) {
    const { object_attributes, project, note } = payload;
    const { noteable_type } = object_attributes;
    
    // Check if it's a merge request note
    if (noteable_type !== 'MergeRequest') {
      return { status: 'skipped', reason: 'not_a_merge_request' };
    }
    
    // Check if comment contains trigger command
    const hasTrigger = config.comment_triggers.some(trigger => note.body.includes(trigger));
    if (!hasTrigger) {
      return { status: 'skipped', reason: 'no_trigger_command' };
    }
    
    // Get merge request details
    const mrResponse = await fetch(`https://gitlab.com/api/v4/projects/${project.id}/merge_requests/${object_attributes.iid}`, {
      headers: {
        'PRIVATE-TOKEN': this.config.gitlabToken,
        'Accept': 'application/json'
      }
    });
    
    if (!mrResponse.ok) {
      throw new Error(`Failed to fetch MR: ${mrResponse.statusText}`);
    }
    
    const mr = await mrResponse.json();
    
    // Check branch patterns
    if (!this.matchesBranchPattern(mr.source_branch, config.branches)) {
      return { status: 'skipped', reason: 'branch_not_matched' };
    }
    
    // Check if we should skip tests
    const skipTests = this.shouldSkipTests(mr.source_branch, config);
    
    // Trigger deployment
    return await this.triggerGitLabDeployment({
      action: 'comment_trigger',
      mrNumber: object_attributes.iid,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      project: project.path_with_namespace,
      skipTests,
      forceDeploy: true,
      comment: note.body
    });
  }

  /**
   * Check if branch matches pattern
   */
  matchesBranchPattern(branch, branchConfig) {
    const { include, exclude } = branchConfig;
    
    // Check exclude patterns first
    for (const pattern of exclude) {
      if (this.matchesPattern(branch, pattern)) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of include) {
      if (this.matchesPattern(branch, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if string matches pattern
   */
  matchesPattern(str, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(str);
    }
    return str === pattern;
  }

  /**
   * Check if tests should be skipped
   */
  shouldSkipTests(branch, config) {
    return config.skip_tests_on.some(pattern => this.matchesPattern(branch, pattern));
  }

  /**
   * Trigger GitHub deployment
   */
  async triggerGitHubDeployment(options) {
    const { action, prNumber, prHead, prBase, repository, skipTests, forceDeploy, comment } = options;
    
    this.logger.info(`Triggering GitHub deployment for PR #${prNumber}`, options);
    
    try {
      // Trigger GitHub Actions workflow
      const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/auto-preview-deployments.yml/dispatches`;
      
      const payload = {
        ref: prHead,
        inputs: {
          pr_number: prNumber,
          skip_tests: skipTests,
          force_deploy: forceDeploy
        }
      };
      
      const response = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      this.logger.info(`GitHub deployment triggered successfully for PR #${prNumber}`);
      
      return {
        status: 'success',
        action,
        prNumber,
        repository,
        skipTests,
        forceDeploy,
        comment,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to trigger GitHub deployment for PR #${prNumber}`, error);
      throw error;
    }
  }

  /**
   * Trigger GitLab deployment
   */
  async triggerGitLabDeployment(options) {
    const { action, mrNumber, sourceBranch, targetBranch, project, skipTests, forceDeploy, comment } = options;
    
    this.logger.info(`Triggering GitLab deployment for MR !${mrNumber}`, options);
    
    try {
      // Trigger GitLab CI/CD pipeline
      const pipelineUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(project)}/pipeline`;
      
      const payload = {
        ref: sourceBranch,
        variables: [
          { key: 'MR_NUMBER', value: mrNumber.toString() },
          { key: 'SKIP_TESTS', value: skipTests.toString() },
          { key: 'FORCE_DEPLOY', value: forceDeploy.toString() },
          { key: 'COMMENT_TRIGGER', value: comment || '' }
        ]
      };
      
      const response = await fetch(pipelineUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': this.config.gitlabToken,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }
      
      const pipeline = await response.json();
      
      this.logger.info(`GitLab deployment triggered successfully for MR !${mrNumber}`, pipeline);
      
      return {
        status: 'success',
        action,
        mrNumber,
        project,
        pipelineId: pipeline.id,
        skipTests,
        forceDeploy,
        comment,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to trigger GitLab deployment for MR !${mrNumber}`, error);
      throw error;
    }
  }

  /**
   * Shutdown server gracefully
   */
  async shutdown(server) {
    this.logger.info('Shutting down webhook server...');
    
    // Close server
    await new Promise((resolve) => {
      server.close(() => {
        this.logger.info('Webhook server closed');
        resolve();
      });
    });
    
    // Cleanup
    this.rateLimit.clear();
    this.eventHistory.clear();
    
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const config = {
    port: process.env.PORT || 3000,
    secret: process.env.WEBHOOK_SECRET,
    githubToken: process.env.GITHUB_TOKEN,
    gitlabToken: process.env.GITLAB_TOKEN,
    vercelToken: process.env.VERCEL_TOKEN,
    vercelOrgId: process.env.VERCEL_ORG_ID,
    vercelProjectId: process.env.VERCEL_PROJECT_ID,
    logLevel: process.env.LOG_LEVEL || 'info'
  };
  
  const handler = new WebhookHandler(config);
  
  handler.start().catch(error => {
    console.error('Failed to start webhook handler:', error);
    process.exit(1);
  });
}

module.exports = WebhookHandler;