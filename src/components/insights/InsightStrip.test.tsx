import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InsightStrip from "./InsightStrip";
import { InsightSeveridade, type InsightChave } from "../../services/model/insights.types";

const contadores = vi.fn();

vi.mock("../../services/service/InsightsService", () => ({
  default: {
    contadores: (...args: unknown[]) => contadores(...args),
  },
}));

/** 12 chaves = exatamente dois blocos de 6, o suficiente para observar o carregamento parcial. */
const CHAVES_DE_DOIS_BLOCOS: InsightChave[] = [
  "PlanoAcabando",
  "PacienteDormente",
  "FaltouOntem",
  "SessaoAmanhaNaoConfirmada",
  "AniversariantesHoje",
  "PlanoZeradoSemRenovar",
  "StatusNovoPaciente",
  "StatusAlta",
  "EmailVazio",
  "TelefoneVazio",
  "CpfDuplicado",
  "PatologiaVazia",
];

function darContador(chave: string, total: number, severidade = InsightSeveridade.Atencao) {
  return { chave, total, severidade, atualizadoEm: new Date().toISOString() };
}

/** Responde o lote devolvendo o mesmo total para toda chave pedida. */
function responderLote(total: number, severidade = InsightSeveridade.Atencao) {
  contadores.mockImplementation((chaves: InsightChave[]) =>
    Promise.resolve(chaves.map((chave) => darContador(chave, total, severidade)))
  );
}

