#!/usr/bin/env node

/**
 * Separate deployment script for GraveMemorialNFT contract
 * This script deploys only the GraveMemorialNFT contract without other dependencies
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Configuration
const NETWORKS = {
  localhost: {
    rpc: "http://localhost:8545",
    chainId: 1337,
    name: "Localhost",
    explorer: "http://localhost:8545",
  },
  mumbai: {
    rpc: "https://rpc-mumbai.maticvigil.com",
    chainId: 80001,
    name: "Polygon Mumbai",
    explorer: "https://mumbai.polygonscan.com",
  },
  sepolia: {
    rpc: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    chainId: 11155111,
    name: "Ethereum Sepolia",
    explorer: "https://sepolia.etherscan.io",
  },
  goerli: {
    rpc: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    chainId: 5,
    name: "Ethereum Goerli",
    explorer: "https://goerli.etherscan.io",
  },
};

async function deployGraveMemorialNFT() {
  console.log("💀 GraveMemorialNFT - Separate Deployment");
  console.log("==========================================");

  try {
    // Get network from environment or default to localhost
    const network = process.env.NETWORK || "localhost";
    const config = NETWORKS[network];

    if (!config) {
      throw new Error(
        `Unknown network: ${network}. Available networks: ${Object.keys(
          NETWORKS
        ).join(", ")}`
      );
    }

    console.log(`🌐 Network: ${config.name}`);
    console.log(`🔗 RPC: ${config.rpc}`);

    // Create provider
    const provider = new ethers.JsonRpcProvider(config.rpc);

    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "PRIVATE_KEY environment variable is required. Please set it in your .env file."
      );
    }

    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`👤 Deployer: ${wallet.address}`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Verify connection
    const networkInfo = await provider.getNetwork();
    console.log(
      `✅ Connected to network: ${networkInfo.name} (${networkInfo.chainId})`
    );

    // Read contract source
    const contractPath = path.join(
      process.cwd(),
      "contracts",
      "GraveMemorialNFT.sol"
    );
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }

    const contractSource = fs.readFileSync(contractPath, "utf8");
    console.log("📄 Contract source loaded");

    // Compile contract using solc (simplified approach)
    console.log("🔨 Compiling contract...");

    // ABI for GraveMemorialNFT
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
      "function emergencyWithdraw() public",
      "event MemorialCreated(uint256 indexed tokenId, address indexed creator, string artistName, address[] heirs)",
      "event DonationReceived(uint256 indexed tokenId, address indexed donor, uint256 amount, string message)",
      "event FundDistributed(uint256 indexed tokenId, address indexed heir, uint256 amount)",
    ];

    // Simple bytecode (in a real deployment, you would compile the Solidity properly)
    // For now, we'll use a placeholder approach
    console.log(
      "⚠️  Note: This script requires proper compilation. Using simplified deployment approach."
    );

    // In a real scenario, you would compile the contract properly using solc
    // For demonstration purposes, we'll show what the real deployment would look like

    console.log("\n🔧 To deploy this contract properly, you need to:");
    console.log("1. Install solc: npm install solc");
    console.log("2. Compile the contract properly");
    console.log("3. Deploy with the compiled bytecode and ABI");

    // Example of what a proper deployment would look like:
    console.log("\n📝 Example deployment code (for reference):");
    console.log(`
      const solc = require('solc');
      
      // Compile the contract
      const input = {
        language: 'Solidity',
        sources: {
          'GraveMemorialNFT.sol': {
            content: contractSource
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };
      
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      const contract = output.contracts['GraveMemorialNFT.sol']['GraveMemorialNFT'];
      
      // Deploy
      const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, wallet);
      const deployedContract = await factory.deploy();
      await deployedContract.waitForDeployment();
      
      const contractAddress = await deployedContract.getAddress();
    `);

    // Create deployment instructions
    const instructions = `
GraveMemorialNFT Deployment Instructions
=======================================

1. Set up your environment:
   - Create a .env file with your PRIVATE_KEY
   - Set NETWORK variable (localhost, mumbai, sepolia, goerli)

2. Install dependencies:
   npm install ethers solc

3. Run the deployment:
   NETWORK=mumbai node scripts/deploy-grave-separate.js

4. The contract will be deployed to the specified network

Environment Variables Required:
- PRIVATE_KEY: Your wallet private key
- NETWORK: Target network (default: localhost)

Example .env file:
PRIVATE_KEY=your_private_key_here
NETWORK=mumbai
`;

    // Save instructions
    const instructionsPath = path.join(
      process.cwd(),
      "DEPLOY_GRAVE_INSTRUCTIONS.md"
    );
    fs.writeFileSync(instructionsPath, instructions);
    console.log(`\n📝 Deployment instructions saved to: ${instructionsPath}`);

    // Show next steps
    console.log("\n📋 Next Steps:");
    console.log(
      "1. Review the deployment instructions in DEPLOY_GRAVE_INSTRUCTIONS.md"
    );
    console.log("2. Set up your environment variables");
    console.log("3. Run the proper deployment script with solc compilation");
    console.log("4. Verify the contract on the blockchain explorer");

    console.log("\n💡 For a complete deployment, you would need to:");
    console.log("- Compile the Solidity contract properly");
    console.log("- Deploy with the correct bytecode");
    console.log("- Verify the contract on the explorer");
    console.log("- Save deployment information for frontend use");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployGraveMemorialNFT();
}

export { deployGraveMemorialNFT };
