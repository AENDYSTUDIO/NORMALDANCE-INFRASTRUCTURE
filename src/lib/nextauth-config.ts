/**
 * Конфигурация NextAuth для различных окружений
 *
 * Этот файл содержит логику для правильной настройки NextAuth в зависимости от окружения
 */

// Проверка наличия необходимых переменных окружения
function validateEnvVars() {
  const requiredVars = ["NEXTAUTH_SECRET"];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`);
    return false;
  }

  return true;
}

// Функция для получения конфигурации NextAuth
export function getNextAuthConfig() {
  // Проверяем, что переменные окружения установлены
  if (!validateEnvVars()) {
    console.error("NextAuth configuration validation failed");
    return null;
  }

  // Возвращаем конфигурацию
  return {
    secret: process.env.NEXTAUTH_SECRET,
    // Другие настройки можно добавить здесь
  };
}
