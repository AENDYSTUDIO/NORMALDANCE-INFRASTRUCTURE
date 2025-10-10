/**
 * Web3 Backend Services
 * Manages NFT minting, trading, and staking
 */

import { Web3Transaction, Web3Service } from './web3-service';

// Export default service
export const web3Service = getWeb3Service();

// Export single type definitions
export type Web3ServiceType = Web3Service;
