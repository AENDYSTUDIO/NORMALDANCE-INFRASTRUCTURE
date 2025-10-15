# 📊 API Documentation

## Base URL
```
Production: https://api.normaldance.com
Staging: https://staging-api.normaldance.com
Development: http://localhost:3001
```

## Authentication

### JWT Token
```http
Authorization: Bearer <jwt_token>
```

### Wallet Authentication
```http
X-Wallet-Address: <solana_wallet_address>
X-Wallet-Signature: <signed_message>
```

## Core Endpoints

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
```

### Users
```http
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/follow
```

### Music Tracks
```http
GET    /api/tracks
POST   /api/tracks
GET    /api/tracks/:id
PUT    /api/tracks/:id
DELETE /api/tracks/:id
POST   /api/tracks/:id/like
```

### NFTs
```http
GET    /api/nfts
POST   /api/nfts/mint
GET    /api/nfts/:id
PUT    /api/nfts/:id
POST   /api/nfts/:id/transfer
GET    /api/nfts/marketplace
```

### Playlists
```http
GET    /api/playlists
POST   /api/playlists
GET    /api/playlists/:id
PUT    /api/playlists/:id
DELETE /api/playlists/:id
POST   /api/playlists/:id/tracks
```

## Request/Response Examples

### Create Track
```http
POST /api/tracks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "My New Track",
  "description": "Amazing music",
  "genre": "Electronic",
  "duration": 180,
  "file_url": "ipfs://QmHash...",
  "cover_url": "ipfs://QmCover..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "track_123",
    "title": "My New Track",
    "artist_id": "user_456",
    "created_at": "2024-12-19T10:00:00Z",
    "ipfs_hash": "QmHash...",
    "nft_address": null
  }
}
```

### Mint NFT
```http
POST /api/nfts/mint
Content-Type: application/json
Authorization: Bearer <token>

{
  "track_id": "track_123",
  "price": 1.5,
  "royalty_percentage": 10,
  "max_supply": 100
}
```

Response:
```json
{
  "success": true,
  "data": {
    "nft_id": "nft_789",
    "mint_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transaction_signature": "5VfYQ1...",
    "metadata_uri": "https://arweave.net/abc123"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "title",
      "reason": "Title is required"
    }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

### Limits
- **Authenticated**: 1000 requests/hour
- **Anonymous**: 100 requests/hour
- **Upload**: 10 files/hour

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

## WebSocket Events

### Connection
```javascript
const socket = io('wss://api.normaldance.com', {
  auth: { token: 'jwt_token' }
});
```

### Events
```javascript
// Listen for new tracks
socket.on('track:created', (track) => {
  console.log('New track:', track);
});

// Listen for NFT sales
socket.on('nft:sold', (sale) => {
  console.log('NFT sold:', sale);
});

// Join room for real-time updates
socket.emit('join:artist', { artistId: 'user_123' });
```