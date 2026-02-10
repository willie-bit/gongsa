export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.holdings.miso.gs/ext/v1',
  apiKey: import.meta.env.VITE_API_KEY || 'app-5N9l70h4wfnDrVccLDM3952R',
} as const;
