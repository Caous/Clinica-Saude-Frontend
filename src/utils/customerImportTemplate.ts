import { FALLBACK_BRANDING } from "../config/branding";
// Modelo de importação de pacientes (clientes) via planilha.
//
// Fonte da verdade: parser do endpoint POST /Customer/AddCustomerFromExcel
// (backend CustomerService.cs). O parser lê os DADOS a partir da LINHA 5
// (ClosedXML é 1-based: `for (int l = 5; ...)`), usando:
//   coluna B = Nome, coluna C = Telefone, coluna D = CPF,
//   coluna E = Data de Nascimento, coluna F = E-mail.
// A coluna A é apenas um número de sequência e NÃO é importada — por isso ela
// aparece no modelo, para manter o Nome na coluna correta.
//
// Por isso o modelo reproduz esse layout: as 4 primeiras linhas
// (título, instrução, linha em branco e cabeçalho) são IGNORADAS pela
// importação, e os dados reais começam na linha 5. Assim o arquivo baixado
// já pode ser preenchido e enviado diretamente.
//
// Regras do parser refletidas aqui:
//   - Linha sem CPF válido (11 dígitos) OU sem Nome é ignorada na importação.
//   - Telefone é gravado apenas com dígitos; e-mail é opcional.

export interface CustomerImportColumn {
  /** Cabeçalho da coluna no arquivo modelo. */
  header: string;
  /** Se o campo é obrigatório para a linha ser importada. */
  obrigatorio: boolean;
  /** Valor de exemplo usado na linha de amostra. */
  exemplo: string;
  /** Explicação em linguagem clara do que preencher. */
  descricao: string;
}

export const CUSTOMER_IMPORT_COLUMNS: CustomerImportColumn[] = [
  {
    header: "Nº",
    obrigatorio: false,
    exemplo: "1",
    descricao:
      "Número de sequência da linha. É só para organização — o sistema não importa esta coluna.",
  },
  {
    header: "Nome",
    obrigatorio: true,
    exemplo: "João da Silva",
    descricao: "Nome completo do paciente. Obrigatório.",
  },
  {
    header: "Telefone",
    obrigatorio: false,
    exemplo: "11987654321",
    descricao:
      "Somente números, com DDD (ex.: 11987654321). Pontuação e espaços são removidos automaticamente.",
  },
  {
    header: "CPF",
    obrigatorio: true,
    exemplo: "12345678909",
    descricao:
      "11 dígitos, sem pontos nem traços. Obrigatório e precisa ser um CPF válido — linhas com CPF inválido são ignoradas.",
  },
  {
    header: "Data de Nascimento",
    obrigatorio: false,
    exemplo: "1990-05-15",
    descricao:
      "Data no formato AAAA-MM-DD (ou DD/MM/AAAA). Se ficar em branco ou for inválida, o sistema usa a data atual.",
  },
  {
    header: "E-mail",
    obrigatorio: false,
    exemplo: "joao.silva@email.com",
    descricao: "E-mail de contato do paciente. Opcional.",
  },
];

/** BOM UTF-8: garante que o Excel no Windows leia os acentos corretamente. */
const UTF8_BOM = "﻿";

/** Título exibido na linha 1 do modelo (ignorada pela importação). */
export const buildCustomerImportTitle = (brandName: string): string =>
  `Modelo de Importação de Pacientes — ${brandName}`;

/** Instrução exibida na linha 2 do modelo (ignorada pela importação). */
export const CUSTOMER_IMPORT_INSTRUCTION =
  "Preencha a partir da linha 5. Não remova/altere as 4 primeiras linhas — elas são ignoradas na importação.";

/**
 * Gera o conteúdo do modelo CSV de importação de pacientes replicando o
 * layout que o parser do backend espera: os DADOS começam na LINHA 5.
 *
 * Estrutura do arquivo:
 *   Linha 1: título
 *   Linha 2: instrução de preenchimento
 *   Linha 3: (vazia)
 *   Linha 4: cabeçalho das colunas (Nº, Nome, Telefone, CPF, Data de Nascimento, E-mail) em A..F
 *   Linha 5: linha de exemplo (Nº em A, Nome em B, … E-mail em F)
 *
 * As 4 primeiras linhas são ignoradas pela importação (`for (int l = 5; ...)`),
 * então o arquivo baixado já pode ser preenchido a partir da linha 5 e enviado.
 *
 * - Prefixado com BOM UTF-8 para que acentos (Nº, Data de Nascimento, João…)
 *   não sejam corrompidos ao abrir no Excel no Windows.
 * - Segue RFC 4180: campos com vírgula/aspas/CR/LF são escapados e as linhas
 *   são separadas por CRLF.
 */
export function buildCustomerImportCsvTemplate(brandName: string = FALLBACK_BRANDING.name): string {
  const escape = (value: string): string =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const totalColunas = CUSTOMER_IMPORT_COLUMNS.length;
  // Linhas de metadados ocupam apenas a coluna A; as demais ficam vazias para
  // preservar o número de colunas do CSV (RFC 4180) e o alinhamento no Excel.
  const linhaMeta = (primeiraColuna: string): string =>
    [escape(primeiraColuna), ...Array(totalColunas - 1).fill("")].join(",");

  const titulo = linhaMeta(buildCustomerImportTitle(brandName));
  const instrucao = linhaMeta(CUSTOMER_IMPORT_INSTRUCTION);
  const linhaVazia = Array(totalColunas).fill("").join(",");
  const cabecalho = CUSTOMER_IMPORT_COLUMNS.map((c) => escape(c.header)).join(",");
  const exemplo = CUSTOMER_IMPORT_COLUMNS.map((c) => escape(c.exemplo)).join(",");

  return `${UTF8_BOM}${titulo}\r\n${instrucao}\r\n${linhaVazia}\r\n${cabecalho}\r\n${exemplo}\r\n`;
}
