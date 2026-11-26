import { getBrandFont } from "../config/brandFont";
import { useBranding } from "./useBranding";

/** Fonte da marca configurada; re-renderiza quando o branding carrega. */
export function useBrandFont(): string {
  return getBrandFont(useBranding());
}
