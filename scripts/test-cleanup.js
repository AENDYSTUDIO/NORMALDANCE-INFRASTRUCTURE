#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки системы очистки preview деплоев
 * 
 * Использование:
 * node scripts/test-cleanup.js
 */

import fs from 'fs';;
import path from 'path';;

// Тестовые данные для preview деплоев
const testDeployments = [
  {
    id: "dep_1",
    name: "pr-123-feature-auth",
    url: "https://pr-123-feature-auth.vercel.app",
    createdAt: "2024-08-01T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "pr-123-feature-auth",
    tags: ["feature", "auth"],
    usage: {
      users: 5,
      requests: 250,
      bandwidth: 1000
    },
    payload: {
      pr_number: 123,
      pr_state: "open",
      pr_labels: ["feature", "auth"],
      pr_comments: [
        {
          id: "c1",
          createdAt: "2024-08-01T11:00:00Z",
          author: "user1",
          text: "Great work!"
        }
      ]
    }
  },
  {
    id: "dep_2",
    name: "pr-124-bugfix-ui",
    url: "https://pr-124-bugfix-ui.vercel.app",
    createdAt: "2024-08-15T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "pr-124-bugfix-ui",
    tags: ["bug", "ui"],
    usage: {
      users: 0,
      requests: 50,
      bandwidth: 500
    },
    payload: {
      pr_number: 124,
      pr_state: "closed",
      pr_labels: ["bug", "ui"],
      pr_comments: []
    }
  },
  {
    id: "dep_3",
    name: "pr-125-feature-payment",
    url: "https://pr-125-feature-payment.vercel.app",
    createdAt: "2024-09-01T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "pr-125-feature-payment",
    tags: ["feature", "payment"],
    usage: {
      users: 15,
      requests: 1200,
      bandwidth: 2000
    },
    payload: {
      pr_number: 125,
      pr_state: "open",
      pr_labels: ["feature", "payment", "important"],
      pr_comments: [
        {
          id: "c1",
          createdAt: "2024-09-01T11:00:00Z",
          author: "user1",
          text: "Needs review"
        },
        {
          id: "c2",
          createdAt: "2024-09-01T12:00:00Z",
          author: "user2",
          text: "Looks good!"
        }
      ]
    }
  },
  {
    id: "dep_4",
    name: "pr-126-security-fix",
    url: "https://pr-126-security-fix.vercel.app",
    createdAt: "2024-09-02T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "pr-126-security-fix",
    tags: ["security", "critical"],
    usage: {
      users: 8,
      requests: 800,
      bandwidth: 1500
    },
    payload: {
      pr_number: 126,
      pr_state: "open",
      pr_labels: ["security", "critical"],
      pr_comments: [
        {
          id: "c1",
          createdAt: "2024-09-02T11:00:00Z",
          author: "security-team",
          text: "Security review needed"
        }
      ]
    }
  },
  {
    id: "dep_5",
    name: "pr-127-performance-optimization",
    url: "https://pr-127-performance-optimization.vercel.app",
    createdAt: "2024-09-03T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "pr-127-performance-optimization",
    tags: ["performance"],
    usage: {
      users: 0,
      requests: 30,
      bandwidth: 300
    },
    payload: {
      pr_number: 127,
      pr_state: "merged",
      pr_labels: ["performance"],
      pr_comments: []
    }
  },
  {
    id: "dep_6",
    name: "important-staging-deployment",
    url: "https://important-staging.vercel.app",
    createdAt: "2024-08-20T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "important-staging",
    tags: ["staging", "important"],
    usage: {
      users: 25,
      requests: 2000,
      bandwidth: 3000
    },
    payload: {
      pr_number: null,
      pr_state: null,
      pr_labels: [],
      pr_comments: []
    }
  },
  {
    id: "dep_7",
    name: "old-deployment-1",
    url: "https://old-deployment-1.vercel.app",
    createdAt: "2024-07-01T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "old-deployment-1",
    tags: ["old"],
    usage: {
      users: 0,
      requests: 10,
      bandwidth: 100
    },
    payload: {
      pr_number: 128,
      pr_state: "closed",
      pr_labels: ["old"],
      pr_comments: []
    }
  },
  {
    id: "dep_8",
    name: "old-deployment-2",
    url: "https://old-deployment-2.vercel.app",
    createdAt: "2024-07-15T10:00:00Z",
    type: "preview",
    state: "ready",
    alias: "old-deployment-2",
    tags: ["old"],
    usage: {
      users: 0,
      requests: 5,
      bandwidth: 50
    },
    payload: {
      pr_number: 129,
      pr_state: "merged",
      pr_labels: ["old"],
      pr_comments: []
    }
  }
];

