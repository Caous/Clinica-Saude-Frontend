import { describe, it, expect } from "vitest";
import { DOCUMENTACAO, DocModule, DocSection } from "./documentacao";
import { USER_ROLES } from "../services/util/rolePermissions";

// IDs esperados dos 15 módulos (nenhum pode faltar)
const MODULE_IDS = [
  "agenda",
  "pacientes",
  "funcionarios",
  "unidades",
  "servicos",
  "ordem-servico",
  "checkins",
  "acessos-clientes",
  "whatsapp",
  "financeiro",
  "notificacoes",
  "email",
  "relatorios",
  "dashboard",
  "logs",
];

const getModule = (id: string): DocModule => {
  const modulo = DOCUMENTACAO.find((m) => m.id === id);
  if (!modulo) throw new Error(`Módulo não encontrado: ${id}`);
  return modulo;
};

// Concatena todo o texto de uma seção (intro + passos + regras + dicas)
const sectionText = (s: DocSection): string =>
  [
    s.titulo,
    s.intro ?? "",
    ...(s.passos ?? []).flatMap((p) => [p.titulo, p.descricao]),
    ...(s.regras ?? []),
    ...(s.dicas ?? []),
  ].join(" ");

const moduleText = (m: DocModule): string =>
  [m.titulo, m.resumo, ...m.secoes.map(sectionText)].join(" ").toLowerCase();

const sectionTitles = (m: DocModule): string[] =>
  m.secoes.map((s) => s.titulo.toLowerCase());

// ============ UT-1 (AC-16): nenhum módulo stub ============
describe("DOCUMENTACAO — estrutura geral (UT-1)", () => {
  it("contém exatamente os 15 módulos esperados", () => {
    const ids = DOCUMENTACAO.map((m) => m.id).sort();
    expect(ids).toEqual([...MODULE_IDS].sort());
  });

  it.each(MODULE_IDS)(
    "módulo '%s' tem conteúdo real (não é stub)",
    (id) => {
      const modulo = getModule(id);

      // pelo menos 2 seções
      expect(modulo.secoes.length).toBeGreaterThanOrEqual(2);

      // pelo menos uma seção com intro ou passos preenchidos
      const temIntroOuPassos = modulo.secoes.some(
        (s) => (s.intro && s.intro.trim().length > 0) || (s.passos && s.passos.length > 0)
      );
      expect(temIntroOuPassos).toBe(true);

      // volume de conteúdo substancial (evita resumos de 1-2 linhas)
      expect(moduleText(modulo).length).toBeGreaterThan(400);
    }
  );
});

// ============ UT-7 (AC-16): roles válidos e coerentes ============
describe("DOCUMENTACAO — roles por módulo (UT-7)", () => {
  const VALID_ROLES = Object.values(USER_ROLES) as string[];

  it.each(MODULE_IDS)(
    "módulo '%s' usa apenas roles válidos do sistema",
    (id) => {
      const modulo = getModule(id);
      expect(modulo.roles.length).toBeGreaterThan(0);
      for (const role of modulo.roles) {
        expect(VALID_ROLES).toContain(role);
      }
    }
  );

  it("nenhum módulo expõe documentação ao perfil Cliente", () => {
    for (const modulo of DOCUMENTACAO) {
      expect(modulo.roles).not.toContain(USER_ROLES.CLIENTE);
    }
  });

  it("logs é restrito ao Administrador (coerente com permissions_map)", () => {
    expect(getModule("logs").roles).toEqual([USER_ROLES.ADMINISTRADOR]);
  });

  it("agenda não é visível ao Financeiro (coerente com permissions_map)", () => {
    expect(getModule("agenda").roles).not.toContain(USER_ROLES.FINANCEIRO);
  });
});

// ============ UT-2 (AC-2): pacientes cobre CRUD + importar ============
describe("Módulo pacientes (UT-2)", () => {
  const modulo = getModule("pacientes");
  const titulos = sectionTitles(modulo).join(" | ");
  const texto = moduleText(modulo);

  it("cobre cadastrar, listar, editar, excluir e importar", () => {
    expect(titulos).toContain("cadastrar");
    expect(titulos).toMatch(/listar|lista/);
    expect(titulos).toContain("editar");
    expect(titulos).toContain("excluir");
    expect(titulos).toContain("importar");
  });

  it("explica o modal ao clicar no nome e o botão Check-in", () => {
    expect(texto).toContain("modal");
    expect(texto).toContain("check-in");
  });

  it("a seção de importação oferece um download de modelo CSV", () => {
    const secaoImport = modulo.secoes.find((s) =>
      s.titulo.toLowerCase().includes("importar")
    );
    expect(secaoImport?.downloads?.length).toBeGreaterThan(0);
    const download = secaoImport!.downloads![0];
    expect(download.filename).toMatch(/\.csv$/);
    expect(download.mime).toContain("text/csv");
    expect(download.content).toBeUndefined();
    const conteudo = download.buildContent!("Acme Saúde");
    expect(conteudo).toContain("Nome");
    expect(conteudo).toContain("CPF");
    expect(conteudo).toContain("Acme Saúde");
  });
});

// ============ UT-3 (AC-3): unidades tem Editar e Excluir ============
describe("Módulo unidades (UT-3)", () => {
  const titulos = sectionTitles(getModule("unidades"));

  it("possui seções de Editar e Excluir", () => {
    expect(titulos.some((t) => t.includes("editar"))).toBe(true);
    expect(titulos.some((t) => t.includes("excluir"))).toBe(true);
  });
});

// ============ UT-4 (AC-5): ordem-servico menciona competência e pagamento misto ============
describe("Módulo ordem-servico (UT-4)", () => {
  const texto = moduleText(getModule("ordem-servico"));

  it("menciona Data do plano (competência) e pagamento misto", () => {
    expect(texto).toContain("data do plano");
    expect(texto).toContain("compet");
    expect(texto).toContain("pagamento misto");
  });

  it("traz um exemplo numérico de plano retroativo", () => {
    expect(texto).toContain("exemplo");
    expect(texto).toMatch(/r\$\s?1\.200|1\.200/);
  });
});

// ============ UT-5 (AC-10): financeiro documenta os 6 contadores ============
describe("Módulo financeiro (UT-5)", () => {
  const texto = moduleText(getModule("financeiro"));

  it("documenta os 6 contadores do topo", () => {
    expect(texto).toContain("recebimento esperado");
    expect(texto).toContain("despesas");
    expect(texto).toContain("saldo líquido");
    expect(texto).toContain("transações pendentes");
    expect(texto).toContain("total aprovado");
    expect(texto).toContain("total concluído");
  });

  it("descreve o efeito dos status nos botões do grid", () => {
    expect(texto).toContain("concluída");
    expect(texto).toContain("cancelada");
    expect(texto).toMatch(/desabilit|trava/);
  });
});

// ============ UT-6 (AC-14): dashboard descreve cada gráfico ============
describe("Módulo dashboard (UT-6)", () => {
  const texto = moduleText(getModule("dashboard"));

  // Gráficos presentes nos painéis (Home + Operação)
  const GRAFICOS = [
    "entrada & saída",
    "faturamento por categoria",
    "tipos de transação",
    "distribuição por unidade",
    "faturamento e despesas mensais",
    "faturamento comparativo",
    "sessões mensais",
    "serviços",
    "patologias",
    "clientes por filial",
    "produtividade dos fisioterapeutas",
    "fisio x plano",
  ];

  it.each(GRAFICOS)("descreve o gráfico '%s'", (grafico) => {
    expect(texto).toContain(grafico);
  });
});
