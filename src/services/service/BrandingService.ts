import { instanceApi } from "./AxioService";
import { FALLBACK_BRANDING, resolveBranding, type Branding } from "../../config/branding";

export const BrandingService = {
  /** `GET /api/Branding` (anônimo). Erros de rede propagam; o hook decide usar o fallback. */
  async get(): Promise<Branding> {
    const response = await instanceApi.get("/Branding");
    return resolveBranding(response.data, FALLBACK_BRANDING);
  },
};
