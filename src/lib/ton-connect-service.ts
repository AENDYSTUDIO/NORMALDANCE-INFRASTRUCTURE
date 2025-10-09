import { Address, beginCell, Transaction } from "@ton/ton";
import { TonConnectUI } from "@tonconnect/ui-react";

export interface TonConnectConfig {
  manifestUrl: string;
  buttonRootId?: string;
  actionsConfiguration?: any;
}

export interface TonTransactionConfig {
  address: Address;
  amount: bigint;
  payload?: any;
  stateInit?: any;
  validUntil?: number;
}

export class TonConnectService {
  private tonConnectUI: TonConnectUI;

  constructor(config: TonConnectConfig) {
    this.tonConnectUI = new TonConnectUI({
      manifestUrl: config.manifestUrl,
      buttonRootId: config.buttonRootId,
      actionsConfiguration: config.actionsConfiguration,
    });
  }

  async connectWallet() {
    return await this.tonConnectUI.connectWallet();
  }

  async disconnect() {
    return await this.tonConnectUI.disconnect();
  }

  async sendTransaction(config: TonTransactionConfig) {
    try {
      const transaction: Transaction = {
        messages: [
          {
            address: config.address.toString(),
            amount: config.amount.toString(),
            payload: config.payload
              ? beginCell().storeWritable(config.payload).endCell()
              : undefined,
            stateInit: config.stateInit,
          },
        ],
        validUntil: config.validUntil || Date.now() + 5 * 60 * 100, // 5 минут
      };

      return await this.tonConnectUI.sendTransaction(transaction);
    } catch (error) {
      console.error("TON transaction error:", error);
      throw error;
    }
  }

  get connected() {
    return this.tonConnectUI.connected;
  }

  get wallet() {
    return this.tonConnectUI.wallet;
  }

  get account() {
    return this.tonConnectUI.wallet?.account;
  }
}
