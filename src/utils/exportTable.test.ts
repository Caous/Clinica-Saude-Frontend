import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { montarCsv, exportTable, type ColunaExport } from "./exportTable";

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

interface Linha {
  nome: string;
  valor: number;
  obs?: string | null;
}

const colunas: ColunaExport<Linha>[] = [
  { titulo: "Nome", valor: (l) => l.nome },
  { titulo: "Valor", valor: (l) => l.valor },
  { titulo: "Observação", valor: (l) => l.obs ?? "" },
];

const linhas: Linha[] = [
  { nome: "Maria Zoé", valor: 300.5, obs: "ligou" },
  { nome: "João", valor: 0, obs: null },
];

describe("montarCsv", () => {
  // AC-13
  it("usa ponto-e-vírgula como separador, que é o que o Excel pt-BR espera", () => {
    expect(montarCsv(linhas, colunas).split("\n")[0]).toBe('"Nome";"Valor";"Observação"');
  });

  it("emite uma linha por registro, além do cabeçalho", () => {
    expect(montarCsv(linhas, colunas).split("\n")).toHaveLength(3);
  });

  it("escapa aspas duplicando-as, em vez de trocar por apóstrofo", () => {
    // Duplicar é o escape do padrão CSV; trocar por apóstrofo alteraria o dado exportado.
    expect(montarCsv([{ nome: 'Maria "Bibi"', valor: 1 }], colunas)).toContain('"Maria ""Bibi"""');
  });

  it("mantém quebra de linha dentro da célula protegida por aspas", () => {
    expect(montarCsv([{ nome: "linha1\nlinha2", valor: 1 }], colunas)).toContain('"linha1\nlinha2"');
  });

  it("não escreve null nem undefined como texto", () => {
    const csv = montarCsv([{ nome: "X", valor: 0, obs: null }], colunas);

    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  it("não embute BOM: marca de arquivo é responsabilidade do download, não do conteúdo", () => {
    expect(montarCsv(linhas, colunas).charCodeAt(0)).not.toBe(0xfeff);
  });

  it("gera só o cabeçalho quando não há linha", () => {
    expect(montarCsv([], colunas).split("\n")).toHaveLength(1);
  });
});

describe("exportTable", () => {
  // jsdom nao implementa Blob.text(); capturamos as partes na construcao do Blob.
  let partesDoBlob: string[] = [];
  const BlobOriginal = globalThis.Blob;

  beforeEach(() => {
    partesDoBlob = [];
    vi.stubGlobal(
      "Blob",
      class BlobEspiao extends BlobOriginal {
        constructor(partes: BlobPart[], opcoes?: BlobPropertyBag) {
          super(partes, opcoes);
          partesDoBlob.push(...partes.map(String));
        }
      }
    );
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("baixa um .csv com o nome informado e libera a URL do blob", () => {
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const nomeArquivo = exportTable(linhas, colunas, "plano-acabando", "csv");

    expect(clique).toHaveBeenCalledOnce();
    expect(nomeArquivo).toMatch(/^plano-acabando-\d{4}-\d{2}-\d{2}\.csv$/);
    // Sem revoke a cada export a aba acumula blobs até o usuário recarregar.
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("prefixa o arquivo com BOM, senão o Excel corrompe os acentos", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportTable(linhas, colunas, "plano-acabando", "csv");

    const conteudo = partesDoBlob.join("");
    expect(conteudo.charCodeAt(0)).toBe(0xfeff);
    expect(conteudo).toContain("Observação");
  });

  it("delega o xlsx ao SheetJS", async () => {
    const XLSX = await import("xlsx");

    exportTable(linhas, colunas, "plano-acabando", "xlsx");

    expect(XLSX.writeFile).toHaveBeenCalledOnce();
    // Os títulos das colunas viram as chaves da planilha, para o cabeçalho sair legível.
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      { Nome: "Maria Zoé", Valor: 300.5, "Observação": "ligou" },
      { Nome: "João", Valor: 0, "Observação": "" },
    ]);
  });

  it("recusa exportar lista vazia, em vez de baixar arquivo só com cabeçalho", () => {
    expect(() => exportTable([], colunas, "plano-acabando", "csv")).toThrow(/nenhuma linha/i);
  });
});
