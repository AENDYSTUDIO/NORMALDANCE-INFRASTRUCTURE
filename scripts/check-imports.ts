#!/usr/bin/env node

import fs from "fs";
import { glob } from "glob";
import path from "path";

interface ImportFix {
  file: string;
  oldImport: string;
  newImport: string;
}

function checkAndFixImports() {
  const tsFiles = glob.sync("**/*.{ts,tsx,js,jsx}", {
    ignore: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "out/**",
      "mobile-app/**",
      "scripts/**",
    ],
  });

  const fixes: ImportFix[] = [];

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, "utf8");
    let updatedContent = content;

    // Проверка и исправление импортов
    const relativePath = path.dirname(file);
    const imports = content.match(/from\s+['"][^'"]+['"]/g) || [];

    for (const importMatch of imports) {
      const importPath = importMatch.match(/['"]([^'"]+)['"]/)?.[1];
      if (
        importPath &&
        (importPath.startsWith("./") || importPath.startsWith("../"))
      ) {
        // Проверка существования файла
        const resolvedPath = path.resolve(relativePath, importPath);
        const normalizedPath = path.relative(".", resolvedPath);

        // Преобразование в путь с @/
        if (normalizedPath.startsWith("src/")) {
          const newPath = normalizedPath.replace("src/", "@/");
          updatedContent = updatedContent.replace(
            importMatch,
            importMatch.replace(importPath, newPath)
          );
        }
      }
    }

    if (content !== updatedContent) {
      fs.writeFileSync(file, updatedContent, "utf8");
      console.log(`Fixed imports in: ${file}`);
    }
  }

  return fixes;
}

if (require.main === module) {
  checkAndFixImports();
  console.log("Import check completed");
}

export { checkAndFixImports };
