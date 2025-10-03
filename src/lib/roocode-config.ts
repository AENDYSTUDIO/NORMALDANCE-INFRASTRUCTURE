// Конфигурация для интеграции с roocode
interface RooCodeConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  timeout: number;
}

const rooCodeConfig: RooCodeConfig = {
  enabled: true,
  apiUrl: process.env.ROOCODE_API_URL || "https://api.roocode.example.com",
  apiKey: process.env.ROOCODE_API_KEY || "",
  timeout: parseInt(process.env.ROOCODE_TIMEOUT || "5000"),
};

export default rooCodeConfig;
