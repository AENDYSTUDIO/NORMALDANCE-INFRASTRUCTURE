# API Specification

## Overview

The NORMALDANCE API provides a comprehensive RESTful interface for interacting with the platform's core functionality including user management, music content, NFTs, token operations, and blockchain integration.

## Base URL

```
https://api.normaldance.com/v1
```

## Authentication

### JWT Token

Most API endpoints require authentication using JWT tokens obtained through wallet signature verification.

```
Authorization: Bearer <jwt_token>
```

### Wallet Authentication Flow

1. **Request Challenge**
   ```
   POST /auth/challenge
   Content-Type: application/json
   
   {
     "walletAddress": "string",
     "chain": "solana|ton"
   }
   ```

2. **Verify Signature**
   ```
   POST /auth/verify
   Content-Type: application/json
   
   {
     "walletAddress": "string",
     "chain": "solana|ton",
     "signature": "string",
     "message": "string"
   }
   ```

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Special endpoints**: May have stricter limits

## Error Handling

All API responses follow a consistent error format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## User Management

### Get Current User

```
GET /users/me
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "username": "string",
  "walletAddress": "string",
  "avatar": "string",
  "bio": "string",
  "isArtist": "boolean",
  "isCurator": "boolean",
  "createdAt": "timestamp"
}
```

### Update User Profile

```
PATCH /users/me
Content-Type: application/json

{
  "username": "string",
  "bio": "string",
  "avatar": "string"
}
```

### Get User by ID

```
GET /users/{userId}
```

## Music Tracks

### Get Tracks

```
GET /tracks
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- genre: string
- artistId: string
- isNFT: boolean
```

**Response:**
```json
{
  "tracks": [
    {
      "id": "string",
      "title": "string",
      "artist": {
        "id": "string",
        "username": "string",
        "avatar": "string"
      },
      "coverImage": "string",
      "duration": "number",
      "genre": "string",
      "releaseDate": "timestamp",
      "price": "number",
      "isNFT": "boolean",
      "playCount": "number",
      "likeCount": "number"
    }
  ],
  "total": "number",
  "hasMore": "boolean"
}
```

### Get Track by ID

```
GET /tracks/{trackId}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "artist": {
    "id": "string",
    "username": "string",
    "avatar": "string"
  },
  "coverImage": "string",
  "audioUrl": "string",
  "duration": "number",
  "genre": "string",
  "releaseDate": "timestamp",
  "price": "number",
  "isNFT": "boolean",
  "nft": {
    "id": "string",
    "tokenId": "string",
    "contractAddress": "string",
    "owner": "string"
  },
  "playCount": "number",
  "likeCount": "number",
  "createdAt": "timestamp"
}
```

### Upload Track

```
POST /tracks
Content-Type: multipart/form-data

Fields:
- title: string
- description: string
- genre: string
- audio: file
- cover: file
- price: number (optional)
- mintNFT: boolean (optional)
```

## NFT Operations

### Get NFTs

```
GET /nfts
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- owner: string
- creator: string
- isListed: boolean
```

**Response:**
```json
{
  "nfts": [
    {
      "id": "string",
      "tokenId": "string",
      "contractAddress": "string",
      "name": "string",
      "description": "string",
      "imageUrl": "string",
      "owner": {
        "id": "string",
        "username": "string",
        "avatar": "string"
      },
      "creator": {
        "id": "string",
        "username": "string",
        "avatar": "string"
      },
      "price": "number",
      "isListed": "boolean",
      "createdAt": "timestamp"
    }
  ],
  "total": "number",
  "hasMore": "boolean"
}
```

### Get NFT by ID

```
GET /nfts/{nftId}
```

### Mint NFT

```
POST /nfts/mint
Content-Type: application/json

{
  "trackId": "string",
  "name": "string",
  "description": "string",
  "royaltyPercent": "number"
}
```

### List NFT for Sale

```
POST /nfts/{nftId}/list
Content-Type: application/json

{
  "price": "number"
}
```

### Purchase NFT

```
POST /nfts/{nftId}/purchase
Content-Type: application/json

{
  "paymentMethod": "solana|ton|fiat"
}
```

## Token Operations

### Get Token Balance

```
GET /tokens/balance
```

**Response:**
```json
{
  "balance": "number",
  "totalEarned": "number",
  "totalSpent": "number"
}
```

### Get Token Transactions

```
GET /tokens/transactions
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- type: string (earn|spend|stake|unstake)
```

### Claim Tokens

```
POST /tokens/claim
```

### Stake Tokens

