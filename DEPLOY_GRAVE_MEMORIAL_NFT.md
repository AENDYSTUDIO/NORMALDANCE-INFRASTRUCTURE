# GraveMemorialNFT Deployment Guide

This guide explains how to deploy the GraveMemorialNFT contract to various Ethereum-compatible networks.

## Prerequisites

1. Node.js v16 or higher
2. npm or yarn
3. A wallet with sufficient funds for gas fees
4. An RPC endpoint for your target network

## Installation

First, install the required dependencies:

```bash
npm install
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

## Deployment Steps

### 1. Create Hardhat Configuration

Create a `hardhat.config.js` file in the project root:

```javascript
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY],
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 2. Create Deployment Script

Create `scripts/deploy-grave-memorial.js`:

```javascript
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GraveMemorialNFT
  const GraveMemorialNFT = await ethers.getContractFactory("GraveMemorialNFT");
  const graveMemorialNFT = await GraveMemorialNFT.deploy();

  await graveMemorialNFT.deployed();

  console.log("GraveMemorialNFT deployed to:", graveMemorialNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Compile the Contract

```bash
npx hardhat compile
```

### 4. Deploy to Network

Set your private key as an environment variable and deploy:

```bash
export PRIVATE_KEY="your_private_key_here"
npx hardhat run scripts/deploy-grave-memorial.js --network mumbai
```

## Environment Variables

Create a `.env` file with your configuration:

```env
PRIVATE_KEY=your_wallet_private_key
INFURA_PROJECT_ID=your_infura_project_id
```

## Network Configuration

The contract can be deployed to the following networks:

1. **Localhost** - For testing locally with Ganache or Hardhat node
2. **Mumbai** - Polygon testnet
3. **Sepolia** - Ethereum testnet

## Verification

After deployment, you can verify the contract on the block explorer:

```bash
npx hardhat verify --network mumbai CONTRACT_ADDRESS
```

## Testing the Deployment

Once deployed, you can test the contract functions:

1. Create a memorial:

   ```javascript
   await graveMemorialNFT.createMemorial(
     "QmYourIPFSHashHere",
     [heirAddress1, heirAddress2],
     "Artist Name"
   );
   ```

2. Donate to a memorial:

   ```javascript
   await graveMemorialNFT.donate(tokenId, "In memory of", {
     value: ethers.utils.parseEther("0.1"),
   });
   ```

3. Distribute funds to heirs:
   ```javascript
   await graveMemorialNFT.distributeToHeirs(tokenId);
   ```

## Contract Functions

- `createMemorial(string _ipfsHash, address[] _heirs, string _artistName)` - Create a new memorial NFT
- `donate(uint256 tokenId, string message)` - Donate to a memorial (payable)
- `distributeToHeirs(uint256 tokenId)` - Distribute funds to heirs
- `getMemorial(uint256 tokenId)` - Get memorial details
- `getUserMemorials(address user)` - Get user's memorials
- `getMemorialByArtist(string artistName)` - Get memorial by artist name
- `visitMemorial(uint256 tokenId)` - Visit a memorial
- `emergencyWithdraw()` - Emergency withdrawal (owner only)

## Security Considerations

1. Always use a separate wallet for deployments
2. Never commit private keys to version control
3. Test thoroughly on testnets before mainnet deployment
4. Verify contracts on block explorers
5. Consider using multi-sig wallets for contract ownership

## Troubleshooting

1. **Insufficient funds**: Ensure your wallet has enough ETH/MATIC for gas fees
2. **RPC errors**: Check your RPC endpoint and network connectivity
3. **Compilation errors**: Ensure Solidity version compatibility
4. **Verification failures**: Check that the contract source matches exactly

## Next Steps

After successful deployment:

1. Verify the contract on the block explorer
2. Test all functions with a few test transactions
3. Document the contract address and ABI for frontend integration
4. Set up monitoring for the contract
