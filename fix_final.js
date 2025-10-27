const fs = require("fs");

// Читаем файл
const content = fs.readFileSync("src/lib/security/xss-csrf.ts", "utf-8");
const lines = content.split("\n");

// Исправляем строки с неправильным экранированием
// Строка 229 (индекс 228)
lines[228] =
  '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");';

// Строка 231 (индекс 230)
lines[230] = '  out = out.replace(/</g, "<").replace(/>/g, ">");';

// Строка 233 (индекс 232)
lines[232] = '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");';

// Строка 248 (индекс 247)
lines[247] =
  '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");';

// Строка 250 (индекс 249)
lines[249] = '  out = out.replace(/</g, "<").replace(/>/g, ">");';

// Строка 252 (индекс 251)
lines[251] = '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");';

// Записываем исправленный файл
fs.writeFileSync("src/lib/security/xss-csrf.ts", lines.join("\n"));
console.log("Файл успешно исправлен");