```
POST /tokens/stake
Content-Type: application/json

{
  "amount": "number",
  "duration": "number" // in days
}
```

### Unstake Tokens

```
POST /tokens/unstake
Content-Type: application/json

{
  "stakingId": "string"
}
```

## Staking Operations

### Get Staking Positions

```
GET /staking
Query Parameters:
- activeOnly: boolean (default: true)
```

**Response:**
```json
{
  "stakingPositions": [
    {
      "id": "string",
      "amount": "number",
      "startDate": "timestamp",
      "endDate": "timestamp",
      "duration": "number",
      "apy": "number",
      "rewards": "number",
      "claimedRewards": "number",
      "isActive": "boolean"
    }
  ]
}
```

### Claim Staking Rewards

```
POST /staking/{stakingId}/claim
```

## Blockchain Operations

### Get Wallet Balance

```
GET /blockchain/balance
Query Parameters:
- chain: string (solana|ton)
```

### Get Transaction Status

```
GET /blockchain/transactions/{txHash}
Query Parameters:
- chain: string (solana|ton)
```

### Get NFT Metadata

```
GET /blockchain/nfts/{contractAddress}/{tokenId}
Query Parameters:
- chain: string (solana|ton)
```

## Search

### Search Content

```
GET /search
Query Parameters:
- q: string (search query)
- type: string (track|nft|user)
- limit: number (default: 20)
```

**Response:**
```json
{
  "results": [
    {
      "type": "track|nft|user",
      "data": {}
    }
  ]
}
```

## Recommendations

### Get Recommended Tracks

```
GET /recommendations/tracks
Query Parameters:
- limit: number (default: 20)
- genre: string (optional)
```

### Get Recommended Artists

```
GET /recommendations/artists
Query Parameters:
- limit: number (default: 20)
```

## Analytics

### Get User Statistics

```
GET /analytics/user
```

**Response:**
```json
{
  "totalListens": "number",
  "totalPlayTime": "number",
  "favoriteGenres": [
    {
      "genre": "string",
      "count": "number"
    }
  ],
  "listeningHistory": [
    {
      "trackId": "string",
      "timestamp": "timestamp"
    }
  ]
}
```

### Get Artist Statistics

```
GET /analytics/artist
```

**Response:**
```json
{
  "totalPlays": "number",
  "totalEarnings": "number",
  "topTracks": [
    {
      "trackId": "string",
      "plays": "number",
      "earnings": "number"
    }
  ],
  "followerCount": "number"
}
```

## Notifications

### Get Notifications

```
GET /notifications
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- unreadOnly: boolean (default: false)
```

### Mark Notification as Read

```
PATCH /notifications/{notificationId}
Content-Type: application/json

{
  "read": "boolean"
}
```

### Mark All as Read

```
POST /notifications/mark-all-read
```

## WebSockets

The platform also supports real-time updates through WebSocket connections:

```
wss://api.normaldance.com/ws
```

### Events

- `track_played`: When a track is played
- `nft_minted`: When an NFT is minted
- `nft_sold`: When an NFT is sold
- `token_earned`: When tokens are earned
- `new_follower`: When a user gets a new follower
- `notification`: For general notifications

## Pagination

All list endpoints support pagination with the following response format:

```json
{
  "items": [],
  "pagination": {
    "limit": "number",
    "offset": "number",
    "total": "number",
    "hasMore": "boolean"
  }
}
```

## Data Formats

### Timestamps

All timestamps are in ISO 8601 format:
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

### Numbers

All monetary values are represented as strings to avoid floating-point precision issues:
```
"123.456789"
```

## Versioning

The API is versioned through the URL path:
```
/v1/endpoint
```

Breaking changes will result in a new version path:
```
/v2/endpoint
```

## CORS Policy

The API supports CORS with the following configuration:
- Allowed origins: `https://normaldance.com`, `https://app.normaldance.com`
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type, X-Requested-With
- Exposed headers: Content-Length, Content-Type

## Webhook Events

For server-to-server integrations, the platform supports webhook events:

### Configuration

```
POST /webhooks
Content-Type: application/json

{
  "url": "string",
  "events": ["track_minted", "nft_sold", "user_registered"],
  "secret": "string"
}
```

### Events

- `track_uploaded`: When a new track is uploaded
- `nft_minted`: When an NFT is minted
- `nft_sold`: When an NFT is sold
- `user_registered`: When a new user registers
- `payment_received`: When a payment is received

### Verification

All webhook requests include a signature header:
```
X-Webhook-Signature: sha256=<signature>
```

The signature is calculated using HMAC-SHA256 with the provided secret.