const fs = require("fs");
const content = fs.readFileSync("src/lib/security/xss-csrf.ts", "utf-8");
const lines = content.split("\n");

console.log("escapeHTML function lines (24-237):");
for (let i = 223; i < 237; i++) {
  console.log(`${i + 1} | ${JSON.stringify(lines[i])}`);
}

console.log("\nescapeAttribute function lines (243-258):");
for (let i = 242; i < 258; i++) {
  console.log(`${i + 1} | ${JSON.stringify(lines[i])}`);
}
