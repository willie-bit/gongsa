const isDev = import.meta.env.DEV;

export const API_CONFIG = {
  // 개발 환경: Vite 프록시(/api)를 통해 CORS 우회
  // 프로덕션 환경: 직접 API 호출
  baseUrl: isDev
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://api.holdings.miso.gs/ext/v1'),
  apiKey: import.meta.env.VITE_API_KEY || 'app-5N9l70h4wfnDrVccLDM3952R',
} as const;
