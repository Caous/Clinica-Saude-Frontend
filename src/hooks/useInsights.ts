import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import InsightsService from "../services/service/InsightsService";
import type {
  InsightAcompanhamentoRequest,
  InsightChave,
  InsightContadorResponse,
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

/**
 * Quantas chaves cabem em cada requisicao.
 *
 * Numero espremido entre dois limites opostos. Para baixo: o endpoint tem particao de rate
 * limit de 30 req/30s, entao uma requisicao por card (33) derruba a faixa em 429 no primeiro
 * F5. Para cima: uma requisicao unica com as 33 chaves so pinta a tela quando a ultima
 * contagem volta, e a faixa inteira fica em esqueleto esperando a mais lenta.
 *
 * Com 6, a faixa da tela de Pacientes custa 6 requisicoes -- folga confortavel ate o teto,
 * mesmo com recarregamentos seguidos -- e os cards aparecem em blocos conforme chegam. O
 * primeiro bloco e exatamente o dos insights de venda, que e o que o time olha primeiro.
 */
const CHAVES_POR_LOTE = 6;

function dividirEmLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];

  for (let inicio = 0; inicio < itens.length; inicio += tamanho)
    lotes.push(itens.slice(inicio, inicio + tamanho));

  return lotes;
}

/** Como cada card deve se apresentar enquanto o lote dele nao voltou. */
export interface EstadoDoContador {
  carregando: boolean;
  erro: boolean;
}

export interface ContadoresDaFaixa {
  contadores: Map<InsightChave, InsightContadorResponse>;
  estados: Map<InsightChave, EstadoDoContador>;
}

/**
 * Contadores da faixa, carregados em blocos e renderizados conforme chegam.
 *
 * Cada lote e uma query propria, entao o bloco que responde primeiro pinta primeiro: a tela
 * nao espera o conjunto inteiro para sair do esqueleto. Erro tambem fica contido no lote --
 * um bloco que falha nao apaga os numeros dos outros.
 */
export function useInsightContadores(
  chaves: InsightChave[],
  filtro?: InsightFiltro
): ContadoresDaFaixa {
  const assinatura = chaves.join(",");

  const lotes = useMemo(
    () => dividirEmLotes(chaves, CHAVES_POR_LOTE),
    // A assinatura substitui o array: `chaves` costuma ser recriado a cada render e
    // compara-lo por referencia refaria os lotes -- e as queries -- sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assinatura]
  );

  const resultados = useQueries({
    queries: lotes.map((lote) => ({
      queryKey: [RAIZ, "contadores", lote, filtro],
      queryFn: () => InsightsService.contadores(lote, filtro),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const contadores = new Map<InsightChave, InsightContadorResponse>();
    const estados = new Map<InsightChave, EstadoDoContador>();

    lotes.forEach((lote, indice) => {
      const resultado = resultados[indice];

      lote.forEach((chave) =>
        estados.set(chave, {
          carregando: resultado?.isLoading ?? true,
          erro: resultado?.isError ?? false,
        })
      );

      (resultado?.data ?? []).forEach((contador) =>
        contadores.set(contador.chave, contador)
      );
    });

    return { contadores, estados };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, resultados.map((resultado) => resultado.status).join("|")]);
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
