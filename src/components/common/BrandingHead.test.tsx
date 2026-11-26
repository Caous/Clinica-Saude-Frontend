import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import BrandingHead from "./BrandingHead";

const getMock = vi.hoisted(() => vi.fn());
vi.mock("../../services/service/AxioService", () => ({ instanceApi: { get: getMock } }));

const root = () => document.documentElement.style;
const themeColor = () => document.head.querySelector('meta[name="theme-color"]');

function renderHead(client = new QueryClient()) {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <BrandingHead />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe("BrandingHead: tema em runtime", () => {
  beforeEach(() => {
    getMock.mockReset();
  });
  afterEach(() => {
    root().removeProperty("--color-brand-500");
    root().removeProperty("--color-brand-secondary");
    document.head.querySelectorAll('link[rel~="icon"]').forEach((link) => link.remove());
  });

  it("aplica primaryColor e secondaryColor válidas nas variáveis CSS", async () => {
    getMock.mockResolvedValue({ data: { primaryColor: "#cc0000", secondaryColor: "#00ff00" } });
    renderHead();

    await waitFor(() => expect(root().getPropertyValue("--color-brand-500")).toBe("#cc0000"));
    expect(root().getPropertyValue("--color-brand-600")).not.toBe("");
    expect(root().getPropertyValue("--color-brand-secondary")).toBe("#00ff00");
    await waitFor(() => expect(themeColor()?.getAttribute("content")).toBe("#cc0000"));
  });

  it("troca de cor A para B sobrescreve os tons", async () => {
    getMock.mockResolvedValue({ data: { primaryColor: "#cc0000" } });
    const client = new QueryClient();
    renderHead(client);
    await waitFor(() => expect(root().getPropertyValue("--color-brand-500")).toBe("#cc0000"));
    const tomA = root().getPropertyValue("--color-brand-700");

    getMock.mockResolvedValue({ data: { primaryColor: "#0000ff" } });
    await client.invalidateQueries(["branding"]);

    await waitFor(() => expect(root().getPropertyValue("--color-brand-500")).toBe("#0000ff"));
    expect(root().getPropertyValue("--color-brand-700")).not.toBe(tomA);
  });

  it("remove as variáveis no unmount (cleanup)", async () => {
    getMock.mockResolvedValue({ data: { primaryColor: "#cc0000", secondaryColor: "#00ff00" } });
    const { unmount } = renderHead();
    await waitFor(() => expect(root().getPropertyValue("--color-brand-500")).toBe("#cc0000"));

    unmount();

    expect(root().getPropertyValue("--color-brand-500")).toBe("");
    expect(root().getPropertyValue("--color-brand-950")).toBe("");
    expect(root().getPropertyValue("--color-brand-secondary")).toBe("");
  });

  it("cor inválida da API: mantém o tema estático e não emite theme-color", async () => {
    getMock.mockResolvedValue({ data: { primaryColor: "red", secondaryColor: "x" } });
    renderHead();

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(root().getPropertyValue("--color-brand-500")).toBe("");
    expect(root().getPropertyValue("--color-brand-secondary")).toBe("");
    expect(themeColor()).toBeNull();
  });

  it("API fora do ar: mantém o tema estático", async () => {
    getMock.mockRejectedValue(new Error("Network Error"));
    renderHead();

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(root().getPropertyValue("--color-brand-500")).toBe("");
  });

  it("mantém um único link rel=icon, com o favicon da marca", async () => {
    document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="/favicon.ico" />');
    getMock.mockResolvedValue({ data: { faviconUrl: "/acme.ico" } });
    renderHead();

    await waitFor(() =>
      expect(document.head.querySelector('link[rel="icon"]')?.getAttribute("href")).toBe("/acme.ico")
    );
    expect(document.head.querySelectorAll('link[rel="icon"]')).toHaveLength(1);
  });
});
