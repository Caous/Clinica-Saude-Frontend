import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FALLBACK_BRANDING } from "../config/branding";
import { useBranding } from "./useBranding";

const getMock = vi.hoisted(() => vi.fn());
vi.mock("../services/service/AxioService", () => ({ instanceApi: { get: getMock } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useBranding", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("UT-3: retorna nome/logo/cores vindos da API", async () => {
    getMock.mockResolvedValue({
      data: {
        name: "Teste Clínica",
        shortName: "Teste",
        logoLightUrl: "/x.svg",
        logoDarkUrl: "/y.svg",
        faviconUrl: "/z.png",
        primaryColor: "#123456",
        secondaryColor: "#654321",
        supportEmail: "a@b.example",
      },
    });
    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => expect(result.current.name).toBe("Teste Clínica"));
    expect(result.current.logoLightUrl).toBe("/x.svg");
    expect(result.current.primaryColor).toBe("#123456");
    expect(getMock).toHaveBeenCalledWith("/Branding");
  });

  it("primeiro frame usa o fallback, sem bloquear a renderização", () => {
    getMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBranding(), { wrapper });
    expect(result.current).toEqual(FALLBACK_BRANDING);
  });

  it("UT-4: erro de rede retorna fallback neutro sem lançar", async () => {
    getMock.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(result.current).toEqual(FALLBACK_BRANDING);
  });

  it("resposta parcial completa os campos com o fallback", async () => {
    getMock.mockResolvedValue({ data: { name: "Parcial" } });
    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => expect(result.current.name).toBe("Parcial"));
    expect(result.current.supportEmail).toBe(FALLBACK_BRANDING.supportEmail);
  });
});

describe("useBranding: política de retry", () => {
  it("tenta mais uma vez após falha e depois usa o fallback", async () => {
    getMock.mockReset();
    getMock.mockRejectedValue(new Error("Network Error"));
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 1 } } });
    const { result } = renderHook(() => useBranding(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(result.current).toEqual(FALLBACK_BRANDING);
  });
});
