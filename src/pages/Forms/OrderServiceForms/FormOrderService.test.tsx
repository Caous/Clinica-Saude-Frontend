import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FormOrderService from "./FormOrderService";

// PBI-20260710 — campo "Data do plano" (competência) na modal de tratamento.
// Rastreabilidade:
//   AC-1 (default = hoje) -> UT-5
//   AC-5 (obrigatório bloqueia submit sem chamar API) -> UT-4

// Mocks das dependências de rede: o foco é a UI/validação do formulário,
// não a infraestrutura de serviços.
const createOrderServiceAsync = vi.fn();
const updateOrderServiceAsync = vi.fn();

vi.mock("../../../services/service/OrderServiceService", () => ({
  createOrderServiceAsync: (...args: unknown[]) =>
    createOrderServiceAsync(...args),
  updateOrderServiceAsync: (...args: unknown[]) =>
    updateOrderServiceAsync(...args),
}));

vi.mock("../../../services/service/CustomerService", () => ({
  getAllCustomersSummaryAsync: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../services/service/SubCategoryService", () => ({
  getAllSubCategoriasAsync: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../services/service/ScheduleService", () => ({
  postScheduleAsync: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../../services/service/EmployeeService", () => ({
  default: { getAll: vi.fn().mockResolvedValue([]) },
  EmployeeService: { getAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../../../services/service/BranchOfficeService", () => ({
  BranchOfficeService: { getAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../../../services/service/FinancialTransactionService", () => ({
  FinancialTransactionService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
}));

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FormOrderService />
    </QueryClientProvider>
  );
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

describe("FormOrderService — campo Data do plano", () => {
  beforeEach(() => {
    createOrderServiceAsync.mockReset();
    updateOrderServiceAsync.mockReset();
  });

  it("UT-5 (AC-1): ao abrir a modal, o campo 'Data do plano' vem preenchido com a data atual", async () => {
    renderForm();

    const campoDataPlano = (await screen.findByLabelText(
      /data do plano/i
    )) as HTMLInputElement;

    expect(campoDataPlano).toBeInTheDocument();
    expect(campoDataPlano).toHaveValue(todayIso());
  });

  it("UT-4 (AC-5): com 'Data do plano' vazia, o submit é bloqueado e a API não é chamada", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();

    const campoDataPlano = (await screen.findByLabelText(
      /data do plano/i
    )) as HTMLInputElement;

    // Esvazia o campo obrigatório.
    await user.clear(campoDataPlano);
    expect(campoDataPlano).toHaveValue("");

    // Dispara o submit diretamente no form para exercitar a validação em JS
    // (independente da validação nativa do navegador).
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(createOrderServiceAsync).not.toHaveBeenCalled();
    });

    // Mensagem de validação obrigatória é exibida (toast).
    expect(
      await screen.findByText(/informe a data do plano/i)
    ).toBeInTheDocument();
  });
});
