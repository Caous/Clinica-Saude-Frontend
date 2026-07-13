// Estende `expect` com os matchers de @testing-library/jest-dom (ex.: toBeInTheDocument).
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom não implementa `window.matchMedia`; alguns componentes (ex.: react-hot-toast)
// dependem dele. Fornecemos um stub mínimo para o ambiente de teste.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Com `globals: false` o cleanup automático do Testing Library não é registrado;
// desmontamos manualmente após cada teste para evitar vazamento de DOM entre casos.
afterEach(() => {
  cleanup();
});
