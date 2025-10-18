#!/usr/bin/env node

process.env.NODE_ENV = "production";

import nextBuild from 'next/dist/build';.default;

nextBuild(process.cwd()).catch((error) => {
  console.error("Next.js build failed:", error);
  process.exit(1);
});
