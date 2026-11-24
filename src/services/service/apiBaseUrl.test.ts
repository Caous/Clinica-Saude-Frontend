import { describe, it, expect } from "vitest";
import { resolveApiBaseUrl, DEV_API_BASE_URL } from "./apiBaseUrl";

describe("resolveApiBaseUrl (UT-7)", () => {
  it("em produção sem a variável falha com mensagem clara", () => {
    expect(() => resolveApiBaseUrl({ isProduction: true, configuredUrl: undefined })).toThrow(/VITE_API_BASE_URL/);
  });

  it("variável em branco conta como ausente em produção", () => {
    expect(() => resolveApiBaseUrl({ isProduction: true, configuredUrl: "   " })).toThrow(/VITE_API_BASE_URL/);
  });

  it("em produção usa a variável, sem barra final", () => {
    expect(resolveApiBaseUrl({ isProduction: true, configuredUrl: "https://api.example.com/api/" })).toBe(
      "https://api.example.com/api"
    );
  });

  it("em desenvolvimento sem a variável usa o fallback local", () => {
    expect(resolveApiBaseUrl({ isProduction: false, configuredUrl: undefined })).toBe(DEV_API_BASE_URL);
    expect(DEV_API_BASE_URL).toBe("http://localhost:5101/api");
  });

  it("em desenvolvimento a variável tem precedência sobre o fallback", () => {
    expect(resolveApiBaseUrl({ isProduction: false, configuredUrl: "http://localhost:9999/api" })).toBe(
      "http://localhost:9999/api"
    );
  });
});
