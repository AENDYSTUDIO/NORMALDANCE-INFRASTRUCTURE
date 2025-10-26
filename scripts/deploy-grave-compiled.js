#!/usr/bin/env node

/**
 * Complete deployment script for GraveMemorialNFT contract with proper compilation
 */

import { execSync } from "child_process";
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
  console.log("💀 GraveMemorialNFT - Complete Deployment");
  console.log("=========================================");

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

    // Check if solc is installed
    try {
      execSync("solc --version", { stdio: "ignore" });
      console.log("✅ Solidity compiler (solc) found");
    } catch (error) {
      console.log("⚠️  Solidity compiler (solc) not found. Installing...");
      try {
        execSync("npm install solc", { stdio: "inherit" });
        console.log("✅ solc installed successfully");
      } catch (installError) {
        throw new Error(
          "Failed to install solc. Please install it manually: npm install solc"
        );
      }
    }

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

    // Compile contract
    console.log("🔨 Compiling contract...");

    // Create temporary input for solc
    const input = {
      language: "Solidity",
      sources: {
        "GraveMemorialNFT.sol": {
          content: contractSource,
        },
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    // Write input to temporary file
    const tempInputPath = path.join(process.cwd(), "temp_compiler_input.json");
    fs.writeFileSync(tempInputPath, JSON.stringify(input));

    try {
      // Compile using solc
      const compileResult = execSync(
        `npx solc --standard-json < ${tempInputPath}`,
        { encoding: "utf8" }
      );

      // Clean up temp file
      fs.unlinkSync(tempInputPath);

      const output = JSON.parse(compileResult);

      // Check for compilation errors
      if (output.errors) {
        const errors = output.errors.filter(
          (error) => error.severity === "error"
        );
        if (errors.length > 0) {
          console.error("❌ Compilation errors:");
          errors.forEach((error) => console.error(error.formattedMessage));
          throw new Error("Compilation failed");
        }
      }

      // Get contract data
      const contracts = output.contracts["GraveMemorialNFT.sol"];
      if (!contracts || !contracts.GraveMemorialNFT) {
        throw new Error(
          "Contract compilation failed: GraveMemorialNFT not found in output"
        );
      }

      const contract = contracts.GraveMemorialNFT;
      console.log("✅ Contract compiled successfully");

      // Deploy contract
      console.log("🚀 Deploying contract...");
      const factory = new ethers.ContractFactory(
        contract.abi,
        contract.evm.bytecode.object,
        wallet
      );
      const deployedContract = await factory.deploy();

      console.log("⏳ Waiting for deployment confirmation...");
      await deployedContract.waitForDeployment();

      const contractAddress = await deployedContract.getAddress();
      console.log(`✅ Contract deployed successfully!`);
      console.log(`📍 Address: ${contractAddress}`);
      console.log(`🔗 Explorer: ${config.explorer}/address/${contractAddress}`);

      // Get deployment transaction hash
      const deployTx = deployedContract.deploymentTransaction();
      if (deployTx) {
        console.log(`📄 Transaction: ${config.explorer}/tx/${deployTx.hash}`);
      }

      // Test contract by creating a memorial
      console.log("🪦 Creating test memorial...");
      try {
        const heirs = [wallet.address]; // Self as heir for testing
        const tx = await deployedContract.createMemorial(
          "QmTestMemorial123456789", // IPFS hash
          heirs,
          "Test Artist"
        );

        console.log("⏳ Waiting for memorial creation...");
        await tx.wait();
        console.log("✅ Test memorial created successfully!");
        console.log(`📄 Transaction: ${config.explorer}/tx/${tx.hash}`);
      } catch (error) {
        console.log("⚠️  Failed to create test memorial:", error.message);
      }

      // Save deployment information
      const deploymentInfo = {
        contractName: "GraveMemorialNFT",
        address: contractAddress,
        network: config.name,
        chainId: config.chainId,
        deployer: wallet.address,
        deployedAt: new Date().toISOString(),
        explorer: config.explorer,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
      };

      // Create deployment directory if it doesn't exist
      const deploymentDir = path.join(process.cwd(), "deployments");
      if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir);
      }

      // Save deployment info
      const deploymentPath = path.join(
        deploymentDir,
        `grave-${network}-${Date.now()}.json`
      );
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log(`💾 Deployment info saved to: ${deploymentPath}`);

      // Create frontend config
      const frontendConfig = {
        GRAVE_CONTRACT_ADDRESS: contractAddress,
        GRAVE_NETWORK: config.name,
        GRAVE_CHAIN_ID: config.chainId,
        GRAVE_EXPLORER: config.explorer,
      };

      const frontendConfigPath = path.join(
        process.cwd(),
        "src",
        "lib",
        "grave-config.json"
      );
      // Create directory if it doesn't exist
      const frontendConfigDir = path.dirname(frontendConfigPath);
      if (!fs.existsSync(frontendConfigDir)) {
        fs.mkdirSync(frontendConfigDir, { recursive: true });
      }

      fs.writeFileSync(
        frontendConfigPath,
        JSON.stringify(frontendConfig, null, 2)
      );
      console.log(`💾 Frontend config saved to: ${frontendConfigPath}`);

      // Show completion message
      console.log("\n🎉 Deployment Complete!");
      console.log("========================");
      console.log(`✅ Contract: ${contractAddress}`);
      console.log(`🌐 Network: ${config.name}`);
      console.log(`👤 Deployer: ${wallet.address}`);
      console.log(`💾 Deployment info: ${deploymentPath}`);
      console.log(`💾 Frontend config: ${frontendConfigPath}`);

      console.log("\n📋 Next Steps:");
      console.log("1. Verify the contract on the blockchain explorer");
      console.log("2. Test the contract functions");
      console.log("3. Integrate with the frontend");
    } catch (compileError) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempInputPath)) {
        fs.unlinkSync(tempInputPath);
      }
      throw new Error(`Compilation failed: ${compileError.message}`);
    }
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your PRIVATE_KEY in .env file");
    console.log("2. Ensure you have sufficient funds for gas");
    console.log("3. Verify network connectivity");
    console.log("4. Check contract compilation errors");
    process.exit(1);
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployGraveMemorialNFT();
}

export { deployGraveMemorialNFT };
