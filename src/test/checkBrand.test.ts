import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(__dirname, "../../scripts/check-brand.mjs");
// Nomes montados em runtime: este arquivo não pode conter os nomes reais (a guarda varre src/).
const UNIT_NAMES = [["PAU", "LISTA"], ["MOO", "CA"], ["IPI", "RANGA"], ["P", "AZ"], ["ALPHA", "VILLE"], ["MARKET", "PLACE"]].map(
  (parts) => parts.join("")
);

let root: string;

function runGuard(dir: string) {
  return spawnSync(process.execPath, [SCRIPT, dir], { encoding: "utf8" });
}

function writeSource(relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content);
}

describe("check-brand: nomes de unidade em src/ (UT-15)", () => {
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "check-brand-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it.each(UNIT_NAMES)("%s em src/: exit 1 apontando o arquivo", (name) => {
    writeSource("src/pages/Agenda.tsx", `const a = "x";\nif (nome.includes("${name}")) {}\n`);

    const result = runGuard(root);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("src/pages/Agenda.tsx:2");
  });

  it("detecta o nome sem diferenciar maiúsculas", () => {
    writeSource("src/a.ts", `// ${UNIT_NAMES[0].toLowerCase()}\n`);
    expect(runGuard(root).status).toBe(1);
  });

  it("src/ sem nomes de unidade: exit 0", () => {
    writeSource("src/pages/Agenda.tsx", "const horario = filial.horarioAbertura;\n");
    const result = runGuard(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("0 ocorrencias");
  });

  it("palavra que apenas contém o nome curto de unidade (ex.: capaz) não é ocorrência", () => {
    writeSource("src/a.ts", "const capaz = true;\n");
    expect(runGuard(root).status).toBe(0);
  });

  it("nomes de unidade fora de src/ não são varridos", () => {
    writeSource("docs/notas.md", `${UNIT_NAMES[0]}\n`);
    expect(runGuard(root).status).toBe(0);
  });

  it("marca antiga continua detectada em qualquer lugar", () => {
    writeSource("docs/notas.md", `${["bar", "ros"].join("")}\n`);
    expect(runGuard(root).status).toBe(1);
  });

  it("a Intranet está limpa (FT-5)", () => {
    const repoRoot = resolve(__dirname, "../..");
    expect(() => execFileSync(process.execPath, [SCRIPT, repoRoot], { encoding: "utf8", stdio: "pipe" })).not.toThrow();
  });
});
