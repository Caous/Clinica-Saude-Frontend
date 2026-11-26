/**
 * Identidade visual/textual da aplicação.
 * Contrato espelha `GET /api/Branding`; o fallback neutro garante que a tela
 * nunca fique sem nome/logo, mesmo com a API indisponível.
 */
export interface Branding {
  name: string;
  shortName: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  /** Ícone quadrado (avatar, sidebar recolhida). */
  logoIconUrl: string;
  /** Ícone do tema escuro; vazio = usar `logoIconUrl`. */
  logoIconDarkUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  /** Telefone exibido no rodapé de e-mail; vazio = omitido. */
  phone: string;
  /** Endereço exibido no rodapé de e-mail; vazio = omitido. */
  address: string;
}

export const FALLBACK_BRANDING: Readonly<Branding> = Object.freeze({
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

const BRANDING_KEYS = Object.keys(FALLBACK_BRANDING) as ReadonlyArray<keyof Branding>;

// Mesmas regras do backend e da Extranet.
const SAFE_URL = /^(?:\/(?![\/\\])[^\s\\"'<>]*|https:\/\/[^\s\\"'<>]+)$/;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const EMAIL = /^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/;

const FREE_TEXT = /^[^<>]{1,200}$/;
const MIN_PRIMARY_CONTRAST = 4.5;

const FIELD_VALIDATORS: Partial<Record<keyof Branding, RegExp>> = {
  logoLightUrl: SAFE_URL,
  logoDarkUrl: SAFE_URL,
  logoIconUrl: SAFE_URL,
  logoIconDarkUrl: SAFE_URL,
  faviconUrl: SAFE_URL,
  primaryColor: HEX_COLOR,
  secondaryColor: HEX_COLOR,
  supportEmail: EMAIL,
  phone: FREE_TEXT,
  address: FREE_TEXT,
};

/** Campos de texto livre: inválido vira vazio (não herda o fallback, que também é vazio). */
const OPTIONAL_TEXT_KEYS: ReadonlyArray<keyof Branding> = ["phone", "address"];

function parseHexChannels(hexColor: string): [number, number, number] | null {
  const digits = hexColor.replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(digits) || ![3, 4, 6, 8].includes(digits.length)) return null;
  const expanded = digits.length <= 4 ? [...digits].map((c) => c + c).join("") : digits;
  return [0, 2, 4].map((i) => parseInt(expanded.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * Razão de contraste WCAG 2.x entre a cor e o branco (1 a 21). Alfa ignorado.
 * Retorna null para hex inválido. Função pura.
 */
export function contrastWithWhite(hexColor: string): number | null {
  const channels = parseHexChannels(hexColor);
  if (!channels) return null;
  const [red, green, blue] = channels.map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return 1.05 / (luminance + 0.05);
}

/** Ícone do tema ativo: no escuro usa `logoIconDarkUrl`, com fallback para `logoIconUrl`. Função pura. */
export function resolveBrandIconUrl(brand: Pick<Branding, "logoIconUrl" | "logoIconDarkUrl">, theme: "light" | "dark"): string {
  return theme === "dark" && brand.logoIconDarkUrl !== "" ? brand.logoIconDarkUrl : brand.logoIconUrl;
}

/**
 * Converte a resposta (não confiável) da API em um `Branding` completo.
 * Campos ausentes, vazios, de tipo errado ou inválidos vêm do `fallback`. Função pura, não lança.
 */
export function resolveBranding(response: unknown, fallback: Readonly<Branding>): Branding {
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    return { ...fallback };
  }

  const source = response as Record<string, unknown>;
  const resolved = { ...fallback };

  for (const key of BRANDING_KEYS) {
    const value = source[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed === "") continue;
    const validator = FIELD_VALIDATORS[key];
    if (validator && !validator.test(trimmed)) {
      if (OPTIONAL_TEXT_KEYS.includes(key)) resolved[key] = "";
      continue;
    }
    if (key === "primaryColor" && (contrastWithWhite(trimmed) ?? 0) < MIN_PRIMARY_CONTRAST) continue;
    resolved[key] = trimmed;
  }

  return resolved;
}

export const BRAND_SHADE_KEYS = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
export type BrandShades = Record<(typeof BRAND_SHADE_KEYS)[number], string>;

// Quanto misturar de branco (tons claros) ou preto (tons escuros) sobre a cor base.
const SHADE_MIX: Record<string, { target: 0 | 255; amount: number }> = {
  "25": { target: 255, amount: 0.95 },
  "50": { target: 255, amount: 0.9 },
  "100": { target: 255, amount: 0.8 },
  "200": { target: 255, amount: 0.65 },
  "300": { target: 255, amount: 0.45 },
  "400": { target: 255, amount: 0.25 },
  "500": { target: 255, amount: 0 },
  "600": { target: 0, amount: 0.12 },
  "700": { target: 0, amount: 0.28 },
  "800": { target: 0, amount: 0.42 },
  "900": { target: 0, amount: 0.55 },
  "950": { target: 0, amount: 0.72 },
};

const toHexByte = (n: number): string => Math.round(n).toString(16).padStart(2, "0");

/**
 * Gera a escala `brand-25..950` a partir de uma cor (#rgb, #rrggbb, #rgba ou #rrggbbaa; alfa ignorado).
 * Retorna null para tamanhos não suportados. Função pura.
 */
export function deriveBrandShades(hexColor: string): BrandShades | null {
  const channels = parseHexChannels(hexColor);
  if (!channels) return null;

  const shades = {} as BrandShades;
  for (const key of BRAND_SHADE_KEYS) {
    const { target, amount } = SHADE_MIX[key];
    shades[key] = "#" + channels.map((c) => toHexByte(c + (target - c) * amount)).join("");
  }
  return shades;
}
