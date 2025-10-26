#!/usr/bin/env node

import cluster from "cluster";
import http from "http";
import https from "https";

// Load testing configuration
const config = {
  target: process.env.LOAD_TEST_TARGET || "http://localhost:3000",
  duration: process.env.LOAD_TEST_DURATION || 6000, // 60 seconds
  concurrency: process.env.LOAD_TEST_CONCURRENCY || 10,
  requestsPerSecond: process.env.LOAD_TEST_RPS || 100,
  endpoints: ["/", "/api/health", "/api/tracks", "/api/users"],
  expectedResponseTime: 1000, // 1 second
  expectedSuccessRate: 0.95, // 95%
};

// Load test runner
class LoadTester {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      startTime: Date.now(),
      endTime: 0,
    };
  }

  async run() {
    console.log(`Starting load test on ${config.target}`);
    console.log(
      `Duration: ${config.duration}ms, Concurrency: ${config.concurrency}`
    );

    const workers = [];

    // Create worker processes
    for (let i = 0; i < config.concurrency; i++) {
      const worker = cluster.fork();
      workers.push(worker);

      worker.on("message", (data) => {
        if (data.type === "stats") {
          this.updateStats(data.stats);
        }
      });
    }

    // Wait for duration
    await new Promise((resolve) => setTimeout(resolve, config.duration));

    // Terminate workers
    workers.forEach((worker) => worker.kill());

    this.stats.endTime = Date.now();
    this.printReport();

    return this.evaluateResults();
  }

  updateStats(stats) {
    this.stats.totalRequests += stats.totalRequests;
    this.stats.successfulRequests += stats.successfulRequests;
    this.stats.failedRequests += stats.failedRequests;
    this.stats.responseTimes.push(...stats.responseTimes);
  }

  printReport() {
    const totalDuration = this.stats.endTime - this.stats.startTime;
    const avgResponseTime =
      this.stats.responseTimes.length > 0
        ? this.stats.responseTimes.reduce((a, b) => a + b, 0) /
          this.stats.responseTimes.length
        : 0;

    console.log("\n=== Load Test Report ===");
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Total Requests: ${this.stats.totalRequests}`);
    console.log(`Successful Requests: ${this.stats.successfulRequests}`);
    console.log(`Failed Requests: ${this.stats.failedRequests}`);
    console.log(
      `Success Rate: ${(
        (this.stats.successfulRequests / this.stats.totalRequests) *
        100
      ).toFixed(2)}%`
    );
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(
      `Requests per Second: ${(
        this.stats.totalRequests /
        (totalDuration / 1000)
      ).toFixed(2)}`
    );

    if (this.stats.responseTimes.length > 0) {
      const sortedTimes = [...this.stats.responseTimes].sort((a, b) => a - b);
      console.log(
        `95th Percentile: ${
          sortedTimes[Math.floor(sortedTimes.length * 0.95)]
        }ms`
      );
      console.log(
        `99th Percentile: ${
          sortedTimes[Math.floor(sortedTimes.length * 0.99)]
        }ms`
      );
    }
  }

  evaluateResults() {
    const successRate =
      this.stats.successfulRequests / this.stats.totalRequests;
    const avgResponseTime =
      this.stats.responseTimes.length > 0
        ? this.stats.responseTimes.reduce((a, b) => a + b, 0) /
          this.stats.responseTimes.length
        : Infinity;

    const isSuccessful =
      successRate >= config.expectedSuccessRate &&
      avgResponseTime <= config.expectedResponseTime;

    console.log(`\nLoad test ${isSuccessful ? "PASSED" : "FAILED"}`);
    console.log(
      `Success rate: ${successRate.toFixed(2)} (expected: ${
        config.expectedSuccessRate
      })`
    );
    console.log(
      `Avg response time: ${avgResponseTime.toFixed(2)}ms (expected: <=${
        config.expectedResponseTime
      }ms)`
    );

    return isSuccessful;
  }
}

// Worker process (when cluster.fork() is called)
if (cluster.isWorker) {
  // Worker process to make requests
  const workerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
  };

  const makeRequest = (endpoint) => {
    return new Promise((resolve) => {
      const url = new URL(config.target + endpoint);
      const client = url.protocol === "https:" ? https : http;

      const startTime = Date.now();

      const req = client.request(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const responseTime = Date.now() - startTime;

          workerStats.totalRequests++;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            workerStats.successfulRequests++;
          } else {
            workerStats.failedRequests++;
          }
          workerStats.responseTimes.push(responseTime);

          resolve();
        });
      });

      req.on("error", () => {
        const responseTime = Date.now() - startTime;
        workerStats.totalRequests++;
        workerStats.failedRequests++;
        workerStats.responseTimes.push(responseTime);
        resolve();
      });

      req.end();
    });
  };

  // Continuously make requests for the duration
  const startTime = Date.now();
  const interval = 1000 / (config.requestsPerSecond / config.concurrency); // Distribute RPS across workers

  const requestLoop = async () => {
    if (Date.now() - startTime < config.duration) {
      const endpoint =
        config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
      await makeRequest(endpoint);

      process.nextTick(requestLoop);
    } else {
      // Send stats back to master
      process.send({ type: "stats", stats: workerStats });
      process.exit(0);
    }
  };

  requestLoop();
} else {
  // Master process
  if (require.main === module) {
    const tester = new LoadTester();
    tester
      .run()
      .then((success) => {
        process.exit(success ? 0 : 1);
      })
      .catch((error) => {
        console.error("Load test failed:", error);
        process.exit(1);
      });
  }
}

export { LoadTester };