function renderizar(chaves: Parameters<typeof InsightStrip>[0]["chaves"]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/customer"]}>
        <Routes>
          <Route path="/customer" element={<InsightStrip chaves={chaves} />} />
          <Route path="/insights/:chave" element={<p>destino do insight</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("InsightStrip", () => {
  beforeEach(() => {
    contadores.mockReset();
  });

  it("mostra o total devolvido pela API", async () => {
    responderLote(12);

    renderizar(["PlanoAcabando"]);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("Planos acabando")).toBeInTheDocument();
  });

  // AC-12
  it("navega para o grid do insight ao clicar no card", async () => {
    const user = userEvent.setup();
    responderLote(3);

    renderizar(["PlanoAcabando"]);
    await screen.findByText("3");

    await user.click(screen.getByRole("button", { name: /Planos acabando/i }));

    expect(await screen.findByText("destino do insight")).toBeInTheDocument();
  });

  // AC-12 — acessibilidade: o card é <button>, então Enter tem que acionar.
  it("aciona por teclado, não só por clique de mouse", async () => {
    const user = userEvent.setup();
    responderLote(3);

    renderizar(["PlanoAcabando"]);
    await screen.findByText("3");

    await user.tab();
    expect(screen.getByRole("button", { name: /Planos acabando/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByText("destino do insight")).toBeInTheDocument();
  });

  it("descreve a regra no rótulo acessível, para o time saber por que o paciente está na fila", async () => {
    responderLote(5);

    renderizar(["PacienteDormente"]);

    expect(
      await screen.findByRole("button", { name: /sem check-in há mais de 14 dias/i })
    ).toBeInTheDocument();
  });

  // AC-15
  it("renderiza estado de erro sem quebrar a tela quando a API falha", async () => {
    contadores.mockRejectedValue({ response: { status: 429 } });

    renderizar(["PlanoAcabando"]);

    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
    // A faixa é acessório da tela: falhar nela não pode derrubar o grid de pacientes.
    expect(screen.getByText("Planos acabando")).toBeInTheDocument();
    // E o leitor de tela não pode anunciar "0", que soaria como "nada pendente".
    expect(
      screen.getByRole("button", { name: /Planos acabando, não foi possível carregar/i })
    ).toBeInTheDocument();
  });

  it("marca como indisponíveis os cards do bloco que falhou", async () => {
    contadores.mockRejectedValue(new Error("falhou"));

    renderizar(["PlanoAcabando", "AniversariantesHoje"]);

    expect(await screen.findAllByText(/não foi possível carregar/i)).toHaveLength(2);
  });

  /**
   * A falha fica contida no bloco que falhou.
   *
   * Com um lote unico isso nao era possivel: um erro apagava os 33 numeros de uma vez. Os
   * blocos devolvem essa resiliencia sem voltar a uma requisicao por card.
   */
  it("um bloco com falha não apaga os números dos outros", async () => {
    const user = userEvent.setup();
    contadores.mockImplementation((chaves: InsightChave[]) =>
      chaves.includes("PlanoAcabando")
        ? Promise.reject(new Error("falhou"))
        : Promise.resolve(chaves.map((chave) => darContador(chave, 7)))
    );

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    // O segundo bloco cai fora das tres linhas visiveis; expandir para compara-lo com o
    // primeiro, que e o que falhou.
    await user.click(await screen.findByRole("button", { name: /mostrar mais/i }));

    expect(await screen.findAllByText("7")).toHaveLength(6);
    expect(await screen.findAllByText(/não foi possível carregar/i)).toHaveLength(6);
  });

  // ───────────── faixa recolhida ─────────────
  // Em jsdom `window.innerWidth` é 1024, então o grid está em 2 colunas: 3 linhas = 6 cards.

  it("mostra só três linhas de cards por padrão", async () => {
    responderLote(9);

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    await screen.findAllByText("9");
    // 12 chaves, 6 visíveis: a faixa não pode empurrar o grid de pacientes para fora da tela.
    expect(screen.getAllByText("9")).toHaveLength(6);
    expect(screen.queryByText("Sem patologia")).not.toBeInTheDocument();
  });

  it("expande e recolhe o restante dos cards no clique", async () => {
    const user = userEvent.setup();
    responderLote(9);

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    const alternar = await screen.findByRole("button", { name: /mostrar mais 6/i });
    expect(alternar).toHaveAttribute("aria-expanded", "false");

    await user.click(alternar);

    expect(await screen.findByText("Sem patologia")).toBeInTheDocument();
    expect(screen.getAllByText("9")).toHaveLength(12);

    const recolher = screen.getByRole("button", { name: /mostrar menos/i });
    expect(recolher).toHaveAttribute("aria-expanded", "true");

    await user.click(recolher);

    expect(screen.queryByText("Sem patologia")).not.toBeInTheDocument();
  });

  // UT-21 — a faixa de Funcionários tem 10 cards; em 2 colunas, 3 linhas mostram 6.
  it("recolhe também a faixa de Funcionários", async () => {
    responderLote(3);

    renderizar([
      "FuncionarioAniversarianteDoDia",
      "FuncionarioAniversarianteDoMes",
      "FuncionarioCpfDuplicado",
      "FuncionarioEmailDuplicado",
      "FuncionarioTelefoneDuplicado",
      "FuncionarioCpfVazio",
      "FuncionarioEmailVazio",
      "FuncionarioTelefoneVazio",
      "FuncionarioCargoVazio",
      "FuncionarioSemFilial",
    ]);

    await screen.findAllByText("3");
    expect(screen.getAllByText("3")).toHaveLength(6);
    expect(await screen.findByRole("button", { name: /mostrar mais 4/i })).toBeInTheDocument();
  });

  it("não oferece o botão quando tudo já cabe nas três linhas", async () => {
    responderLote(1);

    renderizar(["PlanoAcabando", "PacienteDormente", "AniversariantesHoje"]);

    await screen.findAllByText("1");
    expect(screen.queryByRole("button", { name: /mostrar mais|mostrar menos/i })).not.toBeInTheDocument();
  });

  it("busca também os contadores dos cards recolhidos, para expandir não custar espera", async () => {
    responderLote(2);

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    await waitFor(() => expect(contadores).toHaveBeenCalledTimes(2));

    const chavesPedidas = contadores.mock.calls.flatMap((chamada) => chamada[0]);
    expect(chavesPedidas).toHaveLength(CHAVES_DE_DOIS_BLOCOS.length);
  });

  /**
   * O ponto da mudanca: a tela nao espera o conjunto inteiro.
   *
   * O segundo bloco fica pendente para sempre neste teste. Os cards do primeiro precisam
   * aparecer assim mesmo -- com lote unico, a faixa inteira ficaria em esqueleto.
   */
  it("pinta os cards do primeiro bloco sem esperar o segundo", async () => {
    contadores.mockImplementation((chaves: InsightChave[]) =>
      chaves.includes("PlanoAcabando")
        ? Promise.resolve(chaves.map((chave) => darContador(chave, 4)))
        : new Promise(() => {})
    );

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    expect(await screen.findAllByText("4")).toHaveLength(6);
  });

  it("não renderiza nada quando não há chave, para não deixar cabeçalho órfão", () => {
    const { container } = renderizar([]);

    expect(container).toBeEmptyDOMElement();
  });

  // UT-30 — o motivo de existir do endpoint em lote: uma requisicao por bloco, nao por card.
  it("agrupa as chaves em blocos em vez de uma requisição por card", async () => {
    responderLote(1);

    renderizar(CHAVES_DE_DOIS_BLOCOS);

    await waitFor(() => expect(contadores).toHaveBeenCalledTimes(2));

    const chavesPedidas = contadores.mock.calls.flatMap((chamada) => chamada[0]);
    expect(chavesPedidas).toHaveLength(CHAVES_DE_DOIS_BLOCOS.length);
    // Nenhuma chave pedida duas vezes: bloco repetido seria requisicao jogada fora.
    expect(new Set(chavesPedidas).size).toBe(CHAVES_DE_DOIS_BLOCOS.length);
  });

  it("cabe numa requisição só quando a faixa é pequena", async () => {
    responderLote(1);

    renderizar(["PlanoAcabando", "PacienteDormente", "AniversariantesHoje"]);

    await waitFor(() => expect(contadores).toHaveBeenCalledTimes(1));
  });

  // UT-31 — card zerado continua sendo porta de entrada para a lista.
  it("mantém o card clicável quando o contador é zero", async () => {
    const user = userEvent.setup();
    responderLote(0, InsightSeveridade.Informativo);

    renderizar(["StatusAlta"]);

    await screen.findByText("0");
    await user.click(screen.getByRole("button", { name: /Status: Alta/i }));

    expect(await screen.findByText("destino do insight")).toBeInTheDocument();
  });
});
