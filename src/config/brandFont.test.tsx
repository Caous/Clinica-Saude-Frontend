import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getBrandFont } from "./brandFont";
import { useBrandFont } from "../hooks/useBrandFont";

const getMock = vi.hoisted(() => vi.fn());
vi.mock("../services/service/AxioService", () => ({ instanceApi: { get: getMock } }));

describe("getBrandFont (UT-8)", () => {
  it("sem fonte configurada devolve a fonte padrão", () => {
    expect(getBrandFont({ fontFamily: "" })).toBe("Outfit, sans-serif");
  });

  it("devolve a fonte configurada com fallback de sistema", () => {
    expect(getBrandFont({ fontFamily: "Inter" })).toBe("Inter, system-ui, sans-serif");
  });
});

describe("useBrandFont", () => {
  it("re-renderiza com a fonte da marca quando o branding carrega", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "Inter" } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useBrandFont(), { wrapper });
    expect(result.current).toBe("Outfit, sans-serif");
    await waitFor(() => expect(result.current).toBe("Inter, system-ui, sans-serif"));
  });
});

describe("literais de fonte em src/ (UT-8)", () => {
  const SRC = resolve(__dirname, "..");
  const ALLOWED = new Set([join(SRC, "index.css"), join(SRC, "config", "brandFont.ts")]);

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    });
  }

  it("não sobra 'Outfit' além da definição de fallback", () => {
    const offenders = sourceFiles(SRC).filter((file) => !ALLOWED.has(file) && /outfit/i.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
