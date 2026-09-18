import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InsightsService from "../services/service/InsightsService";
import type {
  InsightAcompanhamentoRequest,
  InsightChave,
  InsightFiltro,
} from "../services/model/insights.types";

/** Prefixo comum: permite invalidar todos os insights de uma vez após um acompanhamento. */
const RAIZ = "insight";

export function useInsightContador(chave: InsightChave, filtro?: InsightFiltro) {
  return useQuery({
    queryKey: [RAIZ, "contador", chave, filtro],
    queryFn: () => InsightsService.contador(chave, filtro),
    // O backend já cacheia por 5 min; repetir o intervalo aqui evita ida à rede a cada
    // montagem da faixa, sem deixar o número velho por mais tempo do que o servidor deixaria.
    staleTime: 5 * 60 * 1000,
  });
}

export function useInsightItens(
  chave: InsightChave | undefined,
  filtro: InsightFiltro | undefined,
  pagina: number,
  tamanhoPagina: number
) {
  return useQuery({
    queryKey: [RAIZ, "itens", chave, filtro, pagina, tamanhoPagina],
    queryFn: () => InsightsService.itens(chave!, filtro, pagina, tamanhoPagina),
    enabled: Boolean(chave),
    keepPreviousData: true,
  });
}

/**
 * Registra o tratamento de um item e invalida tudo de insight.
 *
 * A invalidação é ampla de propósito: o item sai da lista e o contador da faixa precisa
 * cair junto, senão o card continua mostrando o número antigo e o time liga de novo para
 * quem já foi atendido.
 */
export function useRegistrarAcompanhamento(chave: InsightChave) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requisicao: InsightAcompanhamentoRequest) =>
      InsightsService.registrarAcompanhamento(chave, requisicao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAIZ] });
    },
  });
}
