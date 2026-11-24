/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API (obrigatória em produção). Ex.: https://api.seudominio.com/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
