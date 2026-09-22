import { describe, it, expect } from "vitest";
import {
  OPCOES_DE_STATUS_DO_PACIENTE,
  STATUS_DO_PACIENTE,
  rotuloDeStatusDoPaciente,
} from "./customerStatus";

describe("status do paciente", () => {
  it("cobre os dez status do enum do backend", () => {
    expect(Object.keys(STATUS_DO_PACIENTE)).toHaveLength(10);
  });

  it.each([
    [0, "Novo Paciente"],
    [3, "Plano de Tratamento"],
    [7, "Alta"],
    [9, "Inativo"],
  ])("traduz o status %i", (status, rotulo) => {
    expect(rotuloDeStatusDoPaciente(status)).toBe(rotulo);
  });

  it("status ausente não vira rótulo", () => {
    expect(rotuloDeStatusDoPaciente(null)).toBe("");
    expect(rotuloDeStatusDoPaciente(undefined)).toBe("");
  });

  /**
   * Status novo no backend sem rótulo no front não pode virar "Novo Paciente" por descuido:
   * é assim que um relatório passa a contar errado sem ninguém perceber.
   */
  it("status desconhecido se declara desconhecido", () => {
    expect(rotuloDeStatusDoPaciente(42)).toBe("Desconhecido (42)");
  });

  it("as opções de filtro começam em Todos e listam os dez status", () => {
    expect(OPCOES_DE_STATUS_DO_PACIENTE[0]).toEqual({ value: "", label: "Todos" });
    expect(OPCOES_DE_STATUS_DO_PACIENTE).toHaveLength(11);
    expect(OPCOES_DE_STATUS_DO_PACIENTE[1]).toEqual({ value: "0", label: "Novo Paciente" });
  });
});
