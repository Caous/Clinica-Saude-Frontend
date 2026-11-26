import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { ApexOptions } from "apexcharts";
import { FALLBACK_BRANDING, deriveBrandShades } from "../../config/branding";
import BarChartOne from "./bar/BarChartOne";
import LineChartOne from "./line/LineChartOne";
import MonthlyTarget from "../ecommerce/MonthlyTarget";
import StatisticsChart from "../ecommerce/StatisticsChart";
import CountryMap from "../ecommerce/CountryMap";

const captured = vi.hoisted(() => ({ options: undefined as ApexOptions | undefined, map: undefined as Record<string, unknown> | undefined }));

const brandState = vi.hoisted(() => ({ secondaryColor: "#445566" }));

vi.mock("react-apexcharts", () => ({
  default: (props: { options: ApexOptions }) => {
    captured.options = props.options;
    return null;
  },
}));
vi.mock("@react-jvectormap/core", () => ({
  VectorMap: (props: Record<string, unknown>) => {
    captured.map = props;
    return null;
  },
}));
vi.mock("@react-jvectormap/world", () => ({ worldMill: {} }));
vi.mock("../../hooks/useBranding", () => ({
  useBranding: () => ({ ...FALLBACK_BRANDING, primaryColor: "#112233", secondaryColor: brandState.secondaryColor }),
}));
vi.mock("../../icons", () => ({ MoreDotIcon: () => null }));
vi.mock("../common/ChartTab", () => ({ default: () => null }));

describe("gráficos e mapa usam as cores do branding (UT-5)", () => {
  beforeEach(() => {
    captured.options = undefined;
    captured.map = undefined;
    brandState.secondaryColor = "#445566";
  });

  it("BarChartOne: série na primária", () => {
    render(<BarChartOne />);
    expect(captured.options?.colors).toEqual(["#112233"]);
  });

  it("LineChartOne: primária e secundária na 2ª série", () => {
    render(<LineChartOne />);
    expect(captured.options?.colors).toEqual(["#112233", "#445566"]);
  });

  it("StatisticsChart: primária e secundária na 2ª série", () => {
    render(<StatisticsChart series={[{ name: "A", data: [1, 2] }]} />);
    expect(captured.options?.colors).toEqual(["#112233", "#445566"]);
  });

  it.each([
    ["LineChartOne", () => render(<LineChartOne />)],
    ["StatisticsChart", () => render(<StatisticsChart series={[{ name: "A", data: [1, 2] }]} />)],
  ])("%s: secundária padrão usa o tom 300 da primária (visível no escuro)", (_name, renderChart) => {
    brandState.secondaryColor = FALLBACK_BRANDING.secondaryColor;
    renderChart();
    expect(captured.options?.colors).toEqual(["#112233", deriveBrandShades("#112233")!["300"]]);
  });

  it("MonthlyTarget: série e preenchimento na primária", () => {
    render(<MonthlyTarget />);
    expect(captured.options?.colors).toEqual(["#112233"]);
    expect(captured.options?.fill?.colors).toEqual(["#112233"]);
  });

  it("CountryMap: marcadores e regiões na primária", () => {
    render(<CountryMap />);
    const serialized = JSON.stringify(captured.map);
    expect(serialized).toContain("#112233");
    expect(serialized.toLowerCase()).not.toContain("#465fff");
  });
});
