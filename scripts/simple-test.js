#!/usr/bin/env node

console.log("Simple test output");

if (process.argv[2] === "current") {
  console.log("0.2.0");
} else {
  console.log("Command:", process.argv[2]);
}
