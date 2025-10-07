// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from "@/lib/socket";
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const currentPort = 3000;
const hostname = "0.0.0.0";

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: "./.next" },
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith("/api/socketio")) {
        return;
      }
      handle(req, res);
    });

    // Skip Socket.IO setup when running on Vercel since serverless functions don't support persistent connections
    if (process.env.VERCEL !== "1") {
      const io = new Server(server, {
        path: "/api/socketio",
        cors: {
          origin: [
            "http://localhost:3000",
            "https://normaldance.ru",
            "https://www.normaldance.ru",
          ],
          methods: ["GET", "POST"],
        },
      });

      // Optional Redis adapter for multi-replica setups
      try {
        // Lazy import to avoid hard dependency in local dev
        const { createAdapter } = (await import(
          "@socket.io/redis-adapter"
        )) as any;
        const Redis = (await import("ioredis")).default;
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        const pubClient = new Redis(redisUrl);
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis adapter enabled");
      } catch (e: any) {
        console.warn("Socket.IO Redis adapter not enabled:", e?.message || e);
      }

      setupSocket(io);
    } else {
      console.log("Running on Vercel, skipping Socket.IO server setup");
    }

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(
        `> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`
      );
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
