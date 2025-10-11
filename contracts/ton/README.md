# TON Blockchain Contracts for G.rave

## Overview
FunC smart contracts for G.rave memorial system on TON blockchain.

## Contracts

### `grave-memorial.fc`
Main memorial contract implementing "Свеча 27" (Candle 27) donation system.

#### Features
- **Light Candle**: Donate to memorial fund
- **Fee Split**: 2% platform, 98% beneficiary
- **Counter**: Track candles lit
- **Status**: Active/inactive memorial state

#### Operations

##### Light Candle (Donate)
```typescript
// Simple transfer (no operation code)
await tonWallet.transfer({
  to: memorialAddress,
  value: "1000000000", // 1 TON in nanotons
});

// With operation code
await tonWallet.transfer({
  to: memorialAddress,
  value: "1000000000",
  payload: beginCell()
    .storeUint(0x4c494748, 32) // "LIGH" opcode
    .storeAddress(senderAddress)
    .endCell()
});
```

##### Get Memorial Info
```typescript
const result = await client.runMethod(
  memorialAddress,
  "get_memorial_info"
);

const [
  memorialId,
  artistName,
  candlesLit,
  totalDonations,
  beneficiary,
  platform,
  isActive
] = result.stack;
```

##### Get Candles Count
```typescript
const result = await client.runMethod(
  memorialAddress,
  "get_candles_lit"
);
const candlesLit = result.stack.readNumber();
```

## Deployment

### Prerequisites
```bash
npm install -g @ton-community/func-js
npm install -g @ton-community/blueprint
```

### Compile Contract
```bash
func -o grave-memorial.fif -SPA grave-memorial.fc
```

### Deploy (Blueprint)
```typescript
import { compile } from '@ton-community/blueprint';

const code = await compile('grave-memorial');
const memorial = provider.open(
  await GraveMemorial.createFromConfig({
    memorialId: BigInt(Date.now()),
    artistName: "Avicii",
    beneficiary: Address.parse("..."),
    platform: Address.parse("..."),
  }, code)
);

await memorial.sendDeploy(provider.sender(), toNano('0.05'));
```

## Integration with UI

### TON Connect Example
```typescript
import { useTonConnect } from '@/hooks/use-ton-wallet';
import { toNano } from '@ton/core';

function DonateButton({ memorialAddress }: { memorialAddress: string }) {
  const { sender, connected } = useTonConnect();
  
  const handleDonate = async () => {
    if (!connected) return;
    
    await sender.send({
      to: Address.parse(memorialAddress),
      value: toNano('1'), // 1 TON
      body: beginCell()
        .storeUint(0x4c494748, 32) // "LIGH" opcode
        .storeAddress(sender.address!)
        .endCell()
    });
  };
  
  return (
    <button onClick={handleDonate}>
      🕯️ Light Candle (1 TON)
    </button>
  );
}
```

## Security

### Rate Limits
- Min donation: 0.1 TON
- Max donation: 100 TON per transaction
- No rate limit on number of transactions

### Access Control
- Only beneficiary or platform can deactivate memorial
- Memorial must be active to accept donations

### Fee Distribution
- 2% to platform address (hardcoded)
- 98% to beneficiary address
- Automatic split on each donation

## Testing

### Unit Tests (Blueprint)
```typescript
describe('GraveMemorial', () => {
  it('should light candle', async () => {
    const result = await memorial.sendLightCandle(
      deployer.getSender(),
      toNano('1')
    );
    expect(result.transactions).toHaveTransaction({
      from: deployer.address,
      to: memorial.address,
      success: true,
    });
  });
  
  it('should split fees correctly', async () => {
    // Test 98/2 split
  });
  
  it('should reject inactive memorial', async () => {
    await memorial.sendDeactivate();
    const result = await memorial.sendLightCandle(
      deployer.getSender(),
      toNano('1')
    );
    expect(result.transactions).toHaveTransaction({
      success: false,
      exitCode: 401,
    });
  });
});
```

## Gas Costs (Estimated)

| Operation | Gas Cost |
|-----------|----------|
| Light Candle | ~0.01 TON |
| Deactivate | ~0.005 TON |
| Get Info | Free (getter) |

## Roadmap

### v1.0 (Current)
- [x] Basic donation system
- [x] Fee split (2%/98%)
- [x] Candle counter
- [x] Active/inactive status

### v1.1 (Planned)
- [ ] Top-27 leaderboard storage
- [ ] 27-hour candle timer
- [ ] Candle expiration and auto-renewal
- [ ] Donor name display on vinyl

### v2.0 (Future)
- [ ] NFT integration (TEP-62/64)
- [ ] Community voting
- [ ] Auto-memorial for inactive artists
- [ ] Multi-memorial support per contract

## Resources

- [TON Documentation](https://docs.ton.org)
- [FunC Language](https://docs.ton.org/develop/func/overview)
- [Blueprint SDK](https://github.com/ton-community/blueprint)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect)

## License
MIT
