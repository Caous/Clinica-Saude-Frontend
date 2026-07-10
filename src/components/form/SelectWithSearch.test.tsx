import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectWithSearch, { Option } from "./SelectWithSearch";

const opcoes: Option[] = [
  { value: "id-brigida-123", label: "Brígida Della Rocca Costa" },
  { value: "id-joao-456", label: "João Silva" },
];

describe("SelectWithSearch", () => {
  it("AC-1: digitar 'Brigida' (sem acento) exibe 'Brígida Della Rocca Costa'", async () => {
    const user = userEvent.setup();
    render(
      <SelectWithSearch options={opcoes} onChange={vi.fn()} placeholder="Cliente" />
    );

    // O inputId gerado pelo componente é `select-<placeholder>` (aqui, select-cliente).
    const input = document.getElementById("select-cliente") as HTMLElement;
    await user.click(input);
    await user.type(input, "Brigida");

    expect(
      await screen.findByText("Brígida Della Rocca Costa")
    ).toBeInTheDocument();
    // UT-5 no nível de integração: opção sem correspondência não aparece.
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });

  it("T-4 (AC-4): value (id) permanece intacto ao selecionar buscando sem acento", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectWithSearch options={opcoes} onChange={onChange} placeholder="Cliente" />
    );

    // O inputId gerado pelo componente é `select-<placeholder>` (aqui, select-cliente).
    const input = document.getElementById("select-cliente") as HTMLElement;
    await user.click(input);
    await user.type(input, "brigida");
    await user.click(await screen.findByText("Brígida Della Rocca Costa"));

    // A normalização atua apenas sobre o label; o value/id não é normalizado.
    expect(onChange).toHaveBeenCalledWith("id-brigida-123");
  });
});
