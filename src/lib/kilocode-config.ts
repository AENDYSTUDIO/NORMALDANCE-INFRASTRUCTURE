// Конфигурация для интеграции с kilocode
interface KiloCodeConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  timeout: number;
}

const kiloCodeConfig: KiloCodeConfig = {
  enabled: true,
  apiUrl: process.env.KILOCODE_API_URL || "https://api.kilocode.example.com",
  apiKey: process.env.KILOCODE_API_KEY || "",
  timeout: parseInt(process.env.KILOCODE_TIMEOUT || "5000"),
};

export default kiloCodeConfig;
