import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InsightStrip from "./InsightStrip";
import { InsightSeveridade } from "../../services/model/insights.types";

const contador = vi.fn();

vi.mock("../../services/service/InsightsService", () => ({
  default: {
    contador: (...args: unknown[]) => contador(...args),
  },
}));

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
    contador.mockReset();
  });

  it("mostra o total devolvido pela API", async () => {
    contador.mockResolvedValue({
      chave: "PlanoAcabando",
      total: 12,
      severidade: InsightSeveridade.Atencao,
      atualizadoEm: new Date().toISOString(),
    });

    renderizar(["PlanoAcabando"]);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("Planos acabando")).toBeInTheDocument();
  });

  // AC-12
  it("navega para o grid do insight ao clicar no card", async () => {
    const user = userEvent.setup();
    contador.mockResolvedValue({
      chave: "PlanoAcabando",
      total: 3,
      severidade: InsightSeveridade.Atencao,
      atualizadoEm: new Date().toISOString(),
    });

    renderizar(["PlanoAcabando"]);
    await screen.findByText("3");

    await user.click(screen.getByRole("button", { name: /Planos acabando/i }));

    expect(await screen.findByText("destino do insight")).toBeInTheDocument();
  });

  // AC-12 — acessibilidade: o card é <button>, então Enter tem que acionar.
  it("aciona por teclado, não só por clique de mouse", async () => {
    const user = userEvent.setup();
    contador.mockResolvedValue({
      chave: "PlanoAcabando",
      total: 3,
      severidade: InsightSeveridade.Atencao,
      atualizadoEm: new Date().toISOString(),
    });

    renderizar(["PlanoAcabando"]);
    await screen.findByText("3");

    await user.tab();
    expect(screen.getByRole("button", { name: /Planos acabando/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByText("destino do insight")).toBeInTheDocument();
  });

  it("descreve a regra no rótulo acessível, para o time saber por que o paciente está na fila", async () => {
    contador.mockResolvedValue({
      chave: "PacienteDormente",
      total: 5,
      severidade: InsightSeveridade.Atencao,
      atualizadoEm: new Date().toISOString(),
    });

    renderizar(["PacienteDormente"]);

    expect(
      await screen.findByRole("button", { name: /sem check-in há mais de 14 dias/i })
    ).toBeInTheDocument();
  });

  // AC-15
  it("renderiza estado de erro sem quebrar a tela quando a API falha", async () => {
    contador.mockRejectedValue({ response: { status: 429 } });

    renderizar(["PlanoAcabando"]);

    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
    // A faixa é acessório da tela: falhar nela não pode derrubar o grid de pacientes.
    expect(screen.getByText("Planos acabando")).toBeInTheDocument();
    // E o leitor de tela não pode anunciar "0", que soaria como "nada pendente".
    expect(
      screen.getByRole("button", { name: /Planos acabando, não foi possível carregar/i })
    ).toBeInTheDocument();
  });

  it("um contador com falha não impede o outro de exibir o número", async () => {
    contador.mockImplementation((chave: string) =>
      chave === "PlanoAcabando"
        ? Promise.reject(new Error("falhou"))
        : Promise.resolve({
            chave,
            total: 7,
            severidade: InsightSeveridade.Informativo,
            atualizadoEm: new Date().toISOString(),
          })
    );

    renderizar(["PlanoAcabando", "AniversariantesHoje"]);

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
  });

  it("não renderiza nada quando não há chave, para não deixar cabeçalho órfão", () => {
    const { container } = renderizar([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("dispara uma chamada por card, não uma por render", async () => {
    contador.mockResolvedValue({
      chave: "PlanoAcabando",
      total: 1,
      severidade: InsightSeveridade.Informativo,
      atualizadoEm: new Date().toISOString(),
    });

    renderizar(["PlanoAcabando", "PacienteDormente", "AniversariantesHoje"]);

    await waitFor(() => expect(contador).toHaveBeenCalledTimes(3));
  });
});
