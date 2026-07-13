import { ETipoCheckIn } from "../../../services/model/Enum/ETipoCheckIn";
import { ESessionStatus } from "../../../services/model/Enum/ESessionStatus";
import { OrderServiceResponseDto } from "../../../services/model/Dto/Response/OrderServiceResponseDto";

export interface SessaoInfo {
    sessoesRealizadas: number;
    sessaoTotal: number;
    limiteAtingido: boolean;
    percentual: number;
}

/**
 * Normaliza o tipo de check-in de uma sessão. Registros legados (sem
 * `tipoCheckIn` gravado) são tratados como Plano — a baixa administrativa —
 * garantindo que nunca vazem para o contador do Fisioterapeuta.
 */
function tipoCheckInDaSessao(tipoCheckIn: ETipoCheckIn | undefined): ETipoCheckIn {
    return tipoCheckIn === undefined ? ETipoCheckIn.Plano : tipoCheckIn;
}

/**
 * Calcula o consumo de sessões de uma ordem de serviço para um tipo de
 * check-in específico (o tipo do usuário logado). Fisio e Plano têm limites
 * independentes: só contam para o contador as sessões do MESMO tipo, com
 * status Realizada ou Faltou, comparadas contra `qtdSessaoTotal` da ordem.
 */
export function calcularSessaoInfo(
    ordem: Pick<OrderServiceResponseDto, "qtdSessaoTotal" | "sessoes"> | null | undefined,
    tipoCheckInFixo: ETipoCheckIn
): SessaoInfo {
    if (!ordem) {
        return {
            sessoesRealizadas: 0,
            sessaoTotal: 0,
            limiteAtingido: false,
            percentual: 0,
        };
    }

    const sessaoTotal = ordem.qtdSessaoTotal ?? 0;
    const sessoesRealizadas = (ordem.sessoes ?? [])
        .filter(
            (s) =>
                tipoCheckInDaSessao(s.tipoCheckIn) === tipoCheckInFixo &&
                (s.statusSessao === ESessionStatus.Realizada ||
                    s.statusSessao === ESessionStatus.Faltou)
        )
        .length;

    const limiteAtingido = sessoesRealizadas >= sessaoTotal;
    const percentual = sessaoTotal > 0 ? (sessoesRealizadas / sessaoTotal) * 100 : 0;

    return {
        sessoesRealizadas,
        sessaoTotal,
        limiteAtingido,
        percentual,
    };
}
