import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Branding } from "../config/branding";
import { FALLBACK_BRANDING } from "../config/branding";
import UserDropdown from "../components/header/UserDropdown";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import { useBrandIconUrl } from "./useBrandIconUrl";

const state = vi.hoisted(() => ({ brand: {} as Branding, theme: "light" as "light" | "dark" }));

vi.mock("./useBranding", () => ({ useBranding: () => state.brand }));
vi.mock("../context/ThemeContext", () => ({ useTheme: () => ({ theme: state.theme, toggleTheme: vi.fn() }) }));
vi.mock("../icons", () => ({ PencilIcon: () => <span /> }));
vi.mock("react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

function IconProbe() {
  return <span data-testid="icon">{useBrandIconUrl()}</span>;
}

const brandWith = (overrides: Partial<Branding>): Branding => ({
  ...FALLBACK_BRANDING,
  name: "Acme",
  logoIconUrl: "/claro.svg",
  ...overrides,
});

describe("useBrandIconUrl (UT-3)", () => {
  beforeEach(() => {
    state.theme = "light";
  });

  it("tema escuro com logoIconDarkUrl vazio usa logoIconUrl", () => {
    state.theme = "dark";
    state.brand = brandWith({ logoIconDarkUrl: "" });
    render(<IconProbe />);
    expect(screen.getByTestId("icon").textContent).toBe("/claro.svg");
  });

  it("tema escuro com logoIconDarkUrl usa o ícone escuro", () => {
    state.theme = "dark";
    state.brand = brandWith({ logoIconDarkUrl: "/escuro.svg" });
    render(<IconProbe />);
    expect(screen.getByTestId("icon").textContent).toBe("/escuro.svg");
  });

  it("tema claro usa logoIconUrl", () => {
    state.brand = brandWith({ logoIconDarkUrl: "/escuro.svg" });
    render(<IconProbe />);
    expect(screen.getByTestId("icon").textContent).toBe("/claro.svg");
  });
});

describe("consumidores do ícone do tema (AC-1)", () => {
  beforeEach(() => {
    state.theme = "dark";
    state.brand = brandWith({ logoIconDarkUrl: "/escuro.svg" });
  });

  it("UserDropdown exibe o ícone do tema ativo", () => {
    render(<UserDropdown />);
    expect(screen.getByAltText("Acme").getAttribute("src")).toBe("/escuro.svg");
  });

  it("UserMetaCard exibe o ícone do tema ativo", () => {
    render(<UserMetaCard userData={null} employeeData={null} />);
    expect(screen.getByAltText("Acme").getAttribute("src")).toBe("/escuro.svg");
  });
});

describe("AppSidebar usa o ícone do tema (AC-1)", () => {
  const source = readFileSync(resolve(__dirname, "../layout/AppSidebar.tsx"), "utf8");

  it("obtém o ícone via useBrandIconUrl e o aplica no src, sem logo-icon.svg literal", () => {
    expect(source).toMatch(/const brandIconUrl = useBrandIconUrl\(\)/);
    expect(source).toMatch(/src=\{brandIconUrl\}/);
    expect(source).not.toContain("logo-icon.svg");
  });
});
