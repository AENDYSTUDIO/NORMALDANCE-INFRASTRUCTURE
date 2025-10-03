import qdrantClient from "./qdrant-config";

// Интерфейс для документа в Qdrant
interface QdrantDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  vector: number[];
}

// Сервис для работы с Qdrant
class QdrantService {
  private collectionName = "codedocs";

  async initCollection() {
    try {
      // Проверяем, существует ли коллекция
      const collections = await qdrantClient.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!collectionExists) {
        // Создаем коллекцию, если она не существует
        await qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 512, // Размер вектора для embeddings
            distance: "Cosine", // Метрика расстояния
          },
        });
        console.log(`Коллекция ${this.collectionName} создана`);
      } else {
        console.log(`Коллекция ${this.collectionName} уже существует`);
      }
    } catch (error) {
      console.error("Ошибка при инициализации коллекции:", error);
      throw error;
    }
  }

  async addDocument(document: QdrantDocument) {
    try {
      const points = [
        {
          id: document.id,
          vector: document.vector,
          payload: {
            content: document.content,
            metadata: document.metadata,
          },
        },
      ];

      await qdrantClient.upsert(this.collectionName, {
        points,
      });

      console.log(`Документ ${document.id} добавлен в Qdrant`);
    } catch (error) {
      console.error("Ошибка при добавлении документа:", error);
      throw error;
    }
  }

  async searchDocuments(queryVector: number[], limit: number = 5) {
    try {
      const results = await qdrantClient.search(this.collectionName, {
        vector: queryVector,
        limit: limit,
        with_payload: true,
      });

      return results;
    } catch (error) {
      console.error("Ошибка при поиске документов:", error);
      throw error;
    }
  }

  async searchDocumentsByContent(content: string, limit: number = 5) {
    // В реальной реализации здесь должен быть вызов API для получения embeddings
    // из текстового содержимого, но для примера используем заглушку
    const mockVector = Array(512)
      .fill(0)
      .map(() => Math.random());

    return this.searchDocuments(mockVector, limit);
  }
}

export default new QdrantService();
