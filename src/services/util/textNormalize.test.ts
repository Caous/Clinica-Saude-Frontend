import { describe, it, expect } from "vitest";
import { removerAcentos, contemTextoNormalizado } from "./textNormalize";

// T-1 (AC-3) — util de normalização remove diacríticos e caixa.
describe("removerAcentos", () => {
  it("remove acentos e converte para minúsculas", () => {
    expect(removerAcentos("Brígida")).toBe("brigida");
  });

  it("normaliza diferentes diacríticos (ã, ç, é, ô, ü)", () => {
    expect(removerAcentos("João Conceição Ávila Ôtimo Über")).toBe(
      "joao conceicao avila otimo uber"
    );
  });

  it("mantém texto sem acento inalterado (apenas minúsculo)", () => {
    expect(removerAcentos("Della Rocca")).toBe("della rocca");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(removerAcentos("")).toBe("");
  });
});

// UT-1..UT-5 (AC-1..AC-4) — lógica de filterOption: substring insensível a acento e caixa.
describe("contemTextoNormalizado (lógica de filterOption)", () => {
  const label = "Brígida Della Rocca Costa";

  it("UT-1 (AC-1): acha nome acentuado digitando sem acento", () => {
    expect(contemTextoNormalizado(label, "Brigida")).toBe(true);
  });

  it("UT-2 (AC-2): acha com o acento digitado (não regride)", () => {
    expect(contemTextoNormalizado(label, "Brígida")).toBe(true);
  });

  it("UT-3 (AC-3): é case + diacritic insensitive", () => {
    expect(contemTextoNormalizado("Brígida", "BRIGIDA")).toBe(true);
  });

  it("UT-4 (AC-4): casa substring no meio do nome", () => {
    expect(contemTextoNormalizado(label, "rocca")).toBe(true);
  });

  it("UT-5 (AC-1): termo sem correspondência não casa", () => {
    expect(contemTextoNormalizado("João Silva", "Brigida")).toBe(false);
  });
});
