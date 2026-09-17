/**
 * Contrato dos insights de venda (`api/Insights`).
 * As chaves espelham o enum EInsightChave do backend.
 */
export type InsightChave =
  | "PlanoAcabando"
  | "PacienteDormente"
  | "AniversariantesHoje"
  | "ParcelasVencidas"
  | "PlanoZeradoSemRenovar"
  | "FaltouOntem"
  | "SessaoAmanhaNaoConfirmada"
  | "ParcelasVence7Dias"
  | "PlanoSemPagamento";

/** Urgência do insight — define a cor do card. */
export enum InsightSeveridade {
  Informativo = 1,
  Atencao = 2,
  Critico = 3,
}

/** O que o time fez com o item. */
export enum InsightSituacao {
  Contatado = 1,
  Adiado = 2,
  Descartado = 3,
}

export interface InsightFiltro {
  filialId?: string;
  dias?: number;
  incluirTratados?: boolean;
}

export interface InsightContadorResponse {
  chave: InsightChave;
  total: number;
  severidade: InsightSeveridade;
  atualizadoEm: string;
}

export interface InsightItem {
  referenciaId: string;
  clienteId?: string | null;
  clienteNome: string;
  telefone?: string | null;
  /** Unidade do paciente — para o time saber a qual unidade encaminhar. */
  filialNome?: string | null;
  valor?: number | null;
  data?: string | null;
  /** Métricas específicas do insight, já formatadas pelo backend. */
  metricas: Record<string, string>;
}

export interface InsightPagina {
  chave: InsightChave;
  total: number;
  pagina: number;
  tamanhoPagina: number;
  itens: InsightItem[];
}

export interface InsightAcompanhamentoRequest {
  referenciaId: string;
  clienteId?: string | null;
  situacao: InsightSituacao;
  /** Obrigatório para Adiado: data ISO em que o item volta para a fila. */
  snoozeAte?: string | null;
  /** Obrigatório para Adiado e Descartado. */
  motivo?: string | null;
  observacao?: string | null;
}

export interface InsightAcompanhamento {
  id: string;
  chave: InsightChave;
  referenciaId: string;
  situacao: InsightSituacao;
  snoozeAte?: string | null;
  motivo?: string | null;
  observacao?: string | null;
  registradoEm: string;
  registradoPor: string;
}
