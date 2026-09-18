import * as XLSX from "xlsx";

/**
 * Uma coluna do arquivo exportado: o título que aparece no cabeçalho e como extrair
 * o valor de cada linha.
 */
export interface ColunaExport<T> {
  titulo: string;
  valor: (linha: T) => string | number | null | undefined;
}

export type FormatoExport = "csv" | "xlsx";

const SEPARADOR = ";";
const BOM = "﻿";

/**
 * Monta o conteúdo CSV.
 *
 * Separador `;` porque é o que o Excel em pt-BR entende como delimitador de coluna — com
 * vírgula ele joga a linha inteira numa célula só. Toda célula sai entre aspas para que
 * separador, quebra de linha e acento dentro do texto não quebrem o arquivo.
 *
 * O BOM não entra aqui: é marca do arquivo entregue, adicionada em {@link exportTable}.
 */
export function montarCsv<T>(linhas: readonly T[], colunas: readonly ColunaExport<T>[]): string {
  const cabecalho = colunas.map((coluna) => aspas(coluna.titulo)).join(SEPARADOR);

  const registros = linhas.map((linha) =>
    colunas.map((coluna) => aspas(coluna.valor(linha))).join(SEPARADOR)
  );

  return [cabecalho, ...registros].join("\n");
}

/**
 * Gera e dispara o download do arquivo. Devolve o nome usado, para quem quiser exibir
 * confirmação ao usuário.
 *
 * @throws quando não há nenhuma linha — baixar um arquivo só com cabeçalho parece bug
 *         para quem clicou e esconde o fato de que o filtro não trouxe nada.
 */
export function exportTable<T>(
  linhas: readonly T[],
  colunas: readonly ColunaExport<T>[],
  nomeBase: string,
  formato: FormatoExport
): string {
  if (linhas.length === 0) {
    throw new Error("Não há nenhuma linha para exportar com os filtros atuais.");
  }

  const nomeArquivo = `${nomeBase}-${new Date().toISOString().slice(0, 10)}.${formato}`;

  if (formato === "xlsx") {
    exportarXlsx(linhas, colunas, nomeArquivo);
    return nomeArquivo;
  }

  baixarBlob(new Blob([BOM + montarCsv(linhas, colunas)], { type: "text/csv;charset=utf-8;" }), nomeArquivo);
  return nomeArquivo;
}

function exportarXlsx<T>(
  linhas: readonly T[],
  colunas: readonly ColunaExport<T>[],
  nomeArquivo: string
): void {
  // O SheetJS usa as chaves do objeto como cabeçalho, então a chave é o próprio título.
  const registros = linhas.map((linha) => {
    const registro: Record<string, string | number> = {};
    colunas.forEach((coluna) => {
      registro[coluna.titulo] = normalizar(coluna.valor(linha));
    });
    return registro;
  });

  const planilha = XLSX.utils.json_to_sheet(registros);
  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, planilha, "Dados");
  XLSX.writeFile(pasta, nomeArquivo);
}

function baixarBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.click();
  } finally {
    // Sem revoke, cada exportação deixa um blob preso em memória até a aba recarregar.
    URL.revokeObjectURL(url);
  }
}

function normalizar(valor: string | number | null | undefined): string | number {
  if (valor === null || valor === undefined) return "";
  return valor;
}

function aspas(valor: string | number | null | undefined): string {
  return `"${String(normalizar(valor)).replace(/"/g, '""')}"`;
}
