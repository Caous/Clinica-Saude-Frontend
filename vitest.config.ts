import { defineConfig } from "vitest/config";

// Configuração de testes unitários (lógica pura de recorrência).
// Ambiente "node": não depende de DOM, mantendo a suíte leve e determinística.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
