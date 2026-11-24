
import axios from "axios";
import toast from "react-hot-toast";
import { resolveApiBaseUrl } from "./apiBaseUrl";

export const instanceApi = axios.create({
  baseURL: resolveApiBaseUrl({
    isProduction: import.meta.env.PROD,
    configuredUrl: import.meta.env.VITE_API_BASE_URL,
  }),
  timeout: 30000, // 30 segundos
});

instanceApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // ou onde você armazenou o token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratar erro 429
instanceApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // /Branding é anônimo e best-effort (há fallback): falhas dele não geram toast.
    const isBrandingRequest = String(error.config?.url ?? "").includes("/Branding");
    if (error.response?.status === 429 && !isBrandingRequest) {
      toast.error("Muitas tentativas de solicitação ao servidor, por favor tente daqui 1 minuto novamente", {
        duration: 5000,
        position: "top-center",
      });
    }
    return Promise.reject(error);
  }
);