export const DEV_API_BASE_URL = "http://localhost:5101/api";

interface ApiBaseUrlInput {
  isProduction: boolean;
  configuredUrl: string | undefined;
}

/**
 * Resolve a URL base da API. Em produção a variável `VITE_API_BASE_URL` é obrigatória:
 * não há URL padrão para não apontar silenciosamente para um ambiente errado.
 */
export function resolveApiBaseUrl({ isProduction, configuredUrl }: ApiBaseUrlInput): string {
  const trimmedUrl = configuredUrl?.trim();

  if (trimmedUrl) return trimmedUrl.replace(/\/+$/, "");
  if (!isProduction) return DEV_API_BASE_URL;

  throw new Error(
    "VITE_API_BASE_URL não está definida. Configure a URL base da API (ex.: https://api.seudominio.com/api) " +
      "nas variáveis de ambiente do build de produção. Veja .env.example."
  );
}
