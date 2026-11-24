import { describe, it, expect } from "vitest";
import {
  buildCustomerImportCsvTemplate,
  CUSTOMER_IMPORT_COLUMNS,
} from "./customerImportTemplate";

// UT-8 (AC-17): gerador do CSV modelo produz cabeçalho + exemplo
describe("buildCustomerImportCsvTemplate (UT-8)", () => {
  it("prefixa BOM UTF-8 para o Excel no Windows ler os acentos", () => {
    const csv = buildCustomerImportCsvTemplate();
    expect(csv.startsWith("﻿")).toBe(true);
  });

  it("usa CRLF como separador de linha (RFC 4180)", () => {
    const csv = buildCustomerImportCsvTemplate();
    expect(csv).toContain("\r\n");
    // não deve haver LF sem CR antecedente
    expect(/[^\r]\n/.test(csv)).toBe(false);
  });

  it("posiciona cabeçalho na linha 4 e exemplo na linha 5, espelhando o parser", () => {
    const csv = buildCustomerImportCsvTemplate();
    // remove BOM e separa por CRLF sem trim, para preservar a posição das linhas
    const linhas = csv.replace(/^﻿/, "").replace(/\r\n$/, "").split("\r\n");

    // 4 linhas de cabeçalho/instrução ignoradas pelo import + 1 linha de dados
    expect(linhas).toHaveLength(5);

    // linha 3 (índice 2) é a linha em branco entre instruções e cabeçalho
    expect(linhas[2].replace(/,/g, "")).toBe("");

    // cabeçalho das colunas fica na linha 4 (índice 3)
    const cabecalho = linhas[3];
    // linha de exemplo/dados fica na linha 5 (índice 4) — de onde o parser lê
    const exemplo = linhas[4];

    // colunas reais derivadas do parser backend
    expect(cabecalho).toContain("Nome");
    expect(cabecalho).toContain("CPF");
    expect(cabecalho).toContain("Telefone");
    expect(cabecalho).toContain("Data de Nascimento");
    expect(cabecalho).toContain("E-mail");

    // a linha de exemplo tem o mesmo número de colunas do cabeçalho
    expect(exemplo.split(",")).toHaveLength(cabecalho.split(",").length);
    expect(exemplo.length).toBeGreaterThan(0);
  });

  it("mantém a ordem das colunas (A..F) alinhada ao Cell(2..6) do parser", () => {
    const csv = buildCustomerImportCsvTemplate();
    const linhas = csv.replace(/^﻿/, "").replace(/\r\n$/, "").split("\r\n");
    const cabecalho = linhas[3].split(",");

    // A = Nº (ignorada), B = Nome, C = Telefone, D = CPF,
    // E = Data de Nascimento, F = E-mail
    expect(cabecalho).toEqual([
      "Nº",
      "Nome",
      "Telefone",
      "CPF",
      "Data de Nascimento",
      "E-mail",
    ]);
  });

  it("marca Nome e CPF como obrigatórios", () => {
    const obrigatorios = CUSTOMER_IMPORT_COLUMNS.filter((c) => c.obrigatorio).map(
      (c) => c.header
    );
    expect(obrigatorios).toContain("Nome");
    expect(obrigatorios).toContain("CPF");
  });
});

// AC-4: marca vem por parâmetro; padrão neutro, sem marca de terceiros
describe("buildCustomerImportCsvTemplate com marca", () => {
  it("usa o nome da marca informado no título (linha 1)", () => {
    const csv = buildCustomerImportCsvTemplate("Acme Saúde");
    expect(csv.replace(/^﻿/, "").split("\r\n")[0]).toContain("Acme Saúde");
  });

  it("sem parâmetro usa o nome neutro do fallback", () => {
    expect(buildCustomerImportCsvTemplate()).toContain("Sistema Clínica");
  });
});
