import { describe, it, expect } from "vitest";
import {
  FALLBACK_BRANDING,
  resolveBranding,
  deriveBrandShades,
  contrastWithWhite,
  resolveBrandIconUrl,
  type Branding,
} from "./branding";

describe("resolveBranding (UT-9)", () => {
  it("campos faltantes vêm do fallback", () => {
    const resolved = resolveBranding({ name: "Acme Saúde", primaryColor: "#cc0000" }, FALLBACK_BRANDING);

    expect(resolved.name).toBe("Acme Saúde");
    expect(resolved.primaryColor).toBe("#cc0000");
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
      logoIconUrl: "/i.svg",
      logoIconDarkUrl: "/i-dark.svg",
      faviconUrl: "/f.png",
      primaryColor: "#111111",
      secondaryColor: "#222222",
      supportEmail: "ajuda@acme.example",
      phone: "(11) 4000-0000",
      address: "Rua Exemplo, 100",
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
      logoIconUrl: "/images/logo/logo-icon.svg",
      logoIconDarkUrl: "",
      faviconUrl: "/favicon.ico",
      primaryColor: "#465fff",
      secondaryColor: "#101828",
      supportEmail: "suporte@example.com",
      phone: "",
      address: "",
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
    for (const good of ["#000", "#000a", "#112233", "#11223344"]) {
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
    const resolved = resolveBranding({ name: "Acme", logoLightUrl: "javascript:x", primaryColor: "#333" }, FALLBACK_BRANDING);
    expect(resolved.name).toBe("Acme");
    expect(resolved.primaryColor).toBe("#333");
    expect(resolved.logoLightUrl).toBe(FALLBACK_BRANDING.logoLightUrl);
  });
});

describe("resolveBranding: ícone, telefone e endereço (UT-2, UT-9)", () => {
  it.each(["logoIconUrl", "logoIconDarkUrl"] as const)("%s: mesmas 4 entradas do backend (paridade)", (field) => {
    const resolve = (value: unknown) => resolveBranding({ [field]: value }, FALLBACK_BRANDING)[field];
    expect(resolve("/icon.svg")).toBe("/icon.svg");
    expect(resolve(null)).toBe(FALLBACK_BRANDING[field]);
    expect(resolve("javascript:x")).toBe(FALLBACK_BRANDING[field]);
    expect(resolve("//host/x")).toBe(FALLBACK_BRANDING[field]);
    expect(resolve("https://cdn.example.com/i.svg")).toBe("https://cdn.example.com/i.svg");
  });

  it("fallback: ícone claro padrão e escuro vazio", () => {
    expect(FALLBACK_BRANDING.logoIconUrl).toBe("/images/logo/logo-icon.svg");
    expect(FALLBACK_BRANDING.logoIconDarkUrl).toBe("");
    expect(FALLBACK_BRANDING.phone).toBe("");
    expect(FALLBACK_BRANDING.address).toBe("");
  });

  it.each(["phone", "address"] as const)("%s: aceita texto, aplica trim e limite de 200", (field) => {
    expect(resolveBranding({ [field]: "  (11) 4000-0000  " }, FALLBACK_BRANDING)[field]).toBe("(11) 4000-0000");
    expect(resolveBranding({ [field]: "x".repeat(200) }, FALLBACK_BRANDING)[field]).toBe("x".repeat(200));
  });

  it.each(["phone", "address"] as const)("%s: <, > ou mais de 200 caracteres viram vazio", (field) => {
    for (const bad of ["<script>alert(1)</script>", "a>b", "x".repeat(201)]) {
      expect(resolveBranding({ [field]: bad }, FALLBACK_BRANDING)[field]).toBe("");
    }
  });
});

describe("contrastWithWhite e rejeição da primária (UT-4)", () => {
  it("calcula a razão WCAG com branco", () => {
    expect(contrastWithWhite("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 5);
    expect(contrastWithWhite("#465fff")).toBeCloseTo(4.84, 2);
    expect(contrastWithWhite("#ffff00")).toBeCloseTo(1.07, 2);
  });

  it("aceita #rgb e ignora alfa; retorna null para hex inválido", () => {
    expect(contrastWithWhite("#000")).toBeCloseTo(21, 5);
    expect(contrastWithWhite("#000000ff")).toBeCloseTo(21, 5);
    expect(contrastWithWhite("#12345")).toBeNull();
    expect(contrastWithWhite("red")).toBeNull();
  });

  it("primária #ffff00 é rejeitada e volta a #465fff", () => {
    expect(resolveBranding({ primaryColor: "#ffff00" }, FALLBACK_BRANDING).primaryColor).toBe("#465fff");
  });

  it("primária #465fff é aceita", () => {
    expect(resolveBranding({ primaryColor: "#465fff" }, FALLBACK_BRANDING).primaryColor).toBe("#465fff");
  });

  it("fronteira de contraste: #767676 (4,54:1) aceita e #777777 (4,48:1) rejeitada", () => {
    expect(resolveBranding({ primaryColor: "#767676" }, FALLBACK_BRANDING).primaryColor).toBe("#767676");
    expect(resolveBranding({ primaryColor: "#777777" }, FALLBACK_BRANDING).primaryColor).toBe("#465fff");
  });

  it("secundária clara não tem exigência de contraste", () => {
    expect(resolveBranding({ secondaryColor: "#ffff00" }, FALLBACK_BRANDING).secondaryColor).toBe("#ffff00");
  });
});

describe("resolveBrandIconUrl (UT-3)", () => {
  const base = { ...FALLBACK_BRANDING, logoIconUrl: "/claro.svg" };

  it("tema escuro com logoIconDarkUrl vazio usa logoIconUrl", () => {
    expect(resolveBrandIconUrl({ ...base, logoIconDarkUrl: "" }, "dark")).toBe("/claro.svg");
  });

  it("tema escuro com logoIconDarkUrl usa o escuro", () => {
    expect(resolveBrandIconUrl({ ...base, logoIconDarkUrl: "/escuro.svg" }, "dark")).toBe("/escuro.svg");
  });

  it("tema claro sempre usa logoIconUrl", () => {
    expect(resolveBrandIconUrl({ ...base, logoIconDarkUrl: "/escuro.svg" }, "light")).toBe("/claro.svg");
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
