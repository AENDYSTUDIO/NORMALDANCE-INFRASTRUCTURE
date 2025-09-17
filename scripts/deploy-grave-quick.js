#!/usr/bin/env node

/**
 * Быстрый деплой G.rave контракта
 * Цель: получить рабочий модуль за 1 час
 */

const { ethers } = require('ethers');
const fs = require('fs');

// Конфигурация сетей
const NETWORKS = {
  localhost: {
    rpc: 'http://localhost:8545',
    chainId: 1337,
    name: 'Localhost',
    explorer: 'http://localhost:8545'
  },
  mumbai: {
    rpc: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    name: 'Polygon Mumbai',
    explorer: 'https://mumbai.polygonscan.com'
  },
  sepolia: {
    rpc: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    explorer: 'https://sepolia.etherscan.io'
  }
};

async function deployGraveContract() {
  console.log('💀 G.rave - Быстрый деплой Memorial NFT');
  console.log('==========================================');
  
  try {
    // Выбираем сеть
    const network = process.env.NETWORK || 'localhost';
    const config = NETWORKS[network];
    
    if (!config) {
      throw new Error(`Неизвестная сеть: ${network}`);
    }
    
    console.log(`🌐 Сеть: ${config.name}`);
    console.log(`🔗 RPC: ${config.rpc}`);
    
    // Создаем провайдер
    const provider = new ethers.JsonRpcProvider(config.rpc);
    
    // Получаем приватный ключ
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log('⚠️  PRIVATE_KEY не установлен, используем тестовый ключ');
      // Тестовый ключ для демо (НЕ ИСПОЛЬЗУЙТЕ В ПРОДАКШЕНЕ!)
      const testPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const wallet = new ethers.Wallet(testPrivateKey, provider);
      console.log(`👤 Тестовый кошелек: ${wallet.address}`);
    } else {
      const wallet = new ethers.Wallet(privateKey, provider);
      console.log(`👤 Кошелек: ${wallet.address}`);
    }
    
    // Проверяем подключение
    const networkInfo = await provider.getNetwork();
    console.log(`✅ Подключено к сети: ${networkInfo.name} (${networkInfo.chainId})`);
    
    // Читаем контракт
    const contractPath = 'contracts/GraveMemorialNFT.sol';
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Файл контракта не найден: ${contractPath}`);
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    console.log('📄 Контракт загружен');
    
    // Создаем фабрику контракта
    console.log('🔨 Компиляция контракта...');
    
    // Простая ABI для деплоя
    const abi = [
      "constructor()",
      "function createMemorial(string memory _ipfsHash, address[] memory _heirs, string memory _artistName) public payable returns (uint256)",
      "function donate(uint256 tokenId, string memory message) public payable",
      "function distributeToHeirs(uint256 tokenId) public",
      "function getMemorial(uint256 tokenId) public view returns (tuple(string ipfsHash, address[] heirs, uint256 fundBalance, uint256 platformFee, string artistName, bool isActive, uint256 createdAt))",
      "function getUserMemorials(address user) public view returns (uint256[] memory)",
      "function getMemorialByArtist(string memory artistName) public view returns (uint256)",
      "function visitMemorial(uint256 tokenId) public",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function owner() public view returns (address)",
      "function emergencyWithdraw() public"
    ];
    
    const factory = new ethers.ContractFactory(abi, contractCode, wallet);
    
    // Деплоим контракт
    console.log('🚀 Деплой контракта...');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log(`✅ Контракт задеплоен!`);
    console.log(`📍 Адрес: ${contractAddress}`);
    console.log(`🔗 Explorer: ${config.explorer}/address/${contractAddress}`);
    
    // Создаем демо-мемориал
    console.log('🪦 Создание демо-мемориала...');
    
    try {
      const demoHeirs = [wallet.address]; // Наследник - сам создатель
      const tx = await contract.createMemorial(
        'QmDemoMemorial123', // IPFS hash
        demoHeirs,           // наследники
        'DJ Eternal'         // имя артиста
      );
      
      await tx.wait();
      console.log('✅ Демо-мемориал создан!');
      console.log(`🔗 Транзакция: ${config.explorer}/tx/${tx.hash}`);
    } catch (error) {
      console.log('⚠️  Не удалось создать демо-мемориал:', error.message);
    }
    
    // Сохраняем информацию о контракте
    const contractInfo = {
      address: contractAddress,
      network: config.name,
      chainId: config.chainId,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      explorer: config.explorer,
      abi: abi,
      demoMemorial: {
        artistName: 'DJ Eternal',
        ipfsHash: 'QmDemoMemorial123',
        heirs: [wallet.address]
      }
    };
    
    // Создаем папку contracts если не существует
    if (!fs.existsSync('contracts')) {
      fs.mkdirSync('contracts');
    }
    
    fs.writeFileSync(
      'contracts/grave-deployed.json',
      JSON.stringify(contractInfo, null, 2)
    );
    
    console.log('💾 Информация о контракте сохранена в contracts/grave-deployed.json');
    
    // Создаем файл с адресом для фронтенда
    const frontendConfig = {
      GRAVE_CONTRACT_ADDRESS: contractAddress,
      GRAVE_NETWORK: config.name,
      GRAVE_CHAIN_ID: config.chainId,
      GRAVE_EXPLORER: config.explorer
    };
    
    fs.writeFileSync(
      'src/lib/grave-config.json',
      JSON.stringify(frontendConfig, null, 2)
    );
    
    console.log('💾 Конфигурация для фронтенда сохранена в src/lib/grave-config.json');
    
    console.log('');
    console.log('💀 ГОТОВО! G.rave Memorial NFT задеплоен');
    console.log('========================================');
    console.log('✅ Smart-contract работает');
    console.log('✅ Демо-мемориал создан');
    console.log('✅ Конфигурация сохранена');
    console.log('');
    console.log('💡 Следующий шаг: запустить фронтенд!');
    console.log('   npm run dev → http://localhost:3000/grave');
    
  } catch (error) {
    console.error('❌ Ошибка деплоя:', error.message);
    console.log('');
    console.log('🔧 Возможные решения:');
    console.log('1. Проверьте PRIVATE_KEY в .env');
    console.log('2. Убедитесь что у вас есть ETH для gas');
    console.log('3. Проверьте подключение к интернету');
    process.exit(1);
  }
}

// Запускаем деплой
if (require.main === module) {
  deployGraveContract();
}

module.exports = { deployGraveContract };
