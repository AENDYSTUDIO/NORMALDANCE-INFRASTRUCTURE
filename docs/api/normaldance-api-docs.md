# NormalDance API Documentation

## Overview

The NormalDance API provides access to music streaming, NFT minting, staking, and Web3 functionality. This documentation describes the available endpoints, request/response formats, and authentication requirements.

## Base URL

- Production: `https://api.normaldance.com/v1`
- Staging: `https://staging-api.normaldance.com/v1`
- Development: `http://localhost:3000/api`

## Authentication

Most API endpoints require authentication using a Bearer token:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### Getting an API Token

To obtain an API token, you can authenticate via:

1. Wallet signature (Phantom, Solflare, etc.)
2. OAuth flow
3. Email/password authentication

## API Endpoints

### Tracks

#### Get All Tracks

```
GET /tracks
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `genre` (optional): Filter by genre
- `artistId` (optional): Filter by artist
- `sort` (optional): Sort by `newest`, `popular`, `trending` (default: newest)

**Response:**

```json
{
  "tracks": [
    {
      "id": "track_123",
      "title": "Sample Track",
      "description": "A sample track description",
      "coverImage": "https://cdn.normaldance.com/covers/123.jpg",
      "audioUrl": "https://cdn.normaldance.com/audio/123.mp3",
      "artistId": "artist_456",
      "artistName": "Sample Artist",
      "genre": "electronic",
      "duration": 240,
      "price": 0.5,
      "isNFT": true,
      "plays": 1250,
      "likes": 45,
      "createdAt": "2023-10-01T10:00:00Z",
      "updatedAt": "2023-10-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Track by ID

```
GET /tracks/{id}
```

**Response:**

```json
{
  "track": {
    "id": "track_123",
    "title": "Sample Track",
    "description": "A sample track description",
    "coverImage": "https://cdn.normaldance.com/covers/123.jpg",
    "audioUrl": "https://cdn.normaldance.com/audio/123.mp3",
    "artistId": "artist_456",
    "artistName": "Sample Artist",
    "genre": "electronic",
    "duration": 240,
    "price": 0.5,
    "isNFT": true,
    "plays": 1250,
    "likes": 45,
    "createdAt": "2023-10-01T10:00:00Z",
    "updatedAt": "2023-10-01T10:00:00Z",
    "lyrics": "Sample lyrics here...",
    "tags": ["electronic", "dance", "chill"],
    "bpm": 128,
    "key": "A minor"
  }
}
```

#### Create New Track

```
POST /tracks
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

**Request Body:**

```json
{
  "title": "New Track",
  "description": "A new track description",
  "coverImage": "https://example.com/cover.jpg",
  "audioUrl": "https://example.com/audio.mp3",
  "genre": "electronic",
  "duration": 240,
  "price": 0.5,
  "isNFT": true,
  "tags": ["electronic", "dance"]
}
```

**Response:**

```json
{
  "track": {
    "id": "track_789",
    "title": "New Track",
    "description": "A new track description",
    "coverImage": "https://example.com/cover.jpg",
    "audioUrl": "https://example.com/audio.mp3",
    "artistId": "current_user_id",
    "genre": "electronic",
    "duration": 240,
    "price": 0.5,
    "isNFT": true,
    "plays": 0,
    "likes": 0,
    "createdAt": "2023-10-01T10:00:00Z",
    "updatedAt": "2023-10-01T10:00:00Z"
  }
}
```

#### Like/Unlike Track

```
POST /tracks/{id}/like
```

**Response:**

```json
{
  "success": true,
  "newLikeStatus": true
}
```

### Artists

#### Get Artist by ID

```
GET /artists/{id}
```

**Response:**

```json
{
  "artist": {
    "id": "artist_456",
    "username": "sample_artist",
    "displayName": "Sample Artist",
    "avatar": "https://cdn.normaldance.com/avatars/456.jpg",
    "bio": "Sample artist bio",
    "totalTracks": 25,
    "totalPlays": 15000,
    "followers": 500,
    "isVerified": true,
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Get Artist's Tracks

```
GET /artists/{id}/tracks
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**

```json
{
  "tracks": [
    {
      "id": "track_123",
      "title": "Sample Track",
      "coverImage": "https://cdn.normaldance.com/covers/123.jpg",
      "duration": 240,
      "plays": 1250,
      "likes": 45,
      "price": 0.5,
      "isNFT": true,
      "createdAt": "2023-10-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

### NFTs

#### Get NFT by ID

```
GET /nfts/{id}
```

**Response:**

```json
{
  "nft": {
    "id": "nft_123",
    "name": "Digital Art #1",
    "description": "A beautiful digital artwork",
    "image": "https://cdn.normaldance.com/nfts/123.jpg",
    "animationUrl": "https://cdn.normaldance.com/nfts/123.mp4",
    "externalUrl": "https://normaldance.com/nfts/123",
    "attributes": [
      {
        "trait_type": "Background",
        "value": "Blue"
      },
      {
        "trait_type": "Mood",
        "value": "Happy"
      }
    ],
    "owner": {
      "id": "user_789",
      "username": "nft_collector",
      "avatar": "https://cdn.normaldance.com/avatars/789.jpg"
    },
    "price": 0.5,
    "currency": "SOL",
    "isForSale": true,
    "createdAt": "2023-10-01T10:00:00Z",
    "updatedAt": "2023-10-01T10:00Z"
  }
}
```

#### Mint NFT

```
POST /nfts/mint
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

**Request Body:**

```json
{
  "name": "Digital Art #1",
  "description": "A beautiful digital artwork",
  "image": "https://example.com/art.jpg",
  "animationUrl": "https://example.com/art.mp4",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    }
  ],
  "price": 0.5,
  "isForSale": true
}
```

**Response:**

```json
{
  "nft": {
    "id": "nft_456",
    "name": "Digital Art #1",
    "description": "A beautiful digital artwork",
    "image": "https://example.com/art.jpg",
    "animationUrl": "https://example.com/art.mp4",
    "attributes": [
      {
        "trait_type": "Background",
        "value": "Blue"
      }
    ],
    "owner": {
      "id": "current_user_id",
      "username": "current_user",
      "avatar": "https://cdn.normaldance.com/avatars/current.jpg"
    },
    "price": 0.5,
    "currency": "SOL",
    "isForSale": true,
    "mintTransaction": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
    "createdAt": "2023-10-01T10:00Z",
    "updatedAt": "2023-10-01T10:00:00Z"
  }
}
```

### Wallet & Web3

#### Get User Wallet Info

```
GET /wallet/info
```

**Response:**

```json
{
  "wallet": {
    "address": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
    "balance": {
      "sol": 2.5,
      "ndt": 1000.5,
      "usdc": 50.25
    },
    "nfts": [
      {
        "id": "nft_123",
        "name": "Digital Art #1",
        "image": "https://cdn.normaldance.com/nfts/123.jpg"
      }
    ],
    "recentTransactions": [
      {
        "id": "tx_789",
        "type": "transfer",
        "amount": 0.5,
        "currency": "SOL",
        "to": "another_address",
        "timestamp": "2023-10-01T10:00:00Z",
        "status": "confirmed"
      }
    ]
  }
}
```

#### Connect Wallet

```
POST /wallet/connect
```

**Request Body:**

```json
{
  "publicKey": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
  "signature": "signed_message_base58",
  "message": "normaldance_auth_message_12345"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_789",
    "username": "wallet_user",
    "walletAddress": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
    "createdAt": "2023-10-01T10:00:00Z"
  }
}
```

### Staking

#### Get Staking Info

```
GET /staking/info
```

**Response:**

```json
{
  "staking": {
    "totalStaked": 5000,
    "currentTier": "SILVER",
    "apy": 12.5,
    "rewards": 25.5,
    "lockPeriodRemaining": 1209600,
    "stakedNfts": [
      {
        "id": "nft_123",
        "name": "Digital Art #1",
        "stakedAt": "2023-09-01T10:00Z",
        "rewardsAccrued": 5.2
      }
    ],
    "unstakingQueue": [],
    "rewardsHistory": [
      {
        "id": "reward_1",
        "amount": 2.5,
        "date": "2023-10-01T10:00:00Z",
        "type": "daily"
      }
    ]
  }
}
```

#### Stake NFT

```
POST /staking/stake
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

**Request Body:**

```json
{
  "nftId": "nft_123",
  "lockPeriod": 90
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "stake_tx_456",
  "stakeInfo": {
    "nftId": "nft_123",
    "stakedAt": "2023-10-01T10:00:00Z",
    "lockUntil": "2023-12-30T10:00:00Z",
    "apy": 15,
    "estimatedRewards": 12.5
  }
}
```

### User

#### Get Current User

```
GET /user/me
```

**Response:**

```json
{
  "user": {
    "id": "user_789",
    "username": "sample_user",
    "email": "user@example.com",
    "displayName": "Sample User",
    "avatar": "https://cdn.normaldance.com/avatars/789.jpg",
    "bio": "Sample bio",
    "walletAddress": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
    "followers": 150,
    "following": 200,
    "isVerified": false,
    "createdAt": "2023-01-01T00:00Z",
    "lastActive": "2023-10-01T10:00:00Z"
  }
}
```

#### Update User Profile

```
PUT /user/profile
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

**Request Body:**

```json
{
  "displayName": "Updated Name",
  "bio": "Updated bio",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_789",
    "username": "sample_user",
    "email": "user@example.com",
    "displayName": "Updated Name",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "Updated bio",
    "walletAddress": "4tJ5YzKx8r9P2q7VnW4cR6gH3sA2fT1vE5b8N7m6J9kL",
    "followers": 150,
    "following": 200,
    "isVerified": false,
    "createdAt": "2023-01-01T00:00Z",
    "lastActive": "2023-10-01T10:00:00Z"
  }
}
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "price",
      "reason": "Price must be a positive number"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication token
- `NOT_FOUND`: Requested resource does not exist
- `VALIDATION_ERROR`: Request parameters failed validation
- `RATE_LIMITED`: Too many requests from this client
- `INTERNAL_ERROR`: Server-side error occurred

## Webhook Events

The API can send webhook notifications to your registered endpoint:

### Event Types

- `track.played`: When a track is played
- `nft.sale`: When an NFT is sold
- `stake.rewards`: When staking rewards are distributed
- `wallet.transaction`: When a wallet transaction occurs

### Webhook Payload Example

```json
{
  "id": "evt_123",
  "type": "nft.sale",
  "timestamp": "2023-10-01T10:00:00Z",
  "data": {
    "nftId": "nft_123",
    "buyerId": "user_456",
    "sellerId": "user_789",
    "price": 0.5,
    "currency": "SOL",
    "transactionId": "tx_789"
  }
}
```

## Rate Limits

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per user
- Upload endpoints: 10 requests per minute per user

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @normaldance/sdk
```

```javascript
import { NormalDanceSDK } from "@normaldance/sdk";

const sdk = new NormalDanceSDK({
  apiKey: "YOUR_API_KEY",
  environment: "production", // or 'staging'
});

// Get tracks
const tracks = await sdk.tracks.getAll({ genre: "electronic", limit: 10 });

// Mint NFT
const nft = await sdk.nfts.mint({
  name: "My NFT",
  image: "https://example.com/image.jpg",
  price: 0.5,
});
```

## Support

For API support, please contact:

- Email: api-support@normaldance.com
- Discord: https://discord.gg/normaldance
- Documentation: https://docs.normaldance.com
