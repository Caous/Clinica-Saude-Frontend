import type { Branding } from "./branding";

/** Fonte atual do front quando a marca não configura uma (mesma de `--font-outfit` em index.css). */
const DEFAULT_BRAND_FONT = "Outfit, sans-serif";

/** Pilha de fallback anexada à fonte da marca (única fonte da verdade para CSS e bibliotecas JS). */
export const SYSTEM_FONT_FALLBACK = "system-ui, sans-serif";

/**
 * Fonte para bibliotecas que não leem variáveis CSS (ApexCharts, templates de tooltip). Função pura.
 * Sem `fontFamily` configurada devolve a fonte padrão; senão, a da marca com fallback de sistema
 * (mesma pilha de `--font-brand` em BrandingHead).
 */
export function getBrandFont(brand: Pick<Branding, "fontFamily">): string {
  return brand.fontFamily === "" ? DEFAULT_BRAND_FONT : `${brand.fontFamily}, ${SYSTEM_FONT_FALLBACK}`;
}
