import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MusicContextProvider } from './providers/music.js';
import { UserContextProvider } from './providers/user.js';
import { NFTContextProvider } from './providers/nft.js';
import { StakingContextProvider } from './providers/staking.js';

export class NormalDanceMCPServer {
  private server: Server;
  private providers: {
    music: MusicContextProvider;
    users: UserContextProvider;
    nft: NFTContextProvider;
    staking: StakingContextProvider;
  };

  constructor() {
    this.server = new Server({
      name: 'normaldance-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: Record<string, unknown>,
        tools: Record<string, unknown>,
        prompts: Record<string, unknown>
      }
    });

    this.providers = {
      music: new MusicContextProvider(),
      users: new UserContextProvider(),
      nft: new NFTContextProvider(),
      staking: new StakingContextProvider()
    };

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler('resources/list', async () => ({
      resources: [
        { uri: 'track://', name: 'Music Tracks', mimeType: 'application/json' },
        { uri: 'user://', name: 'User Profiles', mimeType: 'application/json' },
        { uri: 'nft://', name: 'NFT Collections', mimeType: 'application/json' },
        { uri: 'staking://', name: 'Staking Data', mimeType: 'application/json' }
      ]
    }));

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      const [protocol, path] = uri.split('://');
      
      let data;
      switch (protocol) {
        case 'track':
          data = await this.providers.music.getTrack(path);
          break;
        case 'user':
          data = await this.providers.users.getUser(path);
          break;
        case 'nft':
          data = await this.providers.nft.getNFT(path);
          break;
        case 'staking':
          data = await this.providers.staking.getPosition(path);
          break;
        default:
          throw new Error(`Unknown protocol: ${protocol}`);
      }

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data)
        }]
      };
    });

    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'search_music',
          description: 'Search for music tracks',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              genre: { type: 'string' },
              limit: { type: 'number', default: 10 }
            }
          }
        },
        {
          name: 'get_recommendations',
          description: 'Get personalized music recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              count: { type: 'number', default: 20 }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      let result;
      switch (name) {
        case 'search_music':
          result = await this.providers.music.searchTracks(args.query, args);
          break;
        case 'get_recommendations':
          result = await this.providers.music.getRecommendations(args.userId);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('NORMAL DANCE MCP Server started');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NormalDanceMCPServer();
  server.start().catch(console.error);
}