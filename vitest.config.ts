import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Configuração de testes (Vitest + Testing Library).
// Mantida separada de vite.config.ts para não impactar o build de produção.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
