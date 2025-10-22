const fs = require("fs");

// Read package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Add the deploy:grave script
packageJson.scripts["deploy:grave"] =
  "npx hardhat run scripts/deploy-grave-memorial.js";

// Write back to package.json
fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

console.log("Successfully added deploy:grave script to package.json");
