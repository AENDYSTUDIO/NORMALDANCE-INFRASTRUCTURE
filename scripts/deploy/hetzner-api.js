#!/usr/bin/env node

/**
 * Hetzner Cloud API Server Deployment Script
 * Creates server with specs: 4 vCPU, 8 GB RAM, 160 GB NVMe
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  HETZNER_TOKEN: process.env.HETZNER_TOKEN,
  SERVER_NAME: 'normaldance-prod',
  SERVER_TYPE: 'cpx21', // 4 vCPU, 8 GB RAM
  IMAGE: 'ubuntu-22.04',
  LOCATION: 'nbg1', // Nuremberg
  SSH_KEY_NAME: 'normaldance-key',
  VOLUME_SIZE: 160, // GB
  DOMAIN: process.env.DOMAIN || 'normaldance.com'
};

class HetznerAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'https://api.hetzner.cloud/v1';
  }

  async request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.hetzner.cloud',
        port: 443,
        path: `/v1${endpoint}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${result.error?.message || body}`));
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

  async getSSHKeys() {
    console.log('🔑 Fetching SSH keys...');
    const response = await this.request('GET', '/ssh_keys');
    return response.ssh_keys;
  }

  async createSSHKey(name, publicKey) {
    console.log(`🔑 Creating SSH key: ${name}...`);
    const data = {
      name: name,
      public_key: publicKey
    };
    const response = await this.request('POST', '/ssh_keys', data);
    return response.ssh_key;
  }

  async createVolume(size, name) {
    console.log(`💾 Creating volume: ${size}GB...`);
    const data = {
      size: size,
      name: name,
      location: CONFIG.LOCATION
    };
    const response = await this.request('POST', '/volumes', data);
    return response.volume;
  }

  async createServer(name, sshKeyId, volumeId) {
    console.log(`🖥️  Creating server: ${name}...`);
    const data = {
      name: name,
      server_type: CONFIG.SERVER_TYPE,
      image: CONFIG.IMAGE,
      location: CONFIG.LOCATION,
      ssh_keys: [sshKeyId],
      volumes: [volumeId],
      user_data: this.getUserData()
    };
    const response = await this.request('POST', '/servers', data);
    return response.server;
  }

  getUserData() {
    return `#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Nginx
apt-get install -y nginx

# Install Certbot for SSL
apt-get install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /opt/normaldance
cd /opt/normaldance

# Clone repository
git clone https://github.com/AENDYSTUDIO/normaldance.git .

# Install dependencies
npm install

# Build application
npm run build

# Setup systemd service
cat > /etc/systemd/system/normaldance.service << EOF
[Unit]
Description=NormalDance Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/normaldance
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable normaldance
systemctl start normaldance

# Configure Nginx
cat > /etc/nginx/sites-available/normaldance << EOF
server {
    listen 80;
    server_name ${CONFIG.DOMAIN} www.${CONFIG.DOMAIN};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/normaldance /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup SSL with Let's Encrypt
certbot --nginx -d ${CONFIG.DOMAIN} -d www.${CONFIG.DOMAIN} --non-interactive --agree-tos --email admin@${CONFIG.DOMAIN}

echo "✅ Server setup completed!"
echo "🌐 Application available at: https://${CONFIG.DOMAIN}"
`;
  }

  async waitForServer(serverId) {
    console.log('⏳ Waiting for server to be ready...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const server = await this.request('GET', `/servers/${serverId}`);
      
      if (server.server.status === 'running') {
        console.log('✅ Server is running!');
        return server.server;
      }
      
      console.log(`⏳ Server status: ${server.server.status} (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
    
    throw new Error('Server failed to start within timeout');
  }

  async getServerIP(serverId) {
    const server = await this.request('GET', `/servers/${serverId}`);
    return server.server.public_net.ipv4.ip;
  }
}

async function main() {
  try {
    if (!CONFIG.HETZNER_TOKEN) {
      throw new Error('HETZNER_TOKEN environment variable is required');
    }

    console.log('🚀 Starting Hetzner Cloud deployment...');
    console.log(`📋 Server specs: ${CONFIG.SERVER_TYPE} (4 vCPU, 8 GB RAM, 160 GB NVMe)`);
    console.log(`🌍 Location: ${CONFIG.LOCATION}`);
    console.log(`🏷️  Server name: ${CONFIG.SERVER_NAME}`);

    const api = new HetznerAPI(CONFIG.HETZNER_TOKEN);

    // Check if SSH key exists, create if not
    let sshKeys = await api.getSSHKeys();
    let sshKey = sshKeys.find(key => key.name === CONFIG.SSH_KEY_NAME);
    
    if (!sshKey) {
      // Read public key from file or generate
      const publicKeyPath = path.join(process.cwd(), 'keys', 'id_rsa.pub');
      if (!fs.existsSync(publicKeyPath)) {
        throw new Error(`SSH public key not found at ${publicKeyPath}. Please generate SSH key first.`);
      }
      const publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();
      sshKey = await api.createSSHKey(CONFIG.SSH_KEY_NAME, publicKey);
    }

    // Create volume
    const volume = await api.createVolume(CONFIG.VOLUME_SIZE, `${CONFIG.SERVER_NAME}-volume`);

    // Create server
    const server = await api.createServer(CONFIG.SERVER_NAME, sshKey.id, volume.id);
    console.log(`🖥️  Server created with ID: ${server.id}`);

    // Wait for server to be ready
    const runningServer = await api.waitForServer(server.id);
    const serverIP = await api.getServerIP(server.id);

    console.log('🎉 Deployment completed successfully!');
    console.log(`🌐 Server IP: ${serverIP}`);
    console.log(`🔗 Server URL: https://${serverIP}`);
    console.log(`📊 Server status: ${runningServer.status}`);
    console.log(`💰 Estimated cost: ~€15-20/month`);

    // Save deployment info
    const deploymentInfo = {
      serverId: server.id,
      serverIP: serverIP,
      serverName: CONFIG.SERVER_NAME,
      serverType: CONFIG.SERVER_TYPE,
      volumeId: volume.id,
      sshKeyId: sshKey.id,
      createdAt: new Date().toISOString(),
      domain: CONFIG.DOMAIN
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('📝 Deployment info saved to deployment-info.json');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { HetznerAPI, CONFIG };
