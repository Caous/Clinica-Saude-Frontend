import { instanceApi } from "./AxioService";
import type {
  InsightAcompanhamento,
  InsightAcompanhamentoRequest,
  InsightChave,
  InsightContadorResponse,
  InsightFiltro,
  InsightPagina,
} from "../model/insights.types";

const BASE = "/Insights";

/** Página vazia, para o consumidor não precisar tratar `null` do 204. */
function paginaVazia(chave: InsightChave, pagina: number, tamanhoPagina: number): InsightPagina {
  return { chave, total: 0, pagina, tamanhoPagina, itens: [] };
}

function querystring(filtro?: InsightFiltro, extras?: Record<string, string | number>): string {
  const params = new URLSearchParams();

  if (filtro?.filialId) params.append("filialId", filtro.filialId);
  if (filtro?.dias !== undefined) params.append("dias", String(filtro.dias));
  if (filtro?.incluirTratados) params.append("incluirTratados", "true");

  Object.entries(extras ?? {}).forEach(([chave, valor]) => params.append(chave, String(valor)));

  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

/**
 * Insights de venda.
 *
 * Contador e listagem são endpoints separados de propósito: a faixa da tela paga apenas o
 * COUNT, e só quem abre o grid paga a listagem.
 */
class InsightsService {
  async contador(chave: InsightChave, filtro?: InsightFiltro): Promise<InsightContadorResponse> {
    const { data } = await instanceApi.get<InsightContadorResponse>(
      `${BASE}/${chave}/contador${querystring(filtro)}`
    );
    return data;
  }

  /**
   * Contadores de várias chaves numa chamada só.
   *
   * A faixa da tela de Pacientes exibe dezenas de cards. Um GET por card esgotava a partição
   * de rate limit do controller (30 req/30s) já no primeiro recarregamento da tela.
   */
  async contadores(
    chaves: InsightChave[],
    filtro?: InsightFiltro
  ): Promise<InsightContadorResponse[]> {
    if (chaves.length === 0) return [];

    const { data } = await instanceApi.get<InsightContadorResponse[]>(
      `${BASE}/contadores${querystring(filtro, { chaves: chaves.join(",") })}`
    );

    return data ?? [];
  }

  async itens(
    chave: InsightChave,
    filtro: InsightFiltro | undefined,
    pagina: number,
    tamanhoPagina: number
  ): Promise<InsightPagina> {
    const resposta = await instanceApi.get<InsightPagina>(
      `${BASE}/${chave}/itens${querystring(filtro, { pagina, tamanhoPagina })}`
    );

    // A API responde 204 quando não há item; o axios entrega `data` vazio nesse caso.
    return resposta.status === 204 || !resposta.data
      ? paginaVazia(chave, pagina, tamanhoPagina)
      : resposta.data;
  }

  /** Conjunto completo para exportar. Erro 400 acima do teto traz a orientação no corpo. */
  async exportacao(chave: InsightChave, filtro?: InsightFiltro): Promise<InsightPagina> {
    const resposta = await instanceApi.get<InsightPagina>(
      `${BASE}/${chave}/exportacao${querystring(filtro)}`
    );

    return resposta.status === 204 || !resposta.data ? paginaVazia(chave, 1, 0) : resposta.data;
  }

  async registrarAcompanhamento(
    chave: InsightChave,
    requisicao: InsightAcompanhamentoRequest
  ): Promise<InsightAcompanhamento> {
    const { data } = await instanceApi.post<InsightAcompanhamento>(
      `${BASE}/${chave}/acompanhamento`,
      requisicao
    );
    return data;
  }

  async historico(chave: InsightChave, referenciaId: string): Promise<InsightAcompanhamento[]> {
    const resposta = await instanceApi.get<InsightAcompanhamento[]>(
      `${BASE}/${chave}/acompanhamento/${referenciaId}`
    );

    return resposta.status === 204 || !resposta.data ? [] : resposta.data;
  }
}

export default new InsightsService();
