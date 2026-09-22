import { describe, it, expect } from "vitest";
import { canExportCustomers, USER_ROLES } from "./rolePermissions";

/**
 * Quem pode baixar a base de pacientes.
 *
 * O arquivo leva nome, CPF, telefone, e-mail, endereço e patologia de toda a base e, uma vez
 * salvo, sai do alcance do sistema. Afrouxar esta regra sem querer é o tipo de mudança que
 * ninguém percebe na revisão — por isso cada perfil está afirmado um a um.
 */
describe("permissão de exportar pacientes", () => {
  it("Administrador exporta", () => {
    expect(canExportCustomers(USER_ROLES.ADMINISTRADOR)).toBe(true);
  });

  it.each([
    USER_ROLES.ADMINISTRATIVO,
    USER_ROLES.COMERCIAL,
    USER_ROLES.FISIOTERAPEUTA,
    USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    USER_ROLES.FINANCEIRO,
    USER_ROLES.FUNCIONARIO,
    USER_ROLES.CLIENTE,
  ])("%s não exporta", (perfil) => {
    expect(canExportCustomers(perfil)).toBe(false);
  });

  it("usuário sem perfil não exporta", () => {
    expect(canExportCustomers(null)).toBe(false);
    expect(canExportCustomers([])).toBe(false);
  });

  it("basta ter Administrador entre vários perfis", () => {
    expect(canExportCustomers([USER_ROLES.FISIOTERAPEUTA, USER_ROLES.ADMINISTRADOR])).toBe(true);
  });
});
