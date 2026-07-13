import { describe, it, expect } from "vitest";
import { calcularSessaoInfo } from "./calcularSessaoInfo";
import { ETipoCheckIn } from "../../../services/model/Enum/ETipoCheckIn";
import { ESessionStatus } from "../../../services/model/Enum/ESessionStatus";
import { OrderServiceSessionRequestDto } from "../../../services/model/Dto/Request/OrderServiceSessionRequestDto";

// Helper para montar uma sessão mínima da ordem, tipada.
function sessao(
    tipoCheckIn: ETipoCheckIn | undefined,
    statusSessao: ESessionStatus
): OrderServiceSessionRequestDto {
    return {
        clienteId: "c1",
        orderServiceId: "os1",
        dataSessao: "2026-07-10",
        horaSessao: "10:00:00",
        statusSessao,
        tipoCheckIn: tipoCheckIn as ETipoCheckIn,
    };
}

describe("calcularSessaoInfo", () => {
    // UT-1 (AC-1): fisio não é bloqueado por baixa Plano já existente.
    it("não conta baixa Plano para o contador do Fisioterapeuta", () => {
        const info = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [sessao(ETipoCheckIn.Plano, ESessionStatus.Realizada)],
            },
            ETipoCheckIn.Fisio
        );

        expect(info.sessoesRealizadas).toBe(0);
        expect(info.limiteAtingido).toBe(false);
    });

    // UT-2 (AC-2): fisio respeita seu próprio limite.
    it("conta baixa Fisio para o contador do Fisioterapeuta e atinge o limite", () => {
        const info = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [sessao(ETipoCheckIn.Fisio, ESessionStatus.Realizada)],
            },
            ETipoCheckIn.Fisio
        );

        expect(info.sessoesRealizadas).toBe(1);
        expect(info.limiteAtingido).toBe(true);
    });

    // UT-3 (AC-3): plano respeita seu próprio limite.
    it("conta baixa Plano para o contador do Administrativo e atinge o limite", () => {
        const info = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [sessao(ETipoCheckIn.Plano, ESessionStatus.Realizada)],
            },
            ETipoCheckIn.Plano
        );

        expect(info.sessoesRealizadas).toBe(1);
        expect(info.limiteAtingido).toBe(true);
    });

    // UT-4 (AC-1/AC-4): tipos não se misturam — várias baixas Plano não afetam Fisio.
    it("mantém contador Fisio zerado mesmo com múltiplas baixas Plano (Realizada e Faltou)", () => {
        const info = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [
                    sessao(ETipoCheckIn.Plano, ESessionStatus.Realizada),
                    sessao(ETipoCheckIn.Plano, ESessionStatus.Faltou),
                ],
            },
            ETipoCheckIn.Fisio
        );

        expect(info.sessoesRealizadas).toBe(0);
        expect(info.limiteAtingido).toBe(false);
    });

    // Legado (AC-1/AC-4): tipoCheckIn undefined conta como Plano, não como Fisio.
    it("trata tipoCheckIn undefined (legado) como Plano, sem vazar para o Fisio", () => {
        const infoFisio = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [sessao(undefined, ESessionStatus.Realizada)],
            },
            ETipoCheckIn.Fisio
        );
        expect(infoFisio.sessoesRealizadas).toBe(0);
        expect(infoFisio.limiteAtingido).toBe(false);

        const infoPlano = calcularSessaoInfo(
            {
                qtdSessaoTotal: 1,
                sessoes: [sessao(undefined, ESessionStatus.Realizada)],
            },
            ETipoCheckIn.Plano
        );
        expect(infoPlano.sessoesRealizadas).toBe(1);
        expect(infoPlano.limiteAtingido).toBe(true);
    });
});
