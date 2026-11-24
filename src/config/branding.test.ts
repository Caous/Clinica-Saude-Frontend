import { describe, it, expect } from "vitest";
import { FALLBACK_BRANDING, resolveBranding, deriveBrandShades, type Branding } from "./branding";

describe("resolveBranding (UT-9)", () => {
  it("campos faltantes vêm do fallback", () => {
    const resolved = resolveBranding({ name: "Acme Saúde", primaryColor: "#ff0000" }, FALLBACK_BRANDING);

    expect(resolved.name).toBe("Acme Saúde");
    expect(resolved.primaryColor).toBe("#ff0000");
    expect(resolved.shortName).toBe(FALLBACK_BRANDING.shortName);
    expect(resolved.logoLightUrl).toBe(FALLBACK_BRANDING.logoLightUrl);
    expect(resolved.supportEmail).toBe(FALLBACK_BRANDING.supportEmail);
  });

  it("resposta completa substitui todos os campos", () => {
    const full: Branding = {
      name: "Acme Saúde",
      shortName: "Acme",
      logoLightUrl: "/a.svg",
      logoDarkUrl: "/b.svg",
      faviconUrl: "/f.png",
      primaryColor: "#111111",
      secondaryColor: "#222222",
      supportEmail: "ajuda@acme.example",
    };
    expect(resolveBranding(full, FALLBACK_BRANDING)).toEqual(full);
  });

  it.each([null, undefined, "texto", 42, []])("entrada inválida (%s) resulta no fallback", (input) => {
    expect(resolveBranding(input, FALLBACK_BRANDING)).toEqual(FALLBACK_BRANDING);
  });

  it("ignora campos vazios, em branco ou de tipo errado", () => {
    const resolved = resolveBranding({ name: "   ", shortName: "", supportEmail: 7 }, FALLBACK_BRANDING);
    expect(resolved).toEqual(FALLBACK_BRANDING);
  });

  it("não muta o fallback", () => {
    const snapshot = { ...FALLBACK_BRANDING };
    resolveBranding({ name: "X" }, FALLBACK_BRANDING);
    expect(FALLBACK_BRANDING).toEqual(snapshot);
  });

  it("fallback neutro tem a identidade definida no PBI", () => {
    expect(FALLBACK_BRANDING).toEqual({
      name: "Sistema Clínica",
      shortName: "Clínica",
      logoLightUrl: "/images/logo/logo.svg",
      logoDarkUrl: "/images/logo/logo-dark.svg",
      faviconUrl: "/favicon.ico",
      primaryColor: "#465fff",
      secondaryColor: "#101828",
      supportEmail: "suporte@example.com",
    });
  });
});

describe("resolveBranding: validação de campos (alinhada ao backend/Extranet)", () => {
  const URL_FIELDS = ["logoLightUrl", "logoDarkUrl", "faviconUrl"] as const;
  const INVALID_URLS = [
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "http://example.com/logo.svg",
    "//evil.example/logo.svg",
    "images/logo.svg",
    "/images\\logo.svg",
    "/ logo.svg",
    '/a"b.svg',
    "/a'b.svg",
    "/a<b.svg",
    "/a>b.svg",
    'https://x.example/a"b.svg',
  ];
  const VALID_URLS = ["/images/logo/x.svg", "/favicon.ico", "https://cdn.example.com/logo.svg"];

  it.each(URL_FIELDS)("%s: rejeita URLs perigosas ou malformadas e usa o fallback", (field) => {
    for (const bad of INVALID_URLS) {
      expect(resolveBranding({ [field]: bad }, FALLBACK_BRANDING)[field]).toBe(FALLBACK_BRANDING[field]);
    }
  });

  it.each(URL_FIELDS)("%s: aceita caminho relativo e https", (field) => {
    for (const good of VALID_URLS) {
      expect(resolveBranding({ [field]: good }, FALLBACK_BRANDING)[field]).toBe(good);
    }
  });

  it.each(["primaryColor", "secondaryColor"] as const)("%s: valida hexadecimal", (field) => {
    for (const bad of ["red", "#12", "#12345", "#1234567", "#123456789", "#gggggg", "123456", "rgb(0,0,0)", "#fff; x"]) {
      expect(resolveBranding({ [field]: bad }, FALLBACK_BRANDING)[field]).toBe(FALLBACK_BRANDING[field]);
    }
    for (const good of ["#fff", "#fffa", "#FFAA00", "#11223344"]) {
      expect(resolveBranding({ [field]: good }, FALLBACK_BRANDING)[field]).toBe(good);
    }
  });

  it("supportEmail: exige formato a@b.c", () => {
    for (const bad of ["semarroba", "a@b", "a @b.c", "@b.c", "a@.c", 'a"@b.c', "a@b'.c", "a<@b.c", "a@b>.c"]) {
      expect(resolveBranding({ supportEmail: bad }, FALLBACK_BRANDING).supportEmail).toBe(
        FALLBACK_BRANDING.supportEmail
      );
    }
    for (const good of ["a@b.co", "a@b..c"]) {
      expect(resolveBranding({ supportEmail: good }, FALLBACK_BRANDING).supportEmail).toBe(good);
    }
  });

  it("campo inválido não afeta os campos válidos nem lança", () => {
    const resolved = resolveBranding({ name: "Acme", logoLightUrl: "javascript:x", primaryColor: "#abc" }, FALLBACK_BRANDING);
    expect(resolved.name).toBe("Acme");
    expect(resolved.primaryColor).toBe("#abc");
    expect(resolved.logoLightUrl).toBe(FALLBACK_BRANDING.logoLightUrl);
  });
});

describe("deriveBrandShades", () => {
  it("usa a cor primária como tom 500 e gera os demais tons", () => {
    const shades = deriveBrandShades("#465fff");
    expect(shades?.["500"]).toBe("#465fff");
    expect(Object.keys(shades ?? {})).toEqual(
      expect.arrayContaining(["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"])
    );
    expect(shades?.["50"]).not.toBe(shades?.["900"]);
  });

  it("aceita #rgb e ignora o canal alfa", () => {
    expect(deriveBrandShades("#f00")?.["500"]).toBe("#ff0000");
    expect(deriveBrandShades("#ff000080")?.["500"]).toBe("#ff0000");
  });

  it("retorna null para tamanhos não suportados (5 ou 7 dígitos)", () => {
    expect(deriveBrandShades("#12345")).toBeNull();
    expect(deriveBrandShades("#1234567")).toBeNull();
  });
});
