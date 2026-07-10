/**
 * Testes unitários da recorrência de agendamentos.
 *
 * Rastreabilidade (PBI-20260710-recorrencia-data-a-partir-de):
 * - UT-1 (AC-2): quinzenal sábado a partir de data futura -> [18/07, 01/08, 15/08]
 * - UT-3 (AC-4): "a partir de" cai em dia não selecionado -> primeira ocorrência = 18/07
 * - UT-4 (AC-5): nenhuma data antes de "a partir de"
 * - UT-5 (AC-1): default é o dia seguinte (hoje=10/07 -> 11/07)
 * - UT-6 (AC-3): default preserva comportamento -> [11/07, 25/07]
 */

import { describe, it, expect } from "vitest";
import {
  calculateRecurrenceDates,
  getDefaultStartFrom,
} from "./scheduleRecurrence";

/** Helper: data local à meia-noite (mês 1-based para legibilidade). */
function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** Helper: formata Date -> "YYYY-MM-DD" local para comparação estável. */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("calculateRecurrenceDates", () => {
  it("UT-1 (AC-2): quinzenal aos sábados a partir de 18/07 gera 18/07, 01/08, 15/08", () => {
    const result = calculateRecurrenceDates({
      daysOfWeek: ["Sábado"],
      count: 3,
      recurrenceType: "quinzenal",
      startFrom: date(2026, 7, 18),
    });

    expect(result.map(ymd)).toEqual(["2026-07-18", "2026-08-01", "2026-08-15"]);
  });

  it("UT-3 (AC-4): 'a partir de' em dia não selecionado usa o primeiro sábado >= 15/07 (18/07)", () => {
    const result = calculateRecurrenceDates({
      daysOfWeek: ["Sábado"],
      count: 1,
      recurrenceType: "quinzenal",
      startFrom: date(2026, 7, 15), // quarta-feira
    });

    expect(result.map(ymd)).toEqual(["2026-07-18"]);
  });

  it("UT-4 (AC-5): nenhuma data anterior a 'a partir de' (18/07)", () => {
    const startFrom = date(2026, 7, 18);
    const result = calculateRecurrenceDates({
      daysOfWeek: ["Sábado"],
      count: 2,
      recurrenceType: "quinzenal",
      startFrom,
    });

    expect(result.length).toBe(2);
    for (const d of result) {
      expect(d.getTime()).toBeGreaterThanOrEqual(startFrom.getTime());
    }
  });

  it("UT-6 (AC-3): default (11/07) preserva o comportamento quinzenal -> [11/07, 25/07]", () => {
    const result = calculateRecurrenceDates({
      daysOfWeek: ["Sábado"],
      count: 2,
      recurrenceType: "quinzenal",
      startFrom: date(2026, 7, 11),
    });

    expect(result.map(ymd)).toEqual(["2026-07-11", "2026-07-25"]);
  });

  it("descarta horário passado apenas quando 'a partir de' é o dia atual", () => {
    const hoje = new Date(2026, 6, 11, 10, 0, 0, 0); // sábado 11/07 10:00
    const result = calculateRecurrenceDates({
      daysOfWeek: ["Sábado"],
      count: 1,
      recurrenceType: "quinzenal",
      startFrom: date(2026, 7, 11),
      time: "09:00", // já passou às 10:00 -> pula 11/07
      now: hoje,
    });

    expect(result.map(ymd)).toEqual(["2026-07-25"]);
  });
});

describe("getDefaultStartFrom", () => {
  it("UT-5 (AC-1): default é o dia seguinte ao atual (hoje=10/07 -> 11/07)", () => {
    const hoje = new Date(2026, 6, 10, 15, 30, 0, 0); // 10/07/2026 15:30
    const result = getDefaultStartFrom(hoje);

    expect(ymd(result)).toBe("2026-07-11");
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});
