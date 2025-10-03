import codeEmbeddings from "../src/lib/code-embeddings";

async function indexCodebase() {
  console.log("Начинаем индексацию кодовой базы...");

  try {
    await codeEmbeddings.indexCodebase("src");
    console.log("Индексация кодовой базы завершена успешно!");
  } catch (error) {
    console.error("Ошибка при индексации кодовой базы:", error);
    process.exit(1);
  }
}

// Запускаем индексацию
indexCodebase();
