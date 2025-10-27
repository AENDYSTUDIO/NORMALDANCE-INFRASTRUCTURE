const fs = require("fs");
const content = fs.readFileSync("src/lib/security/xss-csrf.ts", "utf-8");
const lines = content.split("\n");

// Исправляем строки с неправильным экранированием
lines[228] =
  '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");';
lines[230] = '  out = out.replace(/</g, "<").replace(/>/g, ">");';
lines[232] = '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");';
lines[247] =
  '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");';
lines[249] = '  out = out.replace(/</g, "<").replace(/>/g, ">");';
lines[251] = '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");';

fs.writeFileSync("src/lib/security/xss-csrf.ts", lines.join("\n"));
console.log("Файл успешно обновлен с правильным экранированием");
