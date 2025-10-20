const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying GraveMemorialNFT contract...");

  // Get the contract factory
  const GraveMemorialNFT = await ethers.getContractFactory("GraveMemorialNFT");

  // Deploy the contract
  console.log("Deploying contract...");
  const graveMemorialNFT = await GraveMemorialNFT.deploy();

  // Wait for deployment
  await graveMemorialNFT.deployed();

  console.log("GraveMemorialNFT deployed to:", graveMemorialNFT.address);

  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  // Save deployment information
  const [deployer] = await ethers.getSigners();
  const deploymentInfo = {
    contractName: "GraveMemorialNFT",
    address: graveMemorialNFT.address,
    network: networkName,
    chainId: network.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: GraveMemorialNFT.interface.format(ethers.utils.FormatTypes.json),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentPath = path.join(
    deploymentsDir,
    `grave-memorial-${networkName}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`Deployment info saved to: ${deploymentPath}`);

  // Create a test memorial
  console.log("Creating test memorial...");

  const tx = await graveMemorialNFT.createMemorial(
    "QmTestMemorial123456789", // IPFS hash
    [deployer.address], // Heirs
    "Test Artist" // Artist name
  );

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Test memorial created successfully!");

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log(`Contract Address: ${graveMemorialNFT.address}`);
  console.log(`Network: ${networkName}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployment Time: ${deploymentInfo.deployedAt}`);
  console.log(`Deployment Info: ${deploymentPath}`);
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
