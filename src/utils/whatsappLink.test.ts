import { describe, it, expect } from "vitest";
import { montarLinkWhatsapp, MENSAGEM_PADRAO_WHATSAPP } from "./whatsappLink";

describe("montarLinkWhatsapp", () => {
  it("remove máscara e prefixa o DDI do Brasil", () => {
    expect(montarLinkWhatsapp("(11) 99999-9999")).toContain("https://wa.me/5511999999999?");
  });

  it("remove TODAS as ocorrências de cada separador", () => {
    // O código anterior encadeava .replace com string, que troca só a primeira ocorrência:
    // um telefone com mais de um espaço saía com espaço no meio e o link quebrava.
    expect(montarLinkWhatsapp("(11) 9 9999 9999")).toContain("wa.me/5511999999999?");
  });

  it("não duplica o DDI quando o telefone já vem com 55", () => {
    expect(montarLinkWhatsapp("5511999999999")).toContain("wa.me/5511999999999?");
  });

  it("aceita telefone já com + na frente", () => {
    expect(montarLinkWhatsapp("+55 (11) 99999-9999")).toContain("wa.me/5511999999999?");
  });

  it("usa a mensagem padrão codificada para URL", () => {
    const link = montarLinkWhatsapp("(11) 99999-9999");

    expect(link).toContain(`text=${encodeURIComponent(MENSAGEM_PADRAO_WHATSAPP)}`);
    expect(link).not.toContain(" ");
  });

  it("aceita mensagem personalizada", () => {
    const link = montarLinkWhatsapp("(11) 99999-9999", "Seu plano está acabando!");

    expect(link).toContain(encodeURIComponent("Seu plano está acabando!"));
  });

  it("devolve null quando não há telefone, para a UI não renderizar link morto", () => {
    expect(montarLinkWhatsapp(undefined)).toBeNull();
    expect(montarLinkWhatsapp(null)).toBeNull();
    expect(montarLinkWhatsapp("")).toBeNull();
    expect(montarLinkWhatsapp("   ")).toBeNull();
  });

  it("devolve null quando o telefone não tem dígitos suficientes", () => {
    // Menos que DDD + 8 dígitos não é telefone: abrir o WhatsApp nesse número só gera erro.
    expect(montarLinkWhatsapp("1199")).toBeNull();
  });
});
