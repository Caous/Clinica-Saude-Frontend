import { removerAcentos } from "./textNormalize";

/**
 * O que qualquer registro dos grids tem em comum: exclusão lógica.
 */
export interface RegistroDesativavel {
  dataDesativacao?: string | null;
}

/** Registro excluído logicamente. */
export function estaDesativado(registro: RegistroDesativavel): boolean {
  return registro.dataDesativacao !== null && registro.dataDesativacao !== undefined;
}

/**
 * Compara nomes como uma pessoa esperaria ver a lista.
 *
 * Acento e caixa saem da comparação: com `localeCompare` cru, "Ângela" e "Angela" caem em
 * pontos diferentes da lista e quem procura acha que o cadastro sumiu. Nome vazio vai para o
 * fim, não para o começo — linha sem nome no topo parece defeito de carregamento.
 */
export function compararPorNome(nomeA?: string | null, nomeB?: string | null): number {
  const a = removerAcentos((nomeA ?? "").trim());
  const b = removerAcentos((nomeB ?? "").trim());

  if (a === b) return 0;
  if (a === "") return 1;
  if (b === "") return -1;

  return a.localeCompare(b, "pt-BR");
}

/**
 * Ordena a lista por nome e empurra os desativados para o fim.
 *
 * A separação por desativação vem antes de qualquer outro critério: registro excluído
 * continua acessível para consulta e restauração, mas não pode disputar as primeiras linhas
 * com quem está ativo — é ruído no trabalho do dia a dia.
 *
 * @param registros lista original; não é modificada.
 * @param nomeDe    de onde sai o nome, já que cada entidade chama o campo do seu jeito.
 * @param desempate ordenação a aplicar dentro de cada grupo; por padrão, o nome.
 */
export function ordenarPorNomeComDesativadosNoFim<T extends RegistroDesativavel>(
  registros: readonly T[] | null | undefined,
  nomeDe: (registro: T) => string | null | undefined,
  desempate?: (a: T, b: T) => number
): T[] {
  if (!Array.isArray(registros)) return [];

  return [...registros].sort((a, b) => {
    const desativacao = Number(estaDesativado(a)) - Number(estaDesativado(b));
    if (desativacao !== 0) return desativacao;

    const criterio = desempate ? desempate(a, b) : 0;
    if (criterio !== 0) return criterio;

    return compararPorNome(nomeDe(a), nomeDe(b));
  });
}
