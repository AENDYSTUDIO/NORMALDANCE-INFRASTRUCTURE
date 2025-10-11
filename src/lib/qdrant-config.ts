import { QdrantClient } from "@qdrant/js-client-rest";

if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
  throw new Error('QDRANT_URL and QDRANT_API_KEY environment variables are required');
}

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  port: parseInt(process.env.QDRANT_PORT || '6333'),
  apiKey: process.env.QDRANT_API_KEY,
});

export default qdrantClient;
