#!/usr/bin/env node

import fs from "fs/promises";

async function testVersionReading() {
  try {
    console.log("Trying to read package.json...");
    const packageJson = JSON.parse(await fs.readFile("./package.json", "utf8"));
    console.log("Version:", packageJson.version);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testVersionReading();
