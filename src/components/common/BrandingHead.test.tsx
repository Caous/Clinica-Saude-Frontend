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

describe("BrandingHead: fonte da marca (UT-6, UT-7, UT-10)", () => {
  const fontLinks = () => document.head.querySelectorAll('link[rel="stylesheet"][data-brand-font]');
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter&display=swap";

  beforeEach(() => {
    getMock.mockReset();
  });
  afterEach(() => {
    root().removeProperty("--font-brand");
    root().removeProperty("--font-brand-heading");
    fontLinks().forEach((link) => link.remove());
  });

  it("define --font-brand e --font-brand-heading (heading vazio usa fontFamily)", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "Inter" } });
    renderHead();

    await waitFor(() => expect(root().getPropertyValue("--font-brand")).toBe("Inter, system-ui, sans-serif"));
    expect(root().getPropertyValue("--font-brand-heading")).toBe("Inter, system-ui, sans-serif");
  });

  it("usa fontHeadingFamily nos títulos", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "Inter", fontHeadingFamily: "Lora" } });
    renderHead();

    await waitFor(() => expect(root().getPropertyValue("--font-brand-heading")).toBe("Lora, system-ui, sans-serif"));
  });

  it("só fontHeadingFamily: define apenas --font-brand-heading", async () => {
    getMock.mockResolvedValue({ data: { fontHeadingFamily: "Lora" } });
    renderHead();

    await waitFor(() => expect(root().getPropertyValue("--font-brand-heading")).toBe("Lora, system-ui, sans-serif"));
    expect(root().getPropertyValue("--font-brand")).toBe("");
  });

  it("ambas vazias: não define nenhuma variável de fonte", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "", fontHeadingFamily: "" } });
    renderHead();

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(root().getPropertyValue("--font-brand")).toBe("");
    expect(root().getPropertyValue("--font-brand-heading")).toBe("");
  });

  it("injeta um único link da fonte, sem duplicar ao rerenderizar", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "Inter", fontUrl: FONT_URL } });
    const view = renderHead();

    await waitFor(() => expect(fontLinks()).toHaveLength(1));
    expect(fontLinks()[0].getAttribute("href")).toBe(FONT_URL);
    view.rerender(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient()}>
          <BrandingHead />
        </QueryClientProvider>
      </HelmetProvider>
    );
    expect(fontLinks()).toHaveLength(1);
  });

  it("remove o link e as variáveis ao desmontar", async () => {
    getMock.mockResolvedValue({ data: { fontFamily: "Inter", fontUrl: FONT_URL } });
    const { unmount } = renderHead();
    await waitFor(() => expect(fontLinks()).toHaveLength(1));

    unmount();

    expect(fontLinks()).toHaveLength(0);
    expect(root().getPropertyValue("--font-brand")).toBe("");
  });

  it("sem fontUrl não injeta link; sem fontFamily não define variáveis", async () => {
    getMock.mockResolvedValue({ data: { name: "X" } });
    renderHead();

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(fontLinks()).toHaveLength(0);
    expect(root().getPropertyValue("--font-brand")).toBe("");
    expect(root().getPropertyValue("--font-brand-heading")).toBe("");
  });
});
