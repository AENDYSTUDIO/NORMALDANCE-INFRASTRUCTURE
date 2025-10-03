import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
  url: "https://75a936be-5354-4fe9-863d-fc61eed57daa.europe-west3-0.gcp.cloud.qdrant.io",
  port: 6333,
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.cdp7oLdFxWAKRbclaqCCZQMzixNWXqOuWi324JgwdF4",
});

export default qdrantClient;
