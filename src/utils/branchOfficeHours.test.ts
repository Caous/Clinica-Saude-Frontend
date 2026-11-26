import { describe, it, expect } from "vitest";
import {
  computeCalendarSlotLimits,
  formatBranchHours,
  isOpeningBeforeClosing,
  toApiTime,
  toTimeInputValue,
} from "./branchOfficeHours";

const branch = (id: string, horarioAbertura?: string | null, horarioFechamento?: string | null) => ({
  id,
  horarioAbertura,
  horarioFechamento,
});

describe("computeCalendarSlotLimits: filial selecionada (UT-10, UT-11)", () => {
  it("usa abertura e fechamento da filial (06:00:00 / 23:00:00)", () => {
    const limits = computeCalendarSlotLimits([branch("a", "06:00:00", "23:00:00")], "a");
    expect(limits).toEqual({ slotMinTime: "06:00:00", slotMaxTime: "23:00:00" });
  });

  it("filial com campos nulos usa 08:00-22:00", () => {
    expect(computeCalendarSlotLimits([branch("a", null, null)], "a")).toEqual({
      slotMinTime: "08:00:00",
      slotMaxTime: "22:00:00",
    });
  });

  it("filial com campos ausentes usa 08:00-22:00", () => {
    expect(computeCalendarSlotLimits([branch("a")], "a")).toEqual({
      slotMinTime: "08:00:00",
      slotMaxTime: "22:00:00",
    });
  });

  it("filial selecionada não encontrada (dados ainda carregando) usa 08:00-22:00", () => {
    expect(computeCalendarSlotLimits(undefined, "x")).toEqual({ slotMinTime: "08:00:00", slotMaxTime: "22:00:00" });
    expect(computeCalendarSlotLimits([branch("a", "06:00:00", "23:00:00")], "x")).toEqual({
      slotMinTime: "08:00:00",
      slotMaxTime: "22:00:00",
    });
  });

  it("horário em HH:mm é normalizado para HH:mm:ss; valor inválido cai no padrão", () => {
    expect(computeCalendarSlotLimits([branch("a", "07:30", "lixo")], "a")).toEqual({
      slotMinTime: "07:30:00",
      slotMaxTime: "22:00:00",
    });
  });
});

describe("computeCalendarSlotLimits: sem filial selecionada (UT-12)", () => {
  const filiais = [
    branch("a", "08:00:00", "22:00:00"),
    branch("b", "07:00:00", "21:00:00"),
    branch("c", "06:00:00", "23:00:00"),
    branch("d", null, null),
  ];

  it.each([undefined, null, ""])("seleção %j usa menor abertura e maior fechamento", (selected) => {
    expect(computeCalendarSlotLimits(filiais, selected)).toEqual({ slotMinTime: "06:00:00", slotMaxTime: "23:00:00" });
  });

  it("horários mais restritos que o padrão amplo são respeitados", () => {
    const limits = computeCalendarSlotLimits([branch("a", "09:00:00", "18:00:00"), branch("b", "08:00:00", "20:00:00")], "");
    expect(limits).toEqual({ slotMinTime: "08:00:00", slotMaxTime: "20:00:00" });
  });

  it("nenhuma filial com horário, lista vazia ou indefinida usa 06:00-23:00", () => {
    const expected = { slotMinTime: "06:00:00", slotMaxTime: "23:00:00" };
    expect(computeCalendarSlotLimits([branch("a", null, null)], "")).toEqual(expected);
    expect(computeCalendarSlotLimits([], "")).toEqual(expected);
    expect(computeCalendarSlotLimits(undefined, "")).toEqual(expected);
  });

  it("só abertura informada: fechamento usa padrão amplo", () => {
    expect(computeCalendarSlotLimits([branch("a", "07:00:00", null)], "")).toEqual({
      slotMinTime: "07:00:00",
      slotMaxTime: "23:00:00",
    });
  });
});

describe("isOpeningBeforeClosing", () => {
  it("rejeita abertura igual ou posterior ao fechamento", () => {
    expect(isOpeningBeforeClosing("22:00:00", "08:00:00")).toBe(false);
    expect(isOpeningBeforeClosing("08:00", "08:00")).toBe(false);
  });

  it("aceita abertura anterior ou campo não informado", () => {
    expect(isOpeningBeforeClosing("08:00:00", "22:00:00")).toBe(true);
    expect(isOpeningBeforeClosing("22:00:00", null)).toBe(true);
    expect(isOpeningBeforeClosing(undefined, undefined)).toBe(true);
  });
});

describe("conversão de horário do formulário", () => {
  it("toTimeInputValue corta os segundos e trata vazio", () => {
    expect(toTimeInputValue("06:00:00")).toBe("06:00");
    expect(toTimeInputValue(null)).toBe("");
    expect(toTimeInputValue(undefined)).toBe("");
  });

  it("toApiTime gera HH:mm:ss ou null", () => {
    expect(toApiTime("06:00")).toBe("06:00:00");
    expect(toApiTime("")).toBeNull();
    expect(toApiTime(undefined)).toBeNull();
  });

  it("formatBranchHours exibe o intervalo ou travessão", () => {
    expect(formatBranchHours("06:00:00", "23:00:00")).toBe("06:00 – 23:00");
    expect(formatBranchHours(null, null)).toBe("—");
  });
});
