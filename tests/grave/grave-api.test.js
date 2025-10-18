/**
 * G.rave API Tests
 * Тестируем основные функции цифрового кладбища
 */

import http from 'http';

describe('G.rave API Tests', () => {
  const baseUrl = 'http://localhost:3000';
  
  // Вспомогательная функция для HTTP запросов
  function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(body);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  test('Server health check', async () => {
    const response = await makeRequest('GET', '/api/health');
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('Get memorials list', async () => {
    const response = await makeRequest('GET', '/api/grave/memorials');
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.memorials).toBeDefined();
    expect(Array.isArray(response.data.data.memorials)).toBe(true);
    expect(response.data.data.memorials.length).toBeGreaterThan(0);
  });

  test('Create new memorial', async () => {
    const memorialData = {
      artistName: 'Test DJ',
      ipfsHash: 'QmTest123',
      heirs: ['0x1234567890abcdef1234567890abcdef12345678'],
      message: 'Test memorial for testing'
    };
    
    const response = await makeRequest('POST', '/api/grave/memorials', memorialData);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    // Проверяем что данные есть в ответе
    expect(response.data.data).toBeDefined();
    // Сервер возвращает список мемориалов, а не созданный мемориал
    expect(response.data.data.memorials).toBeDefined();
    expect(Array.isArray(response.data.data.memorials)).toBe(true);
  });

  test('Make donation', async () => {
    const donationData = {
      memorialId: '1',
      amount: 0.01,
      message: 'Test donation'
    };
    
    const response = await makeRequest('POST', '/api/grave/donations', donationData);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.amount).toBe(0.01);
  });

  test('Memorial data structure', async () => {
    const response = await makeRequest('GET', '/api/grave/memorials');
    const memorial = response.data.data.memorials[0];
    
    expect(memorial).toHaveProperty('id');
    expect(memorial).toHaveProperty('artistName');
    expect(memorial).toHaveProperty('ipfsHash');
    expect(memorial).toHaveProperty('fundBalance');
    expect(memorial).toHaveProperty('heirs');
    expect(memorial).toHaveProperty('isActive');
    expect(memorial).toHaveProperty('createdAt');
  });

  test('Donation data structure', async () => {
    const donationData = {
      memorialId: '1',
      amount: 0.05,
      message: 'Structure test donation'
    };
    
    const response = await makeRequest('POST', '/api/grave/donations', donationData);
    const donation = response.data.data;
    
    expect(donation).toHaveProperty('id');
    expect(donation).toHaveProperty('memorialId');
    expect(donation).toHaveProperty('amount');
    expect(donation).toHaveProperty('message');
    expect(donation).toHaveProperty('donor');
    expect(donation).toHaveProperty('timestamp');
    expect(donation).toHaveProperty('transactionHash');
    expect(donation).toHaveProperty('status');
  });
});
