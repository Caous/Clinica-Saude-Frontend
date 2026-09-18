import { describe, it, expect } from "vitest";
import {
  INSIGHTS,
  INSIGHTS_DA_TELA_CLIENTE,
  INSIGHTS_DA_TELA_FINANCEIRO,
  obterInsight,
} from "./insightsRegistry";
import type { InsightChave } from "../services/model/insights.types";

/**
 * Chaves expostas por `GET api/Insights/chaves` (enum EInsightChave).
 * Se o backend ganhar uma chave nova, este teste falha até o front registrá-la.
 */
const CHAVES_DO_BACKEND: InsightChave[] = [
  "PlanoAcabando",
  "PacienteDormente",
  "AniversariantesHoje",
  "ParcelasVencidas",
  "PlanoZeradoSemRenovar",
  "FaltouOntem",
  "SessaoAmanhaNaoConfirmada",
  "ParcelasVence7Dias",
  "PlanoSemPagamento",
];

describe("insightsRegistry", () => {
  it("tem definição para toda chave que o backend expõe", () => {
    expect(Object.keys(INSIGHTS).sort()).toEqual([...CHAVES_DO_BACKEND].sort());
  });

  it("não define chave que o backend não conhece", () => {
    Object.keys(INSIGHTS).forEach((chave) => {
      expect(CHAVES_DO_BACKEND).toContain(chave as InsightChave);
    });
  });

  it("a chave da definição bate com a chave do mapa, senão a rota abre o insight errado", () => {
    Object.entries(INSIGHTS).forEach(([chaveDoMapa, definicao]) => {
      expect(definicao.chave).toBe(chaveDoMapa);
    });
  });

  it("toda definição explica a regra e tem ao menos uma coluna além do paciente", () => {
    Object.values(INSIGHTS).forEach((definicao) => {
      expect(definicao.descricao.length).toBeGreaterThan(40);
      expect(definicao.titulo).not.toBe("");
      expect(definicao.acao).not.toBe("");
      expect(definicao.mensagemWhatsapp).not.toBe("");
      expect(definicao.colunas.length).toBeGreaterThanOrEqual(2);
      expect(definicao.colunas[0].titulo).toBe("Paciente");
    });
  });

  it("as faixas só referenciam insights do próprio escopo", () => {
    INSIGHTS_DA_TELA_CLIENTE.forEach((chave) =>
      expect(INSIGHTS[chave].escopo).toBe("cliente")
    );
    INSIGHTS_DA_TELA_FINANCEIRO.forEach((chave) =>
      expect(INSIGHTS[chave].escopo).toBe("financeiro")
    );
  });

  it("nenhum insight aparece nas duas faixas ao mesmo tempo", () => {
    const repetidos = INSIGHTS_DA_TELA_CLIENTE.filter((chave) =>
      INSIGHTS_DA_TELA_FINANCEIRO.includes(chave)
    );

    expect(repetidos).toEqual([]);
  });

  it("colunas de um insight não se repetem", () => {
    Object.values(INSIGHTS).forEach((definicao) => {
      const titulos = definicao.colunas.map((coluna) => coluna.titulo);
      expect(new Set(titulos).size).toBe(titulos.length);
    });
  });

  it("obterInsight devolve undefined para chave desconhecida ou ausente", () => {
    expect(obterInsight("PlanoInventado")).toBeUndefined();
    expect(obterInsight(undefined)).toBeUndefined();
    expect(obterInsight("PlanoAcabando")?.titulo).toBe("Planos acabando");
  });

  it("colunas resistem a item sem métrica, sem data e sem valor", () => {
    const itemVazio = { referenciaId: "x", clienteNome: "Sem dados", metricas: {} };

    Object.values(INSIGHTS).forEach((definicao) => {
      definicao.colunas.forEach((coluna) => {
        // Célula nunca pode render "undefined" ou estourar: o grid é genérico e
        // um insight novo pode não preencher toda métrica.
        const conteudo = coluna.valor(itemVazio as never);
        expect(typeof conteudo).toBe("string");
        expect(conteudo).not.toContain("undefined");
      });
    });
  });
});
