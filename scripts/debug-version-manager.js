#!/usr/bin/env node

import fs from "fs/promises";

console.log("Script started");

try {
  const args = process.argv.slice(2);
  console.log("Arguments:", args);
  console.log("Process argv[1]:", process.argv[1]);
  console.log("Import meta url:", import.meta.url);
  console.log("__filename equivalent:", new URL(import.meta.url).pathname);

  const packageJson = JSON.parse(await fs.readFile("./package.json", "utf8"));
  console.log("Version from package.json:", packageJson.version);
} catch (error) {
  console.error("Error in debug script:", error);
}
