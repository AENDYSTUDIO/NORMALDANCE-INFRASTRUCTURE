import type { SwaggerDefinition } from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI configuration
 */
export const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NORMAL DANCE API',
    version: '0.0.3',
    description: 'Decentralized music platform API with Web3 integration',
    contact: {
      name: 'NORMAL DANCE Team',
      url: 'https://normaldance.com',
      email: 'support@normaldance.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://normaldance.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Tracks',
      description: 'Music track management endpoints',
    },
    {
      name: 'Users',
      description: 'User management and authentication endpoints',
    },
    {
      name: 'NFTs',
      description: 'NFT minting and marketplace endpoints',
    },
    {
      name: 'Wallet',
      description: 'Web3 wallet integration endpoints',
    },
    {
      name: 'Playlists',
      description: 'Playlist management endpoints',
    },
    {
      name: 'Staking',
      description: 'Token staking endpoints',
    },
    {
      name: 'Clubs',
      description: 'NFT-based club management endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      walletAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Wallet-Address',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'An error occurred',
              },
              code: {
                type: 'string',
                example: 'ERROR_CODE',
              },
              statusCode: {
                type: 'integer',
                example: 400,
              },
              details: {
                type: 'object',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
      },
      Track: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          title: {
            type: 'string',
            example: 'Amazing Track',
          },
          artistName: {
            type: 'string',
            example: 'Artist Name',
          },
          genre: {
            type: 'string',
            example: 'Electronic',
          },
          duration: {
            type: 'integer',
            example: 180,
            description: 'Duration in seconds',
          },
          playCount: {
            type: 'integer',
            example: 1000,
          },
          likeCount: {
            type: 'integer',
            example: 150,
          },
          ipfsHash: {
            type: 'string',
            example: 'QmXxxx...',
          },
          audioUrl: {
            type: 'string',
            example: 'https://ipfs.io/ipfs/QmXxxx...',
          },
          coverImage: {
            type: 'string',
            example: 'https://example.com/cover.jpg',
          },
          price: {
            type: 'number',
            example: 10.5,
          },
          isExplicit: {
            type: 'boolean',
            example: false,
          },
          isPublished: {
            type: 'boolean',
            example: true,
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
            example: 'PUBLISHED',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          username: {
            type: 'string',
          },
          displayName: {
            type: 'string',
          },
          wallet: {
            type: 'string',
          },
          balance: {
            type: 'number',
          },
          tonBalance: {
            type: 'number',
          },
          isArtist: {
            type: 'boolean',
          },
          role: {
            type: 'string',
            enum: ['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN'],
          },
          level: {
            type: 'string',
            enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
          },
        },
      },
      NFT: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          tokenId: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          imageUrl: {
            type: 'string',
          },
          price: {
            type: 'number',
          },
          status: {
            type: 'string',
            enum: ['LISTED', 'SOLD', 'MINTED', 'TRANSFERRED'],
          },
          type: {
            type: 'string',
            enum: ['TRACK', 'ALBUM', 'PLAYLIST', 'ARTIST'],
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 20,
          },
          total: {
            type: 'integer',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            example: 5,
          },
          hasMore: {
            type: 'boolean',
            example: true,
          },
        },
      },
    },
  },
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/app/api/**/*.ts'], // Path to API routes
};