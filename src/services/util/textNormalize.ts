/**
 * Remove diacríticos (acentos) e normaliza o texto para minúsculas.
 *
 * Ex.: "Brígida" -> "brigida", "João" -> "joao".
 *
 * Usa a decomposição Unicode NFD para separar cada caractere base do seu
 * diacrítico combinante e remove a faixa de marcas combinantes (U+0300–U+036F).
 */
export function removerAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Verifica se `texto` contém `termo` como substring, ignorando acentos e caixa.
 *
 * É a lógica compartilhada de filtragem dos selects de busca: normaliza ambos os
 * lados da comparação e faz `includes`, preservando a busca por qualquer parte
 * do texto.
 */
export function contemTextoNormalizado(texto: string, termo: string): boolean {
  return removerAcentos(texto).includes(removerAcentos(termo));
}
