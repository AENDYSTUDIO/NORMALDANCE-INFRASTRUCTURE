import codeEmbeddings from "@/lib/code-embeddings";

export async function POST(request: NextRequest) {
  try {
    const { projectPath = "src" } = await request.json();

    // Запускаем индексацию кодовой базы
    await codeEmbeddings.indexCodebase(projectPath);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Кодовая база из ${projectPath} успешно проиндексирована`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ошибка при индексации кодовой базы:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
