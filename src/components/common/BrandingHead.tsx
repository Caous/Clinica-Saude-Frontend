import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { FALLBACK_BRANDING, BRAND_SHADE_KEYS, deriveBrandShades } from "../../config/branding";
import { useBranding } from "../../hooks/useBranding";

const SHADE_VARIABLES = BRAND_SHADE_KEYS.map((shade) => `--color-brand-${shade}`);
const SECONDARY_VARIABLE = "--color-brand-secondary";

/**
 * Aplica o branding ao <head>: favicon, título da aba (padrão "Página - Marca") e cores do tema.
 * As cores sobrescrevem em runtime as variáveis CSS do Tailwind (`--color-brand-*`); sem cores
 * customizadas válidas (iguais ao fallback ou inválidas) o tema estático de index.css é mantido.
 * Variáveis de gray não são tocadas, preservando o modo escuro.
 * Deve ficar dentro de `AppWrapper` (HelmetProvider) e `QueryClientProvider`.
 */
export default function BrandingHead() {
  const brand = useBranding();
  const { primaryColor, secondaryColor } = brand;
  const brandShades = useMemo(
    () => (primaryColor.toLowerCase() === FALLBACK_BRANDING.primaryColor ? null : deriveBrandShades(primaryColor)),
    [primaryColor]
  );

  // Side effect isolado: escreve variáveis CSS no <html> e as remove ao desmontar/trocar a cor.
  useEffect(() => {
    const style = document.documentElement.style;

    if (brandShades) {
      BRAND_SHADE_KEYS.forEach((shade) => style.setProperty(`--color-brand-${shade}`, brandShades[shade]));
    }
    if (secondaryColor.toLowerCase() !== FALLBACK_BRANDING.secondaryColor) {
      style.setProperty(SECONDARY_VARIABLE, secondaryColor);
    }

    return () => {
      SHADE_VARIABLES.forEach((variable) => style.removeProperty(variable));
      style.removeProperty(SECONDARY_VARIABLE);
    };
  }, [brandShades, secondaryColor]);

  // Favicon: reaproveita o <link rel="icon"> estático do index.html (fallback) em vez de
  // duplicá-lo; Helmet não remove tags que ele não criou.
  const { faviconUrl } = brand;
  useEffect(() => {
    let iconLink = document.head.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    iconLink.href = faviconUrl;
  }, [faviconUrl]);

  return (
    <Helmet defaultTitle={brand.name} titleTemplate={`%s - ${brand.name}`}>
      {brandShades && <meta name="theme-color" content={primaryColor} />}
    </Helmet>
  );
}
