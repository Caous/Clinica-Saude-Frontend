export interface WhatsappMessageResponseDto {
  id: string;
  whatsappConversationId: string;
  messageId: string;
  conteudo: string;
  tipoMidia?: string | null;
  urlMidia?: string | null;
  enviadaPelaClinica: boolean;
  statusMensagem: number;
  dataMensagem: string;
}
