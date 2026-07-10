// Estende `expect` com os matchers de @testing-library/jest-dom (ex.: toBeInTheDocument).
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Com `globals: false` o cleanup automático do Testing Library não é registrado;
// desmontamos manualmente após cada teste para evitar vazamento de DOM entre casos.
afterEach(() => {
  cleanup();
});
