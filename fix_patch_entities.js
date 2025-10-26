const fs = require("fs");

let content = fs.readFileSync("src/lib/security/xss-csrf.ts", "utf-8");

// Нормализуем перевод строк для стабильных замен
let normalized = content.replace(/\r\n/g, "\n");

// Шаблоны неправильных строк и корректные замены
const replacements = [
  {
    from: '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");',
    to: '  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&");',
  },
  {
    from: '  out = out.replace(/</g, "<").replace(/>/g, ">");',
    to: '  out = out.replace(/</g, "<").replace(/>/g, ">");',
  },
  {
    // Тройные кавычки как неправильное экранирование
    from: '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");',
    to: '  out = out.replace(/"/g, """).replace(/\'/g, "&#x27;");',
  },
];

for (const { from, to } of replacements) {
  normalized = normalized.split(from).join(to);
}

// Записываем обратно (используем \n; TS компилятор это устраивает)
fs.writeFileSync("src/lib/security/xss-csrf.ts", normalized, "utf-8");

console.log('Правильные HTML-энтити применены: &, <, >, ", &#x27;');
