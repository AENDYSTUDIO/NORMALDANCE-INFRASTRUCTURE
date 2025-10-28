import React, { useState, useEffect } from 'react';
import { WalletAdapter } from './wallet-adapter';
import { SecurityAuditManager } from '../../lib/wallet/security-audit-manager';
import { PenetrationTestingSuite } from '../../lib/wallet/penetration-testing-suite';
import { ResilienceTester } from '../../lib/wallet/resilience-tester';
import { VulnerabilityScanner } from '../../lib/wallet/vulnerability-scanner';
import { StressTester } from '../../lib/wallet/stress-tester';

/**
 * Интерфейс для тестирования безопасности Invisible Wallet
 * Предоставляет UI для запуска тестов безопасности,
 * отображения результатов и рекомендаций по улучшению безопасности
 */
interface SecurityTestUIProps {
  walletAdapter: WalletAdapter;
}

interface TestResults {
  securityAudit: any;
  penetrationTest: any;
 resilienceTest: any;
  vulnerabilityScan: any;
  stressTest: any;
}

const SecurityTestUI: React.FC<SecurityTestUIProps> = ({ walletAdapter }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [testProgress, setTestProgress] = useState(0);
  const [testLog, setTestLog] = useState<string[]>([]);

  // Инициализация менеджеров тестирования
  const securityAuditManager = new SecurityAuditManager();
  const penetrationTestingSuite = new PenetrationTestingSuite();
  const resilienceTester = new ResilienceTester();
  const vulnerabilityScanner = new VulnerabilityScanner();
  const stressTester = new StressTester();

  // Функция добавления лога
  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Функция запуска комплексного тестирования
  const runComprehensiveTest = async () => {
    setIsTesting(true);
    setTestProgress(0);
    setTestLog([]);
    setResults(null);

    try {
      addLog('Starting comprehensive security test...');
      
      // Обновляем прогресс
      setTestProgress(10);
      addLog('Running security audit...');
      
      // Запускаем аудит безопасности
      const securityAuditResults = await securityAuditManager.performFullSecurityAudit(walletAdapter);
      setTestProgress(25);
      addLog('Security audit completed');
      
      // Запускаем тесты на проникновение
      addLog('Running penetration tests...');
      const penetrationTestResults = await penetrationTestingSuite.performFullPenetrationTest(walletAdapter);
      setTestProgress(40);
      addLog('Penetration tests completed');
      
      // Запускаем тесты отказоустойчивости
      addLog('Running resilience tests...');
      const resilienceTestResults = await resilienceTester.performFullResilienceTest(walletAdapter);
      setTestProgress(60);
      addLog('Resilience tests completed');
      
      // Запускаем сканирование уязвимостей
      addLog('Running vulnerability scan...');
      const vulnerabilityScanResults = await vulnerabilityScanner.scanAll();
      setTestProgress(80);
      addLog('Vulnerability scan completed');
      
      // Запускаем стресс-тестирование
      addLog('Running stress tests...');
      const stressTestResults = await stressTester.performFullStressTest(walletAdapter);
      setTestProgress(95);
      addLog('Stress tests completed');
      
      // Собираем все результаты
      const allResults: TestResults = {
        securityAudit: securityAuditResults,
        penetrationTest: penetrationTestResults,
        resilienceTest: resilienceTestResults,
        vulnerabilityScan: vulnerabilityScanResults,
        stressTest: stressTestResults
      };
      
      setResults(allResults);
      setTestProgress(100);
      addLog('All tests completed successfully');
    } catch (error) {
      addLog(`Error during testing: ${error.message || error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Функция запуска отдельных тестов
  const runSpecificTest = async (testType: string) => {
    setIsTesting(true);
    addLog(`Running ${testType} test...`);
    
    try {
      let testResult;
      
      switch (testType) {
        case 'security-audit':
          testResult = await securityAuditManager.performFullSecurityAudit(walletAdapter);
          break;
        case 'penetration':
          testResult = await penetrationTestingSuite.performFullPenetrationTest(walletAdapter);
          break;
        case 'resilience':
          testResult = await resilienceTester.performFullResilienceTest(walletAdapter);
          break;
        case 'vulnerability':
          testResult = await vulnerabilityScanner.scanAll();
          break;
        case 'stress':
          testResult = await stressTester.performFullStressTest(walletAdapter);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
      
      setResults(prev => ({
        ...prev,
        [`${testType}Test`]: testResult
      }));
      
      addLog(`${testType} test completed`);
    } catch (error) {
      addLog(`Error during ${testType} test: ${error.message || error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Функция получения общего статуса безопасности
  const getOverallSecurityStatus = (): { level: 'high' | 'medium' | 'low'; message: string } => {
    if (!results) {
      return { level: 'medium', message: 'No test results available' };
    }
    
    // Подсчитываем количество проблем
    let totalIssues = 0;
    
    // Проверяем результаты аудита безопасности
    if (results.securityAudit) {
      const { keyStorage, cryptoOperations, transactionIntegrity, suspiciousTransactions } = results.securityAudit;
      totalIssues += keyStorage.issues.length;
      totalIssues += cryptoOperations.issues.length;
      totalIssues += transactionIntegrity.issues.length;
      totalIssues += suspiciousTransactions.issues.length;
    }
    
    // Проверяем результаты тестов на проникновение
    if (results.penetrationTest) {
      const { keyStorage, phishingProtection, authentication, dataIntegrity, 
              xssVulnerabilities, csrfVulnerabilities, browserLevel, deviceLevel } = results.penetrationTest;
      totalIssues += keyStorage.issues.length;
      totalIssues += phishingProtection.issues.length;
      totalIssues += authentication.issues.length;
      totalIssues += dataIntegrity.issues.length;
      totalIssues += xssVulnerabilities.issues.length;
      totalIssues += csrfVulnerabilities.issues.length;
      totalIssues += browserLevel.issues.length;
      totalIssues += deviceLevel.issues.length;
    }
    
    // Проверяем результаты тестов отказоустойчивости
    if (results.resilienceTest) {
      const { weakConnection, recoveryAfterFailure, offlineFunctionality, 
              dataSynchronization, failureResilience, completeDisconnectionRecovery } = results.resilienceTest;
      totalIssues += weakConnection.issues.length;
      totalIssues += recoveryAfterFailure.issues.length;
      totalIssues += offlineFunctionality.issues.length;
      totalIssues += dataSynchronization.issues.length;
      totalIssues += failureResilience.issues.length;
      totalIssues += completeDisconnectionRecovery.issues.length;
    }
    
    // Проверяем результаты сканирования уязвимостей
    if (results.vulnerabilityScan) {
      totalIssues += results.vulnerabilityScan.vulnerabilities.length;
    }
    
    // Проверяем результаты стресс-тестирования
    if (results.stressTest) {
      totalIssues += results.stressTest.performance.issues.length;
      totalIssues += results.stressTest.ddos.issues.length;
      totalIssues += results.stressTest.transactions.issues.length;
      totalIssues += results.stressTest.caching.issues.length;
    }
    
    // Определяем уровень безопасности на основе количества проблем
    if (totalIssues === 0) {
      return { level: 'high', message: 'No security issues detected' };
    } else if (totalIssues <= 5) {
      return { level: 'medium', message: 'Few minor security issues detected' };
    } else {
      return { level: 'low', message: 'Multiple security issues detected' };
    }
  };

  // Функция получения рекомендаций
  const getRecommendations = (): string[] => {
    if (!results) return [];
    
    const recommendations: string[] = [];
    
    // Рекомендации на основе результатов аудита безопасности
    if (results.securityAudit) {
      const { keyStorage, cryptoOperations, transactionIntegrity, suspiciousActivity, suspiciousTransactions } = results.securityAudit;
      
      if (!keyStorage.secure) {
        recommendations.push('Улучшить безопасность хранения ключей');
      }
      
      if (!cryptoOperations.valid) {
        recommendations.push('Проверить криптографические операции');
      }
      
      if (!transactionIntegrity.intact) {
        recommendations.push('Проверить целостность транзакций');
      }
      
      if (suspiciousActivity.suspicious) {
        recommendations.push('Проверить подозрительную активность');
      }
      
      if (suspiciousTransactions.suspicious) {
        recommendations.push('Проанализировать подозрительные транзакции');
      }
    }
    
    // Рекомендации на основе результатов тестов на проникновение
    if (results.penetrationTest) {
      const { keyStorage, phishingProtection, authentication, dataIntegrity } = results.penetrationTest;
      
      if (keyStorage.vulnerable) {
        recommendations.push('Усилить защиту хранения ключей');
      }
      
      if (phishingProtection.vulnerable) {
        recommendations.push('Улучшить защиту от фишинга');
      }
      
      if (authentication.vulnerable) {
        recommendations.push('Усилить аутентификацию');
      }
      
      if (dataIntegrity.vulnerable) {
        recommendations.push('Улучшить целостность данных');
      }
    }
    
    // Рекомендации на основе результатов тестов отказоустойчивости
    if (results.resilienceTest) {
      const { weakConnection, recoveryAfterFailure, offlineFunctionality, dataSynchronization } = results.resilienceTest;
      
      if (!weakConnection.resilient) {
        recommendations.push('Улучшить работу в условиях слабого соединения');
      }
      
      if (!recoveryAfterFailure.resilient) {
        recommendations.push('Улучшить восстановление после сбоев');
      }
      
      if (!offlineFunctionality.resilient) {
        recommendations.push('Улучшить оффлайн функциональность');
      }
      
      if (!dataSynchronization.resilient) {
        recommendations.push('Улучшить синхронизацию данных');
      }
    }
    
    // Рекомендации на основе результатов сканирования уязвимостей
    if (results.vulnerabilityScan) {
      if (results.vulnerabilityScan.vulnerabilities.length > 0) {
        recommendations.push('Устранить обнаруженные уязвимости');
      }
    }
    
    // Рекомендации на основе результатов стресс-тестирования
    if (results.stressTest) {
      const { performance, ddos, transactions, caching } = results.stressTest;
      
      if (!performance.passed) {
        recommendations.push('Оптимизировать производительность');
      }
      
      if (!ddos.passed) {
        recommendations.push('Улучшить защиту от DDoS');
      }
      
      if (!transactions.passed) {
        recommendations.push('Улучшить обработку одновременных транзакций');
      }
      
      if (!caching.passed) {
        recommendations.push('Оптимизировать кэширование');
      }
    }
    
    return recommendations;
  };

  const securityStatus = getOverallSecurityStatus();
  const recommendations = getRecommendations();

  return (
    <div className="security-test-ui">
      <div className="header">
        <h2>Тестирование безопасности Invisible Wallet</h2>
        <div className="security-status">
          <span className={`status-indicator ${securityStatus.level}`}>
            Уровень безопасности: {securityStatus.level}
          </span>
          <span className="status-message">{securityStatus.message}</span>
        </div>
      </div>
      
      <div className="controls">
        <button 
          onClick={runComprehensiveTest} 
          disabled={isTesting}
          className="primary-btn"
        >
          {isTesting ? 'Тестирование...' : 'Запустить полное тестирование'}
        </button>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${testProgress}%` }}
          ></div>
          <span className="progress-text">{testProgress}%</span>
        </div>
        
        <div className="quick-tests">
          <h3>Быстрые тесты:</h3>
          <button onClick={() => runSpecificTest('security-audit')} disabled={isTesting}>Аудит безопасности</button>
          <button onClick={() => runSpecificTest('penetration')} disabled={isTesting}>Тесты на проникновение</button>
          <button onClick={() => runSpecificTest('resilience')} disabled={isTesting}>Отказоустойчивость</button>
          <button onClick={() => runSpecificTest('vulnerability')} disabled={isTesting}>Сканирование уязвимостей</button>
          <button onClick={() => runSpecificTest('stress')} disabled={isTesting}>Стресс-тестирование</button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button 
          className={activeTab === 'results' ? 'active' : ''} 
          onClick={() => setActiveTab('results')}
        >
          Результаты
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'active' : ''} 
          onClick={() => setActiveTab('recommendations')}
        >
          Рекомендации
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          Логи
        </button>
      </div>
      
      <div className="content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="summary-cards">
              <div className="card">
                <h3>Аудит безопасности</h3>
                <p>Проверяет безопасность хранения ключей, валидацию криптографических операций, целостность транзакций и мониторит подозрительную активность</p>
              </div>
              
              <div className="card">
                <h3>Тесты на проникновение</h3>
                <p>Тестирует уязвимости хранения ключей, защиту от фишинга, аутентификацию и целостность данных</p>
              </div>
              
              <div className="card">
                <h3>Отказоустойчивость</h3>
                <p>Тестирует работу в условиях слабого соединения, восстановление после сбоев, оффлайн функциональность и синхронизацию данных</p>
              </div>
              
              <div className="card">
                <h3>Сканирование уязвимостей</h3>
                <p>Автоматическое сканирование уязвимостей, проверка на известные векторы атак, оценка уровня риска</p>
              </div>
              
              <div className="card">
                <h3>Стресс-тестирование</h3>
                <p>Тестирование производительности, проверка устойчивости к DDoS, тестирование одновременных транзакций, проверка кэширования под нагрузкой</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'results' && (
          <div className="results-tab">
            {results ? (
              <div className="results-content">
                <h3>Результаты тестирования</h3>
                
                <details className="result-section">
                  <summary>Аудит безопасности</summary>
                  <pre>{JSON.stringify(results.securityAudit, null, 2)}</pre>
                </details>
                
                <details className="result-section">
                  <summary>Тесты на проникновение</summary>
                  <pre>{JSON.stringify(results.penetrationTest, null, 2)}</pre>
                </details>
                
                <details className="result-section">
                  <summary>Тесты отказоустойчивости</summary>
                  <pre>{JSON.stringify(results.resilienceTest, null, 2)}</pre>
                </details>
                
                <details className="result-section">
                  <summary>Сканирование уязвимостей</summary>
                  <pre>{JSON.stringify(results.vulnerabilityScan, null, 2)}</pre>
                </details>
                
                <details className="result-section">
                  <summary>Стресс-тестирование</summary>
                  <pre>{JSON.stringify(results.stressTest, null, 2)}</pre>
                </details>
              </div>
            ) : (
              <p>Результаты тестирования отсутствуют. Запустите тестирование для получения результатов.</p>
            )}
          </div>
        )}
        
        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h3>Рекомендации по улучшению безопасности</h3>
            {recommendations.length > 0 ? (
              <ul className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p>Рекомендации отсутствуют. Запустите тестирование для получения рекомендаций.</p>
            )}
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="logs-tab">
            <h3>Логи тестирования</h3>
            <div className="logs-container">
              {testLog.length > 0 ? (
                testLog.map((log, index) => (
                  <div key={index} className="log-entry">{log}</div>
                ))
              ) : (
                <p>Логи отсутствуют. Запустите тестирование для просмотра логов.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityTestUI;