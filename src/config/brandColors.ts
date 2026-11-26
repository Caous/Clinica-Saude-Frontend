import { FALLBACK_BRANDING, deriveBrandShades, type Branding } from "./branding";

export interface BrandColors {
  primary: string;
  secondary: string;
}

/**
 * Cores de marca para bibliotecas que não leem variáveis CSS (ApexCharts, mapa vetorial). Função pura.
 * A secundária padrão (#101828) equivale ao fundo do tema escuro e some na 2ª série dos gráficos;
 * nesse caso a 2ª série usa o tom 300 da escala da primária. Secundária customizada é respeitada.
 */
export function getBrandColors(brand: Pick<Branding, "primaryColor" | "secondaryColor">): BrandColors {
  const isDefaultSecondary = brand.secondaryColor.toLowerCase() === FALLBACK_BRANDING.secondaryColor.toLowerCase();
  const primaryShade300 = deriveBrandShades(brand.primaryColor)?.["300"];
  const secondary = isDefaultSecondary && primaryShade300 ? primaryShade300 : brand.secondaryColor;
  return { primary: brand.primaryColor, secondary };
}
