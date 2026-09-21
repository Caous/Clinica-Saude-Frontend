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

  /**
   * O lote é atômico, então a falha é de todos ou de nenhum.
   *
   * É a contrapartida aceita ao trocar uma chamada por card por uma chamada só: exibir metade
   * dos números sem sinalizar que a outra metade falhou seria pior do que não exibir nenhum.
   */
  it("marca todos os cards como indisponíveis quando o lote falha", async () => {
    contadores.mockRejectedValue(new Error("falhou"));

    renderizar(["PlanoAcabando", "AniversariantesHoje"]);

    expect(await screen.findAllByText(/não foi possível carregar/i)).toHaveLength(2);
  });

  it("não renderiza nada quando não há chave, para não deixar cabeçalho órfão", () => {
    const { container } = renderizar([]);

    expect(container).toBeEmptyDOMElement();
  });

  // UT-30 — o motivo de existir do endpoint em lote.
  it("dispara uma requisição só, não uma por card", async () => {
    responderLote(1);

    renderizar([
      "PlanoAcabando",
      "PacienteDormente",
      "AniversariantesHoje",
      "EmailVazio",
      "CpfDuplicado",
      "StatusAlta",
    ]);

    await waitFor(() => expect(contadores).toHaveBeenCalledTimes(1));
    expect(contadores.mock.calls[0][0]).toHaveLength(6);
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
