#!/usr/bin/env node

process.env.NODE_ENV = "production";

const nextBuild = require("next/dist/build").default;

nextBuild(process.cwd()).catch((error) => {
  console.error("Next.js build failed:", error);
  process.exit(1);
});
