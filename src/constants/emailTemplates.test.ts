import { describe, it, expect } from "vitest";
import { getTemplateById, getTemplateList } from "./emailTemplates";

const ACME = { name: "Acme Saúde", logoDarkUrl: "/images/logo/acme-dark.svg", supportEmail: "contato@acme.example" };
const TEMPLATE_IDS = ["newsletter", "promocional", "transacional"];

describe("templates de e-mail com marca configurável (UT-5)", () => {
  it.each(TEMPLATE_IDS)("%s: corpo e assunto contêm a marca informada", (id) => {
    const template = getTemplateById(id, ACME);

    expect(template).toBeDefined();
    expect(template!.html).toContain("Acme Saúde");
    expect(template!.subject).toContain("Acme Saúde");
  });

  it.each(TEMPLATE_IDS)("%s: usa logo e e-mail de suporte da marca", (id) => {
    const html = getTemplateById(id, ACME)!.html;

    expect(html).toContain("/images/logo/acme-dark.svg");
    expect(html).toContain("contato@acme.example");
  });

  it.each(TEMPLATE_IDS)("%s: nenhum vestígio da marca antiga", (id) => {
    const template = getTemplateById(id, ACME)!;
    const oldBrand = new RegExp("bar" + "ros", "i");

    expect(oldBrand.test(template.html)).toBe(false);
    expect(oldBrand.test(template.subject)).toBe(false);
  });

  it("escapa HTML no nome da marca", () => {
    const html = getTemplateById("newsletter", { ...ACME, name: "A<b>&Co" })!.html;
    expect(html).toContain("A&lt;b&gt;&amp;Co");
  });

  it.each(TEMPLATE_IDS)("%s: defesa em profundidade escapa aspas e < em logo e e-mail", (id) => {
    const html = getTemplateById(id, {
      name: "Acme",
      logoDarkUrl: '/x.svg" onerror="alert(1)',
      supportEmail: 'a"<script>@b.c',
    })!.html;

    expect(html).not.toContain('onerror="alert(1)');
    expect(html).not.toContain("<script>@b.c");
    expect(html).toContain("&quot; onerror=&quot;alert(1)");
    expect(html).toContain("a&quot;&lt;script&gt;@b.c");
  });

  it("retorna undefined para template inexistente", () => {
    expect(getTemplateById("nao-existe", ACME)).toBeUndefined();
  });

  it("lista os templates disponíveis sem depender da marca", () => {
    expect(getTemplateList().map((t) => t.value)).toEqual(TEMPLATE_IDS);
  });
});
