import { describe, it, expect } from "vitest";
import { buildDispatchBody } from "./emailVariables";

describe("buildDispatchBody (envio de e-mail com marca)", () => {
  const corpo = "<h1>{{titulo}}</h1><p>{{empresa}}</p><p>{{nome_cliente}}</p>";

  it("substitui {{empresa}} pelo nome da marca configurada (Acme) e {{titulo}} pelo assunto", () => {
    const body = buildDispatchBody({ corpo, titulo: "Olá", templateVariables: {}, brandName: "Acme" });
    expect(body).toContain("<p>Acme</p>");
    expect(body).toContain("<h1>Olá</h1>");
  });

  it("mantém variáveis do cliente para o backend preencher", () => {
    const body = buildDispatchBody({ corpo, titulo: "x", templateVariables: {}, brandName: "Acme" });
    expect(body).toContain("{{nome_cliente}}");
  });

  it("variável explícita do template tem precedência sobre a marca", () => {
    const body = buildDispatchBody({ corpo, titulo: "x", templateVariables: { empresa: "Outra" }, brandName: "Acme" });
    expect(body).toContain("<p>Outra</p>");
  });
});
