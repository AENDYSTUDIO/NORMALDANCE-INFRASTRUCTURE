# 🛠️ Developer Guide

## Development Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Git
- Phantom Wallet (for Web3 testing)

### Quick Setup
```bash
# Clone repository
git clone git@github.com:AENDYSTUDIO/normaldance-production-ready.git
cd normaldance-production-ready

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── web3/             # Web3 components
├── lib/                  # Utilities and libraries
│   ├── auth/             # Authentication logic
│   ├── database/         # Database utilities
│   ├── security/         # Security utilities
│   └── web3/             # Web3 integration
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── middleware.ts         # Next.js middleware
```

## Coding Standards

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

### Code Style Guidelines

#### Component Structure
```typescript
// Good: Proper component structure
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage message="User not found" />;
  
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
}
```

#### API Route Structure
```typescript
// Good: Proper API route structure
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';

const createTrackSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  genre: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = createTrackSchema.parse(body);
    
    const track = await createTrack(user.id, validatedData);
    
    return NextResponse.json({ success: true, data: track });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Database Development

### Prisma Schema Best Practices
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  tracks    Track[]
  nfts      NFT[]
  
  @@map("users")
}

model Track {
  id          String   @id @default(cuid())
  title       String
  description String?
  genre       String
  duration    Int
  ipfsHash    String
  createdAt   DateTime @default(now())
  
  // Foreign keys
  artistId    String
  artist      User     @relation(fields: [artistId], references: [id])
  
  @@map("tracks")
  @@index([artistId])
  @@index([genre])
}
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name add_user_table

# Reset database (development only)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy
```

## Web3 Development

### Solana Integration
```typescript
// Web3 Connection Setup
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

export class SolanaService {
  private connection: Connection;
  private provider: AnchorProvider;
  
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );
  }
  
  async mintNFT(metadata: NFTMetadata): Promise<string> {
    // NFT minting logic
    const mintKeypair = Keypair.generate();
    
    // Create mint account
    const createMintTx = await createMint(
      this.connection,
      payer,
      mintAuthority,
      freezeAuthority,
      decimals
    );
    
    return mintKeypair.publicKey.toString();
  }
}
```

### Smart Contract Testing
```typescript
// Anchor Test Example
describe('Music NFT Contract', () => {
  let program: Program<MusicNft>;
  let provider: AnchorProvider;
  
  beforeEach(async () => {
    provider = AnchorProvider.env();
    program = new Program(IDL, PROGRAM_ID, provider);
  });
  
  it('should mint music NFT', async () => {
    const metadata = {
      title: 'Test Track',
      artist: 'Test Artist',
      duration: 180
    };
    
    const tx = await program.methods
      .mintMusicNft(metadata)
      .accounts({
        mint: mintKeypair.publicKey,
        authority: provider.wallet.publicKey
      })
      .signers([mintKeypair])
      .rpc();
      
    expect(tx).toBeDefined();
  });
});
```

## Testing Strategy

### Unit Tests
```typescript
// Component Testing with Jest & Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackCard } from '@/components/TrackCard';

describe('TrackCard', () => {
  const mockTrack = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180
  };
  
  it('renders track information', () => {
    render(<TrackCard track={mockTrack} />);
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });
  
  it('handles play button click', () => {
    const onPlay = jest.fn();
    render(<TrackCard track={mockTrack} onPlay={onPlay} />);
    
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledWith(mockTrack.id);
  });
});
```

### Integration Tests
```typescript
// API Integration Testing
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/tracks/route';

describe('/api/tracks', () => {
  it('creates a new track', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'New Track',
        genre: 'Electronic',
        duration: 240
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
```

## Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), {
  loading: () => <AudioPlayerSkeleton />,
  ssr: false
});

const Web3Dashboard = dynamic(() => import('@/components/Web3Dashboard'), {
  loading: () => <DashboardSkeleton />
});
```

### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image';

export function TrackCover({ src, alt, size = 200 }: TrackCoverProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-lg"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

## Debugging

### Development Tools
```typescript
// Debug logging
import debug from 'debug';

const log = debug('normaldance:api');
const logError = debug('normaldance:error');

export function apiHandler(req: NextRequest) {
  log('API request:', req.method, req.url);
  
  try {
    // API logic
  } catch (error) {
    logError('API error:', error);
    throw error;
  }
}
```

### Error Monitoring
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Error boundary
export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```