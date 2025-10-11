'use client';

import { useState } from 'react';
import { useTonConnect } from '@/contexts/ton-connect-context';
import { Address, toNano, beginCell } from '@ton/core';

interface GraveDonateButtonProps {
  memorialId: string;
  memorialAddress?: string;
  artistName: string;
  onSuccess?: () => void;
}

type Chain = 'TON' | 'SOL' | 'ETH';

export default function GraveDonateButton({ 
  memorialId, 
  memorialAddress,
  artistName,
  onSuccess 
}: GraveDonateButtonProps) {
  const [selectedChain, setSelectedChain] = useState<Chain>('TON');
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const { connected, account, connectWallet, sendTransaction } = useTonConnect();

  const handleDonateTON = async () => {
    if (!connected || !account) {
      await connectWallet();
      return;
    }

    if (!memorialAddress) {
      alert('Memorial address not configured');
      return;
    }

    setIsLoading(true);
    try {
      const senderAddress = Address.parse(account.address);

      // Create donation payload
      const body = beginCell()
        .storeUint(0x4c494748, 32) // "LIGH" opcode
        .storeAddress(senderAddress)
        .storeRef(
          beginCell()
            .storeUint(0, 8) // String tag
            .storeStringTail(message || `Donation to ${artistName}`)
          .endCell()
        )
      .endCell();

      // Send transaction via TON Connect
      const destination = Address.parse(memorialAddress).toString();

      await sendTransaction({
        messages: [
          {
            address: destination,
            amount: toNano(amount).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
      });

      // Success
      setShowModal(false);
      setAmount('1');
      setMessage('');
      
      if (onSuccess) {
        onSuccess();
      }

      alert(`✅ Candle lit! ${amount} TON donated to ${artistName} memorial`);
    } catch (error: any) {
      console.error('Donation error:', error);
      alert(`❌ Donation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonateSOL = async () => {
    // TODO: Implement Solana donation
    alert('Solana donations coming soon!');
  };

  const handleDonateETH = async () => {
    // Fallback to existing Ethereum donation flow
    try {
      const response = await fetch('/api/grave/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memorialId,
          amount: parseFloat(amount),
          message,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setAmount('1');
        setMessage('');
        
        if (onSuccess) {
          onSuccess();
        }

        alert(`✅ Candle lit! ${amount} ETH donated to ${artistName} memorial`);
      } else {
        alert(`❌ Donation failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      alert(`❌ Donation failed: ${error.message}`);
    }
  };

  const handleDonate = async () => {
    switch (selectedChain) {
      case 'TON':
        await handleDonateTON();
        break;
      case 'SOL':
        await handleDonateSOL();
        break;
      case 'ETH':
        await handleDonateETH();
        break;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary gap-2"
      >
        🕯️ Light Candle
      </button>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-2xl mb-4">
              🕯️ Light a Candle for {artistName}
            </h3>

            {/* Chain Selector */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Choose Blockchain</span>
              </label>
              <div className="btn-group w-full">
                <button
                  className={`btn flex-1 ${selectedChain === 'TON' ? 'btn-active' : ''}`}
                  onClick={() => setSelectedChain('TON')}
                >
                  TON
                </button>
                <button
                  className={`btn flex-1 ${selectedChain === 'SOL' ? 'btn-active' : ''}`}
                  onClick={() => setSelectedChain('SOL')}
                  disabled
                >
                  SOL
                  <span className="badge badge-sm">Soon</span>
                </button>
                <button
                  className={`btn flex-1 ${selectedChain === 'ETH' ? 'btn-active' : ''}`}
                  onClick={() => setSelectedChain('ETH')}
                >
                  ETH
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Amount ({selectedChain})
                </span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full"
                placeholder="1.0"
              />
              <label className="label">
                <span className="label-text-alt">
                  Min: 0.1 {selectedChain} • Max: 100 {selectedChain}
                </span>
              </label>
            </div>

            {/* Message Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Message (Optional)
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="textarea textarea-bordered h-24"
                placeholder="Leave a message in memory..."
                maxLength={200}
              />
              <label className="label">
                <span className="label-text-alt">
                  {message.length}/200 characters
                </span>
              </label>
            </div>

            {/* Fee Info */}
            <div className="alert alert-info mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="font-bold">98% → Beneficiary</div>
                <div>2% → Platform</div>
              </div>
            </div>

            {/* TON Connect Status */}
            {selectedChain === 'TON' && !connected && (
              <div className="alert alert-warning mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Connect TON wallet to donate</span>
              </div>
            )}

            {/* Actions */}
            <div className="modal-action">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDonate}
                className="btn btn-primary"
            disabled={isLoading || (selectedChain === 'TON' && !connected)}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    🕯️ Light Candle ({amount} {selectedChain})
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isLoading && setShowModal(false)} />
        </div>
      )}
    </>
  );
}
