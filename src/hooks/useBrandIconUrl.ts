import { resolveBrandIconUrl } from "../config/branding";
import { useTheme } from "../context/ThemeContext";
import { useBranding } from "./useBranding";

/** URL do ícone da marca para o tema ativo (escuro cai em `logoIconUrl` se não houver ícone escuro). */
export function useBrandIconUrl(): string {
  const brand = useBranding();
  const { theme } = useTheme();
  return resolveBrandIconUrl(brand, theme);
}
