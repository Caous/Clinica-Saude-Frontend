import { describe, it, expect } from "vitest";
import {
  INSIGHTS,
  INSIGHTS_DA_TELA_CLIENTE,
  INSIGHTS_DA_TELA_FINANCEIRO,
  INSIGHTS_DA_TELA_FUNCIONARIO,
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
  "StatusNovoPaciente",
  "StatusAguardandoAvaliacao",
  "StatusEmAvaliacao",
  "StatusPlanoTratamento",
  "StatusEmAtendimento",
  "StatusFaltouAtendimento",
  "StatusTratamentoConcluido",
  "StatusAlta",
  "StatusCancelado",
  "StatusInativo",
  "EmailVazio",
  "EmailInvalido",
  "EmailPlaceholder",
  "EmailDuplicado",
  "TelefoneVazio",
  "TelefoneDuplicado",
  "TelefoneDigitosIguais",
  "TelefoneCurto",
  "SemEmailESemTelefone",
  "CpfDigitosRepetidos",
  "CpfVazio",
  "CpfDigitoVerificadorInvalido",
  "CpfDuplicado",
  "EnderecoVazio",
  "PatologiaVazia",
  "DocumentoIdentificacaoVazio",
  "FilialNaoDefinida",
  "FuncionarioAniversarianteDoDia",
  "FuncionarioAniversarianteDoMes",
  "FuncionarioCpfVazio",
  "FuncionarioSemFilial",
  "FuncionarioEmailVazio",
  "FuncionarioTelefoneVazio",
  "FuncionarioCargoVazio",
  "FuncionarioCpfDuplicado",
  "FuncionarioEmailDuplicado",
  "FuncionarioTelefoneDuplicado",
];

/** Insights de qualidade de cadastro: os que abrem a ficha em vez do WhatsApp. */
const CHAVES_DE_QUALIDADE: InsightChave[] = CHAVES_DO_BACKEND.filter(
  (chave) => INSIGHTS[chave]?.escopo === "qualidade"
);

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
      expect(definicao.colunas.length).toBeGreaterThanOrEqual(2);
      expect(definicao.colunas[0].titulo).toBe("Paciente");
    });
  });

  it("as faixas só referenciam insights do próprio escopo", () => {
    // A faixa de Pacientes carrega venda e qualidade de cadastro: as duas falam do paciente,
    // e foi decisão do negócio manter tudo numa faixa só.
    INSIGHTS_DA_TELA_CLIENTE.forEach((chave) =>
      expect(["cliente", "qualidade"]).toContain(INSIGHTS[chave].escopo)
    );
    INSIGHTS_DA_TELA_FINANCEIRO.forEach((chave) =>
      expect(INSIGHTS[chave].escopo).toBe("financeiro")
    );
  });

  // UT-26
  it("insight de qualidade abre o cadastro e não oferece WhatsApp", () => {
    expect(CHAVES_DE_QUALIDADE.length).toBe(27);

    CHAVES_DE_QUALIDADE.forEach((chave) => {
      const definicao = INSIGHTS[chave];

      expect(definicao.tipoAcao).toBe("cadastro");
      // Metade dessas filas é de gente sem telefone: oferecer WhatsApp aqui não faz sentido.
      expect(definicao.mensagemWhatsapp).toBeUndefined();
      expect(definicao.acao).toBe("Abrir cadastro");
    });
  });

  it("insight de venda continua abrindo o WhatsApp, com mensagem pronta", () => {
    // Qualidade de cadastro e ficha de funcionário abrem formulário; só venda e cobrança
    // falam com a pessoa.
    Object.values(INSIGHTS)
      .filter((definicao) => definicao.escopo !== "qualidade" && definicao.escopo !== "funcionario")
      .forEach((definicao) => {
        expect(definicao.tipoAcao ?? "whatsapp").toBe("whatsapp");
        expect(definicao.mensagemWhatsapp).toBeTruthy();
      });
  });

  it("a faixa de Pacientes traz os 6 insights de venda e os 27 de qualidade", () => {
    expect(INSIGHTS_DA_TELA_CLIENTE).toHaveLength(33);
    expect(new Set(INSIGHTS_DA_TELA_CLIENTE).size).toBe(33);
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

  it("formata o telefone igual ao resto do sistema", () => {
    const coluna = INSIGHTS.StatusNovoPaciente.colunas.find(
      (atual) => atual.titulo === "Telefone"
    );

    const item = {
      referenciaId: "x",
      clienteNome: "Ana",
      telefone: "11999998888",
      metricas: {},
    };

    // Mesmo formato do grid de pacientes: o numero nao pode sair cru em uma tela e
    // mascarado em outra.
    expect(coluna?.valor(item as never)).toBe("(11) 99999-8888");
  });

  it("telefone ausente vira travessão, não string vazia", () => {
    const coluna = INSIGHTS.StatusNovoPaciente.colunas.find(
      (atual) => atual.titulo === "Telefone"
    );

    const item = { referenciaId: "x", clienteNome: "Ana", metricas: {} };

    expect(coluna?.valor(item as never)).toBe("—");
  });

  // UT-20
  it("insight de funcionário abre a ficha do funcionário e não oferece WhatsApp", () => {
    const deFuncionario = Object.values(INSIGHTS).filter(
      (definicao) => definicao.escopo === "funcionario"
    );

    expect(deFuncionario).toHaveLength(10);

    deFuncionario.forEach((definicao) => {
      expect(definicao.tipoAcao).toBe("fichaDeFuncionario");
      expect(definicao.mensagemWhatsapp).toBeUndefined();
      expect(definicao.acao).toBe("Abrir ficha");
    });
  });

  it("a faixa de Funcionários traz os 10 insights de cadastro da equipe", () => {
    expect(INSIGHTS_DA_TELA_FUNCIONARIO).toHaveLength(10);
    expect(new Set(INSIGHTS_DA_TELA_FUNCIONARIO).size).toBe(10);

    INSIGHTS_DA_TELA_FUNCIONARIO.forEach((chave) =>
      expect(INSIGHTS[chave].escopo).toBe("funcionario")
    );
  });

  it("nenhum insight de funcionário aparece na faixa de Pacientes", () => {
    const repetidos = INSIGHTS_DA_TELA_FUNCIONARIO.filter((chave) =>
      INSIGHTS_DA_TELA_CLIENTE.includes(chave)
    );

    expect(repetidos).toEqual([]);
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