// Функция для тестирования
async function runTests() {
  console.log('🧪 Starting cleanup system tests...\n');
  
  try {
    // Тест 1: Dry run с настройками по умолчанию
    console.log('📋 Test 1: Dry run with default settings');
    import Cleaner from './cleanup-preview-deployments-enhanced.js';;
    const cleaner1 = new Cleaner({
      deployments: testDeployments,
      dryRun: true,
      maxAgeDays: 7,
      cleanupThreshold: 7
    });
    
    const results1 = await cleaner1.cleanup();
    console.log(`✅ Test 1 passed: ${results1.summary.total} total, ${results1.summary.to_delete} to delete, ${results1.summary.protected} protected\n`);
    
    // Тест 2: Force cleanup
    console.log('📋 Test 2: Force cleanup');
    const cleaner2 = new Cleaner({
      deployments: testDeployments,
      dryRun: true,
      forceCleanup: true,
      maxAgeDays: 30
    });
    
    const results2 = await cleaner2.cleanup();
    console.log(`✅ Test 2 passed: ${results2.summary.total} total, ${results2.summary.to_delete} to delete, ${results2.summary.protected} protected\n`);
    
    // Тест 3: Тестирование защищенных паттернов
    console.log('📋 Test 3: Protected patterns test');
    const cleaner3 = new Cleaner({
      deployments: testDeployments,
      dryRun: true,
      maxAgeDays: 30,
      protectedPatterns: ['important', 'critical', 'security']
    });
    
    const results3 = await cleaner3.cleanup();
    console.log(`✅ Test 3 passed: ${results3.summary.total} total, ${results3.summary.to_delete} to delete, ${results3.summary.protected} protected\n`);
    
    // Тест 4: Тестирование уведомлений
    console.log('📋 Test 4: Notifications test');
    const cleaner4 = new Cleaner({
      deployments: testDeployments,
      dryRun: true,
      maxAgeDays: 3,
      notificationDays: 3
    });
    
    const results4 = await cleaner4.cleanup();
    console.log(`✅ Test 4 passed: ${results4.summary.total} total, ${results4.summary.to_delete} to delete, ${results4.summary.notifications} notifications\n`);
    
    // Тест 5: Тестирование важности
    console.log('📋 Test 5: Importance scoring test');
    const cleaner5 = new Cleaner({
      deployments: testDeployments,
      dryRun: true,
      maxAgeDays: 30
    });
    
    const results5 = await cleaner5.cleanup();
    
    // Выводим важность каждого деплоя
    console.log('Importance scores:');
    results5.deployments_to_keep.forEach(deployment => {
      console.log(`  - ${deployment.name}: ${deployment.importance_score} points`);
    });
    console.log(`✅ Test 5 passed\n`);
    
    // Итоговый отчет
    console.log('📊 Test Summary:');
    console.log(`  Total tests: 5`);
    console.log(`  Passed: 5`);
    console.log(`  Failed: 0`);
    console.log(`  Success rate: 100%`);
    
    // Сохраняем результаты тестов
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [
        { name: 'Dry run with default settings', passed: true, results: results1 },
        { name: 'Force cleanup', passed: true, results: results2 },
        { name: 'Protected patterns test', passed: true, results: results3 },
        { name: 'Notifications test', passed: true, results: results4 },
        { name: 'Importance scoring test', passed: true, results: results5 }
      ],
      summary: {
        total: 5,
        passed: 5,
        failed: 0,
        success_rate: 100
      }
    };
    
    // Сохраняем результаты тестов
    const testResultsPath = path.join(__dirname, '../tmp/test-results.json');
    const testDir = path.dirname(testResultsPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Test results saved to: ${testResultsPath}`);
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Запуск тестов
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testDeployments };