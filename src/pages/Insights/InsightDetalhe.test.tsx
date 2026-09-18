import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import InsightDetalhe from "./InsightDetalhe";
import type { InsightItem } from "../../services/model/insights.types";

const itens = vi.fn();
const exportacao = vi.fn();
const registrarAcompanhamento = vi.fn();

vi.mock("../../services/service/InsightsService", () => ({
  default: {
    itens: (...args: unknown[]) => itens(...args),
    exportacao: (...args: unknown[]) => exportacao(...args),
    registrarAcompanhamento: (...args: unknown[]) => registrarAcompanhamento(...args),
  },
}));

const exportTableMock = vi.fn(() => "arquivo.csv");
vi.mock("../../utils/exportTable", () => ({
  exportTable: (...args: unknown[]) => exportTableMock(...(args as [])),
}));

function paciente(nome: string, restantes: number): InsightItem {
  return {
    referenciaId: `ref-${nome}`,
    clienteId: `cli-${nome}`,
    clienteNome: nome,
    telefone: "(11) 99999-9999",
    metricas: { "Sessões restantes": String(restantes), "Sessões contratadas": "10" },
  };
}

/** Expõe a URL corrente para o teste conseguir afirmar sobre o estado de navegação. */
function EspiaoDeUrl() {
  const location = useLocation();
  return <output data-testid="url">{location.pathname + location.search}</output>;
}

function renderizar(rotaInicial: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  // PageMeta usa react-helmet-async; sem o provider o componente estoura na montagem,
  // igual ao AppWrapper que envolve a aplicacao real.
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[rotaInicial]}>
          <EspiaoDeUrl />
          <Routes>
            <Route path="/insights/:chave" element={<InsightDetalhe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe("InsightDetalhe", () => {
  beforeEach(() => {
    itens.mockReset();
    exportacao.mockReset();
    registrarAcompanhamento.mockReset();
    exportTableMock.mockClear();
  });

  it("lista os pacientes do insight com as métricas vindas da API", async () => {
    itens.mockResolvedValue({
      chave: "PlanoAcabando",
      total: 2,
      pagina: 1,
      tamanhoPagina: 20,
      itens: [paciente("Maria", 1), paciente("João", 2)],
    });

    renderizar("/insights/PlanoAcabando");

    expect(await screen.findByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("2 paciente(s) na fila")).toBeInTheDocument();
  });

  it("lê a página da URL, para o link ser compartilhável e sobreviver ao recarregamento", async () => {
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 45, pagina: 3, tamanhoPagina: 20, itens: [paciente("Maria", 1)],
    });

    renderizar("/insights/PlanoAcabando?pagina=3");

    await waitFor(() =>
      expect(itens).toHaveBeenCalledWith("PlanoAcabando", expect.anything(), 3, 20)
    );
  });

  // AC-14 — os dois grids existentes do sistema não resetam a página ao filtrar,
  // e o usuário cai numa lista vazia. Aqui não pode acontecer.
  it("volta para a página 1 quando o filtro de dias muda", async () => {
    const user = userEvent.setup();
    itens.mockResolvedValue({
      chave: "PacienteDormente", total: 60, pagina: 3, tamanhoPagina: 20, itens: [paciente("Maria", 4)],
    });

    renderizar("/insights/PacienteDormente?pagina=3&dias=14");
    await screen.findByText("Maria");

    await user.click(screen.getByRole("button", { name: "30 dias" }));

    await waitFor(() =>
      expect(screen.getByTestId("url").textContent).toContain("pagina=1")
    );
    expect(screen.getByTestId("url").textContent).toContain("dias=30");
  });

  it("avançar de página troca só a página e mantém o filtro", async () => {
    const user = userEvent.setup();
    itens.mockResolvedValue({
      chave: "PacienteDormente", total: 60, pagina: 1, tamanhoPagina: 20, itens: [paciente("Maria", 4)],
    });

    renderizar("/insights/PacienteDormente?dias=30");
    await screen.findByText("Maria");

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    const url = screen.getByTestId("url").textContent ?? "";
    expect(url).toContain("pagina=2");
    expect(url).toContain("dias=30");
  });

  it("mostra estado vazio em vez de tabela sem linha", async () => {
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 0, pagina: 1, tamanhoPagina: 20, itens: [],
    });

    renderizar("/insights/PlanoAcabando");

    expect(await screen.findByText(/nada pendente/i)).toBeInTheDocument();
  });

  it("chave inexistente na URL não quebra a tela", () => {
    renderizar("/insights/PlanoInventado");

    expect(screen.getByText("Insight não encontrado")).toBeInTheDocument();
    expect(itens).not.toHaveBeenCalled();
  });

  // AC-13 — o export leva o conjunto completo, não a página aberta.
  it("exporta o conjunto inteiro, não apenas a página corrente", async () => {
    const user = userEvent.setup();
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 45, pagina: 1, tamanhoPagina: 20, itens: [paciente("Maria", 1)],
    });
    exportacao.mockResolvedValue({
      chave: "PlanoAcabando", total: 45, pagina: 1, tamanhoPagina: 45,
      itens: Array.from({ length: 45 }, (_, i) => paciente(`P${i}`, 1)),
    });

    renderizar("/insights/PlanoAcabando");
    await screen.findByText("Maria");

    await user.click(screen.getByRole("button", { name: "CSV" }));

    await waitFor(() => expect(exportacao).toHaveBeenCalledOnce());
    expect(exportTableMock.mock.calls[0][0]).toHaveLength(45);
    expect(exportTableMock.mock.calls[0][3]).toBe("csv");
  });

  it("botões de exportação ficam desabilitados quando não há nada a exportar", async () => {
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 0, pagina: 1, tamanhoPagina: 20, itens: [],
    });

    renderizar("/insights/PlanoAcabando");
    await screen.findByText(/nada pendente/i);

    expect(screen.getByRole("button", { name: "CSV" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Excel" })).toBeDisabled();
  });

  it("oferece o link de WhatsApp com o telefone limpo e a mensagem do insight", async () => {
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 1, pagina: 1, tamanhoPagina: 20, itens: [paciente("Maria", 1)],
    });

    renderizar("/insights/PlanoAcabando");

    const link = await screen.findByRole("link", { name: /ligar para renovar/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("wa.me/5511999999999"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("registra o atendimento e fecha o modal", async () => {
    const user = userEvent.setup();
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 1, pagina: 1, tamanhoPagina: 20, itens: [paciente("Maria", 1)],
    });
    registrarAcompanhamento.mockResolvedValue({ id: "ok" });

    renderizar("/insights/PlanoAcabando");
    await screen.findByText("Maria");

    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByText("Registrar atendimento")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(registrarAcompanhamento).toHaveBeenCalledOnce());
    const [, requisicao] = registrarAcompanhamento.mock.calls[0];
    expect(requisicao).toMatchObject({ referenciaId: "ref-Maria", clienteId: "cli-Maria" });
  });

  it("descartar sem motivo não chega a chamar a API", async () => {
    const user = userEvent.setup();
    itens.mockResolvedValue({
      chave: "PlanoAcabando", total: 1, pagina: 1, tamanhoPagina: 20, itens: [paciente("Maria", 1)],
    });

    renderizar("/insights/PlanoAcabando");
    await screen.findByText("Maria");

    await user.click(screen.getByRole("button", { name: "Registrar" }));
    await user.click(screen.getByRole("radio", { name: /Descartar/i }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/motivo/i);
    expect(registrarAcompanhamento).not.toHaveBeenCalled();
  });
});
