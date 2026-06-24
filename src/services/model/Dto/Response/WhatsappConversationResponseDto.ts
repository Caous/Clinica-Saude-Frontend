export interface WhatsappConversationResponseDto {
  id: string;
  whatsappNumberId: string;
  nrTelefoneCliente: string;
  nomeContato?: string | null;
  customerId?: string | null;
  nomeCliente?: string | null;
  status: number;
  statusDescricao: string;
  tipoAtendimento: number;
  tipoAtendimentoDescricao: string;
  esteiraBot?: string | null;
  mensagensNaoLidas: number;
  ultimaAtividade: string;
  ultimaMensagemPreview?: string | null;
  dataCadastro: string;
}
