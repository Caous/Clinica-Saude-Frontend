import { useQuery } from "@tanstack/react-query";
import { FALLBACK_BRANDING, type Branding } from "../config/branding";
import { BrandingService } from "../services/service/BrandingService";

const BRANDING_STALE_TIME_MS = 1000 * 60 * 60;

/**
 * Branding da aplicação. Nunca bloqueia a renderização nem lança:
 * enquanto carrega ou se a API falhar, devolve o fallback neutro.
 */
export function useBranding(): Branding {
  const { data } = useQuery({
    queryKey: ["branding"],
    queryFn: BrandingService.get,
    staleTime: BRANDING_STALE_TIME_MS,
    cacheTime: BRANDING_STALE_TIME_MS,
    retry: 1,
  });

  return data ?? FALLBACK_BRANDING;
}
