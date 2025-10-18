#!/usr/bin/env node

/**
 * Domain Purchase API Scripts
 * Supports Namecheap, Reg.ru, Cloudflare
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  DOMAIN: process.env.DOMAIN || 'normaldance.com',
  NAMECHEAP_API_KEY: process.env.NAMECHEAP_API_KEY,
  NAMECHEAP_USER: process.env.NAMECHEAP_USER,
  REGRU_API_KEY: process.env.REGRU_API_KEY,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,
  SERVER_IP: process.env.SERVER_IP
};

class NamecheapAPI {
  constructor(apiKey, username) {
    this.apiKey = apiKey;
    this.username = username;
    this.baseURL = 'https://api.namecheap.com/xml.response';
  }

  async checkDomainAvailability(domain) {
    console.log(`🔍 Checking domain availability: ${domain}`);
    
    const params = new URLSearchParams({
      ApiUser: this.username,
      ApiKey: this.apiKey,
      UserName: this.username,
      Command: 'namecheap.domains.check',
      ClientIp: '127.0.0.1',
      DomainList: domain
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.namecheap.com',
        port: 443,
        path: `/xml.response?${params.toString()}`,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            // Parse XML response
            const isAvailable = body.includes('Available="true"');
            resolve({ domain, available: isAvailable });
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async purchaseDomain(domain, years = 1) {
    console.log(`💰 Purchasing domain: ${domain} for ${years} year(s)`);
    
    const params = new URLSearchParams({
      ApiUser: this.username,
      ApiKey: this.apiKey,
      UserName: this.username,
      Command: 'namecheap.domains.create',
      ClientIp: '127.0.0.1',
      DomainName: domain,
      Years: years,
      AuxBillingFirstName: 'Admin',
      AuxBillingLastName: 'User',
      AuxBillingAddress1: '123 Main St',
      AuxBillingCity: 'City',
      AuxBillingStateProvince: 'State',
      AuxBillingPostalCode: '12345',
      AuxBillingCountry: 'US',
      AuxBillingPhone: '+1.1234567890',
      AuxBillingEmailAddress: `admin@${domain}`,
      TechFirstName: 'Admin',
      TechLastName: 'User',
      TechAddress1: '123 Main St',
      TechCity: 'City',
      TechStateProvince: 'State',
      TechPostalCode: '12345',
      TechCountry: 'US',
      TechPhone: '+1.1234567890',
      TechEmailAddress: `admin@${domain}`,
      AdminFirstName: 'Admin',
      AdminLastName: 'User',
      AdminAddress1: '123 Main St',
      AdminCity: 'City',
      AdminStateProvince: 'State',
      AdminPostalCode: '12345',
      AdminCountry: 'US',
      AdminPhone: '+1.1234567890',
      AdminEmailAddress: `admin@${domain}`,
      RegistrantFirstName: 'Admin',
      RegistrantLastName: 'User',
      RegistrantAddress1: '123 Main St',
      RegistrantCity: 'City',
      RegistrantStateProvince: 'State',
      RegistrantPostalCode: '12345',
      RegistrantCountry: 'US',
      RegistrantPhone: '+1.1234567890',
      RegistrantEmailAddress: `admin@${domain}`
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.namecheap.com',
        port: 443,
        path: `/xml.response?${params.toString()}`,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const success = body.includes('CommandResponse Type="OK"');
            if (success) {
              resolve({ domain, success: true, response: body });
            } else {
              reject(new Error(`Domain purchase failed: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

class RegruAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.reg.ru/api/regru2';
  }

  async checkDomainAvailability(domain) {
    console.log(`🔍 Checking domain availability: ${domain}`);
    
    const data = {
      username: 'regru',
      password: this.apiKey,
      domain_name: domain,
      output_content_type: 'plain'
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'api.reg.ru',
        port: 443,
        path: '/api/regru2/domain/check',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            const isAvailable = result.answer?.result?.is_available === 'yes';
            resolve({ domain, available: isAvailable, result });
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  async purchaseDomain(domain, years = 1) {
    console.log(`💰 Purchasing domain: ${domain} for ${years} year(s)`);
    
    const data = {
      username: 'regru',
      password: this.apiKey,
      domain_name: domain,
      period: years,
      output_content_type: 'plain'
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'api.reg.ru',
        port: 443,
        path: '/api/regru2/domain/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            const success = result.answer?.result?.result === 'success';
            if (success) {
              resolve({ domain, success: true, result });
            } else {
              reject(new Error(`Domain purchase failed: ${JSON.stringify(result)}`));
            }
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

class CloudflareAPI {
  constructor(apiToken, zoneId) {
    this.apiToken = apiToken;
    this.zoneId = zoneId;
    this.baseURL = 'https://api.cloudflare.com/client/v4';
  }

  async request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudflare.com',
        port: 443,
        path: `/client/v4${endpoint}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.success) {
              resolve(result);
            } else {
              reject(new Error(`API Error: ${JSON.stringify(result.errors)}`));
            }
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async setupDNS(domain, serverIP) {
    console.log(`🌐 Setting up DNS for ${domain} -> ${serverIP}`);
    
    const records = [
      {
        type: 'A',
        name: domain,
        content: serverIP,
        ttl: 1, // Auto TTL
        proxied: true // Cloudflare proxy
      },
      {
        type: 'A',
        name: `www.${domain}`,
        content: serverIP,
        ttl: 1,
        proxied: true
      },
      {
        type: 'CNAME',
        name: `api.${domain}`,
        content: domain,
        ttl: 1,
        proxied: true
      }
    ];

    const results = [];
    
    for (const record of records) {
      try {
        console.log(`📝 Creating DNS record: ${record.type} ${record.name} -> ${record.content}`);
        const result = await this.request('POST', `/zones/${this.zoneId}/dns_records`, record);
        results.push(result);
        console.log(`✅ DNS record created: ${record.name}`);
      } catch (error) {
        console.error(`❌ Failed to create DNS record ${record.name}:`, error.message);
        results.push({ error: error.message, record });
      }
    }

    return results;
  }

  async enableSSL(domain) {
    console.log(`🔒 Enabling SSL for ${domain}`);
    
    try {
      // Set SSL mode to Full (Strict)
      const sslResult = await this.request('PATCH', `/zones/${this.zoneId}/settings/ssl`, {
        value: 'full'
      });
      
      // Enable Always Use HTTPS
      const httpsResult = await this.request('PATCH', `/zones/${this.zoneId}/settings/always_use_https`, {
        value: 'on'
      });
      
      // Enable HTTP/2
      const http2Result = await this.request('PATCH', `/zones/${this.zoneId}/settings/http2`, {
        value: 'on'
      });
      
      console.log('✅ SSL configuration completed');
      return { sslResult, httpsResult, http2Result };
    } catch (error) {
      console.error('❌ SSL configuration failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🌐 Starting domain setup...');
    console.log(`🏷️  Domain: ${CONFIG.DOMAIN}`);
    console.log(`🖥️  Server IP: ${CONFIG.SERVER_IP}`);

    let domainResult = null;
    let dnsResult = null;

    // Try Namecheap first
    if (CONFIG.NAMECHEAP_API_KEY && CONFIG.NAMECHEAP_USER) {
      console.log('🛒 Using Namecheap API...');
      const namecheap = new NamecheapAPI(CONFIG.NAMECHEAP_API_KEY, CONFIG.NAMECHEAP_USER);
      
      const availability = await namecheap.checkDomainAvailability(CONFIG.DOMAIN);
      if (availability.available) {
        domainResult = await namecheap.purchaseDomain(CONFIG.DOMAIN);
        console.log('✅ Domain purchased via Namecheap');
      } else {
        console.log('❌ Domain not available via Namecheap');
      }
    }

    // Try Reg.ru if Namecheap failed
    if (!domainResult && CONFIG.REGRU_API_KEY) {
      console.log('🛒 Using Reg.ru API...');
      const regru = new RegruAPI(CONFIG.REGRU_API_KEY);
      
      const availability = await regru.checkDomainAvailability(CONFIG.DOMAIN);
      if (availability.available) {
        domainResult = await regru.purchaseDomain(CONFIG.DOMAIN);
        console.log('✅ Domain purchased via Reg.ru');
      } else {
        console.log('❌ Domain not available via Reg.ru');
      }
    }

    if (!domainResult) {
      throw new Error('Domain purchase failed or domain not available');
    }

    // Setup DNS with Cloudflare
    if (CONFIG.CLOUDFLARE_API_TOKEN && CONFIG.CLOUDFLARE_ZONE_ID && CONFIG.SERVER_IP) {
      console.log('🌐 Setting up DNS with Cloudflare...');
      const cloudflare = new CloudflareAPI(CONFIG.CLOUDFLARE_API_TOKEN, CONFIG.CLOUDFLARE_ZONE_ID);
      
      dnsResult = await cloudflare.setupDNS(CONFIG.DOMAIN, CONFIG.SERVER_IP);
      await cloudflare.enableSSL(CONFIG.DOMAIN);
      
      console.log('✅ DNS and SSL setup completed');
    }

    console.log('🎉 Domain setup completed successfully!');
    console.log(`🌐 Domain: ${CONFIG.DOMAIN}`);
    console.log(`🔗 Website: https://${CONFIG.DOMAIN}`);
    console.log(`🔗 API: https://api.${CONFIG.DOMAIN}`);

    // Save domain info
    const domainInfo = {
      domain: CONFIG.DOMAIN,
      serverIP: CONFIG.SERVER_IP,
      purchaseResult: domainResult,
      dnsResult: dnsResult,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'domain-info.json'),
      JSON.stringify(domainInfo, null, 2)
    );

    console.log('📝 Domain info saved to domain-info.json');

  } catch (error) {
    console.error('❌ Domain setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { NamecheapAPI, RegruAPI, CloudflareAPI, CONFIG };
