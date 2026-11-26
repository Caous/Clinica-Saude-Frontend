import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC_DIR = resolve(__dirname, "../../public");

// Caminhos do Branding do produto (appsettings.json do backend, AC-6).
const PRODUCT_BRANDING_ASSETS = [
  "/images/brand/cuidaflux/logo-horizontal-claro.png",
  "/images/brand/cuidaflux/logo-horizontal-escuro.png",
  "/images/brand/cuidaflux/logo-icone-claro.svg",
  "/images/brand/cuidaflux/logo-icone-escuro.svg",
  "/images/brand/cuidaflux/logo-icone-pequeno-claro.svg",
];

describe("ativos referenciados pelo Branding do produto (UT-13)", () => {
  it.each(PRODUCT_BRANDING_ASSETS)("%s existe em public/", (assetPath) => {
    expect(existsSync(resolve(PUBLIC_DIR, `.${assetPath}`))).toBe(true);
  });
});
