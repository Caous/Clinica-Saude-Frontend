import { getBrandColors, type BrandColors } from "../config/brandColors";
import { useBranding } from "./useBranding";

/** Cores da marca configurada; re-renderiza quando o branding carrega. */
export function useBrandColors(): BrandColors {
  return getBrandColors(useBranding());
}
