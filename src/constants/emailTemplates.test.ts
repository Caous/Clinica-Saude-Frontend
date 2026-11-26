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

describe("card Precisa de ajuda? do transacional", () => {
  it("com phone mostra o item 📱 com o telefone escapado", () => {
    const html = getTemplateById("transacional", { ...ACME, phone: "1<b>" })!.html;
    expect(html).toContain("Precisa de ajuda?");
    expect(html).toContain("<span>📱</span>");
    expect(html).toContain("<span>1&lt;b&gt;</span>");
    expect(html).not.toContain("<span>1<b></span>");
  });

  it("sem phone não renderiza o item 📱", () => {
    const html = getTemplateById("transacional", { ...ACME, phone: "" })!.html;
    expect(html).toContain("Precisa de ajuda?");
    expect(html).not.toContain("📱");
  });
});

describe("rodapé de e-mail com telefone e endereço do branding (UT-7, UT-8)", () => {
  const FAKE_PHONE = "(11) 1234" + "-5678";
  const FAKE_WHATSAPP = "(11) 98765" + "-4321";
  const PLACEHOLDER_ADDRESS = "Endereço da " + "clínica";

  it.each(TEMPLATE_IDS)("%s: sem phone/address omite as linhas e não traz placeholders", (id) => {
    const html = getTemplateById(id, { ...ACME, phone: "", address: "" })!.html;

    expect(html).not.toContain(FAKE_PHONE);
    expect(html).not.toContain(FAKE_WHATSAPP);
    expect(html).not.toContain(PLACEHOLDER_ADDRESS);
    // "📞" só pode restar no título fixo do card de ajuda do transacional.
    const withoutHelpCardTitle = html.replace("<span>📞</span>", "");
    expect(withoutHelpCardTitle).not.toContain("📞");
    expect(html).not.toContain('footer-contact">📍');
  });

  it.each(TEMPLATE_IDS)("%s: brand sem os campos opcionais também omite", (id) => {
    const html = getTemplateById(id, ACME)!.html;
    expect(html).not.toContain(FAKE_PHONE);
    expect(html).not.toContain('footer-contact">📍');
  });

  it.each(TEMPLATE_IDS)("%s: com phone/address mostra as linhas", (id) => {
    const html = getTemplateById(id, { ...ACME, phone: "(11) 4000-0000", address: "Rua Exemplo, 100" })!.html;

    expect(html).toContain("📞 (11) 4000-0000");
    expect(html).toContain("📍 Rua Exemplo, 100");
  });

  it.each(TEMPLATE_IDS)("%s: escapa HTML em phone e address", (id) => {
    const html = getTemplateById(id, { ...ACME, phone: "1<b>", address: "A & B <i>" })!.html;

    expect(html).toContain("📞 1&lt;b&gt;");
    expect(html).toContain("📍 A &amp; B &lt;i&gt;");
  });
});

describe("logo e fonte dos templates (UT-11, AC-5)", () => {
  const PNG_BRAND = { ...ACME, logoDarkUrl: "/images/brand/cuidaflux/logo-horizontal-escuro.png" };

  it.each(TEMPLATE_IDS)("%s: cabeçalho usa o logo .png do Branding com URL absoluta (caminho relativo)", (id) => {
    const html = getTemplateById(id, PNG_BRAND)!.html;
    expect(html).toContain(`<img src="${window.location.origin}/images/brand/cuidaflux/logo-horizontal-escuro.png"`);
  });

  it.each(TEMPLATE_IDS)("%s: URL absoluta do logo é mantida", (id) => {
    const html = getTemplateById(id, { ...ACME, logoDarkUrl: "https://cdn.example.com/logo.png" })!.html;
    expect(html).toContain('<img src="https://cdn.example.com/logo.png"');
  });

  it.each(TEMPLATE_IDS)("%s: não depende de web font (fonte de sistema)", (id) => {
    const html = getTemplateById(id, PNG_BRAND)!.html;
    expect(html).not.toMatch(/@font-face/i);
    expect(html).not.toMatch(/@import\s+url/i);
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  });
});
