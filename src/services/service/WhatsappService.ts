import { WhatsappConversationResponseDto } from "../model/Dto/Response/WhatsappConversationResponseDto";
import { WhatsappMessageResponseDto } from "../model/Dto/Response/WhatsappMessageResponseDto";
import { instanceApi } from "./AxioService";

// GET - Todas as conversas (opcionalmente filtradas por número WhatsApp).
// Retorna 204 (sem corpo) quando não há conversas → normaliza para [].
export const getConversasAsync = async (
  whatsappNumberId?: string
): Promise<WhatsappConversationResponseDto[]> => {
  const response = await instanceApi.get<WhatsappConversationResponseDto[] | null>(
    `/Whatsapp/GetConversas`,
    { params: whatsappNumberId ? { whatsappNumberId } : undefined }
  );
  return response.data || [];
};

// GET - Mensagens de uma conversa, em ordem cronológica.
export const getMensagensAsync = async (
  conversaId: string
): Promise<WhatsappMessageResponseDto[]> => {
  const response = await instanceApi.get<WhatsappMessageResponseDto[] | null>(
    `/Whatsapp/GetMensagens/${conversaId}`
  );
  return response.data || [];
};

// PATCH - Marca a conversa como lida (zera MensagensNaoLidas).
export const marcarComoLidaAsync = async (
  conversaId: string
): Promise<{ status: number }> => {
  const response = await instanceApi.patch(`/Whatsapp/MarcarComoLida/${conversaId}`);
  return { status: response.status };
};
