import { describe, it, expect } from "vitest";
import {
  compararPorNome,
  estaDesativado,
  ordenarPorNomeComDesativadosNoFim,
} from "./ordenacaoDeGrid";

interface Registro {
  nome?: string | null;
  dataDesativacao?: string | null;
}

const nomes = (registros: Registro[]) => registros.map((registro) => registro.nome);

const ordenar = (registros: Registro[]) =>
  ordenarPorNomeComDesativadosNoFim(registros, (registro) => registro.nome);

describe("ordenação dos grids", () => {
  it("ordena por nome", () => {
    const resultado = ordenar([{ nome: "Carlos" }, { nome: "Ana" }, { nome: "Bruno" }]);

    expect(nomes(resultado)).toEqual(["Ana", "Bruno", "Carlos"]);
  });

  /**
   * Com localeCompare cru, "Ângela" cai depois de "Bruno" e quem procura conclui que o
   * cadastro sumiu.
   */
  it("ignora acento ao ordenar", () => {
    const resultado = ordenar([{ nome: "Bruno" }, { nome: "Ângela" }, { nome: "Alice" }]);

    expect(nomes(resultado)).toEqual(["Alice", "Ângela", "Bruno"]);
  });

  it("ignora caixa", () => {
    const resultado = ordenar([{ nome: "bruno" }, { nome: "Ana" }]);

    expect(nomes(resultado)).toEqual(["Ana", "bruno"]);
  });

  it("joga os desativados para o fim, mesmo com nome menor", () => {
    const resultado = ordenar([
      { nome: "Zelia" },
      { nome: "Ana", dataDesativacao: "2026-01-10T00:00:00" },
      { nome: "Bruno" },
    ]);

    expect(nomes(resultado)).toEqual(["Bruno", "Zelia", "Ana"]);
  });

  it("os desativados também ficam em ordem entre si", () => {
    const resultado = ordenar([
      { nome: "Zelia", dataDesativacao: "2026-01-10T00:00:00" },
      { nome: "Ana", dataDesativacao: "2026-01-10T00:00:00" },
      { nome: "Bruno" },
    ]);

    expect(nomes(resultado)).toEqual(["Bruno", "Ana", "Zelia"]);
  });

  it("nome vazio vai para o fim do grupo, não para o topo", () => {
    const resultado = ordenar([{ nome: "" }, { nome: "Ana" }, { nome: null }]);

    expect(resultado[0].nome).toBe("Ana");
  });

  it("não modifica a lista original", () => {
    const original: Registro[] = [{ nome: "Carlos" }, { nome: "Ana" }];

    ordenar(original);

    expect(nomes(original)).toEqual(["Carlos", "Ana"]);
  });

  it("aguenta lista ausente", () => {
    expect(ordenarPorNomeComDesativadosNoFim(null, (r: Registro) => r.nome)).toEqual([]);
    expect(ordenarPorNomeComDesativadosNoFim(undefined, (r: Registro) => r.nome)).toEqual([]);
  });

  it("aceita um critério próprio dentro de cada grupo", () => {
    const resultado = ordenarPorNomeComDesativadosNoFim(
      [
        { nome: "Ana", dataDesativacao: null },
        { nome: "Bruno" },
      ],
      (registro: Registro) => registro.nome,
      (a, b) => (b.nome ?? "").localeCompare(a.nome ?? "")
    );

    expect(nomes(resultado)).toEqual(["Bruno", "Ana"]);
  });

  it("estaDesativado só é verdadeiro com data preenchida", () => {
    expect(estaDesativado({ dataDesativacao: "2026-01-10T00:00:00" })).toBe(true);
    expect(estaDesativado({ dataDesativacao: null })).toBe(false);
    expect(estaDesativado({})).toBe(false);
  });

  it("compararPorNome trata ausência sem quebrar", () => {
    expect(compararPorNome(null, null)).toBe(0);
    expect(compararPorNome("Ana", undefined)).toBeLessThan(0);
    expect(compararPorNome(undefined, "Ana")).toBeGreaterThan(0);
  });
});
