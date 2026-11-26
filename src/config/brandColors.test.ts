import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FALLBACK_BRANDING, deriveBrandShades } from "./branding";
import { getBrandColors } from "./brandColors";

describe("getBrandColors (UT-5)", () => {
  it("devolve primária e secundária do branding", () => {
    expect(getBrandColors({ primaryColor: "#112233", secondaryColor: "#445566" })).toEqual({
      primary: "#112233",
      secondary: "#445566",
    });
  });

  it("secundária padrão (= fundo escuro) usa o tom 300 da primária", () => {
    const shade300 = deriveBrandShades("#112233")!["300"];
    expect(getBrandColors({ primaryColor: "#112233", secondaryColor: FALLBACK_BRANDING.secondaryColor }).secondary).toBe(shade300);
  });

  it("primária padrão com secundária padrão: 2ª série = tom 300 da primária padrão", () => {
    const { primary, secondary } = getBrandColors(FALLBACK_BRANDING);
    expect(primary).toBe(FALLBACK_BRANDING.primaryColor);
    expect(secondary).toBe(deriveBrandShades(FALLBACK_BRANDING.primaryColor)!["300"]);
    expect(secondary).not.toBe("#101828");
  });
});

const SRC = resolve(__dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(SRC, relativePath), "utf8");
const HARDCODED_BLUES = /#465fff|#9cb9ff/i;

describe("sem azul fixo nos gráficos e no slider (UT-5, UT-6)", () => {
  it.each([
    "components/charts/bar/BarChartOne.tsx",
    "components/charts/line/LineChartOne.tsx",
    "components/ecommerce/MonthlyTarget.tsx",
    "components/ecommerce/StatisticsChart.tsx",
    "components/ecommerce/CountryMap.tsx",
  ])("%s não contém literais #465fff/#9cb9ff", (file) => {
    expect(read(file)).not.toMatch(HARDCODED_BLUES);
  });

  it("index.css: slider usa var(--color-brand-500), sem literal fora das definições de tema", () => {
    const css = read("index.css");
    const outsideThemeTokens = css
      .split(/\r?\n/)
      .filter((line) => !/^\s*--color-brand-\d+\s*:/.test(line))
      .join("\n");
    expect(outsideThemeTokens).not.toMatch(HARDCODED_BLUES);
    expect(css).toMatch(/box-shadow:\s*-10px 0 0 var\(--color-brand-500\)/);
  });
});
