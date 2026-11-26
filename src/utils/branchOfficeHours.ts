/** Horário de funcionamento da filial (`HH:mm:ss` ou null, como devolvido pela API). */
export interface BranchOfficeHours {
  id?: string;
  horarioAbertura?: string | null;
  horarioFechamento?: string | null;
}

export interface CalendarSlotLimits {
  slotMinTime: string;
  slotMaxTime: string;
}

/** Filial sem horário configurado. */
const DEFAULT_BRANCH_HOURS = { opening: "08:00:00", closing: "22:00:00" } as const;
/** Agenda sem filial selecionada e nenhuma filial com horário. */
const DEFAULT_ALL_BRANCHES_HOURS = { opening: "06:00:00", closing: "23:00:00" } as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/** Normaliza `HH:mm` ou `HH:mm:ss` para `HH:mm:ss`; valor ausente ou inválido vira null. */
function parseTime(value: string | null | undefined): string | null {
  const match = typeof value === "string" ? TIME_PATTERN.exec(value.trim()) : null;
  return match ? `${match[1]}:${match[2]}:${match[3] ?? "00"}` : null;
}

/**
 * Limites de horário da agenda (`slotMinTime`/`slotMaxTime`) a partir dos dados das filiais.
 * Com filial selecionada: horário dela (padrão 08:00-22:00). Sem seleção: menor abertura e maior
 * fechamento entre as filiais (padrão 06:00-23:00). Função pura; HH:mm:ss compara lexicograficamente.
 */
export function computeCalendarSlotLimits(
  branches: ReadonlyArray<BranchOfficeHours> | undefined | null,
  selectedBranchId: string | undefined | null
): CalendarSlotLimits {
  const list = Array.isArray(branches) ? branches : [];

  if (selectedBranchId) {
    const selected = list.find((branch) => branch.id === selectedBranchId);
    return {
      slotMinTime: parseTime(selected?.horarioAbertura) ?? DEFAULT_BRANCH_HOURS.opening,
      slotMaxTime: parseTime(selected?.horarioFechamento) ?? DEFAULT_BRANCH_HOURS.closing,
    };
  }

  const openings = list.map((branch) => parseTime(branch.horarioAbertura)).filter((time): time is string => time !== null);
  const closings = list.map((branch) => parseTime(branch.horarioFechamento)).filter((time): time is string => time !== null);
  return {
    slotMinTime: openings.length > 0 ? openings.reduce((a, b) => (a < b ? a : b)) : DEFAULT_ALL_BRANCHES_HOURS.opening,
    slotMaxTime: closings.length > 0 ? closings.reduce((a, b) => (a > b ? a : b)) : DEFAULT_ALL_BRANCHES_HOURS.closing,
  };
}

/** `HH:mm:ss` da API para o valor de `<input type="time">` (`HH:mm`); ausente vira "". */
export function toTimeInputValue(value: string | null | undefined): string {
  return parseTime(value)?.slice(0, 5) ?? "";
}

/** Valor de `<input type="time">` para `HH:mm:ss` da API; vazio ou inválido vira null. */
export function toApiTime(value: string | null | undefined): string | null {
  return parseTime(value);
}

/** Abertura deve ser anterior ao fechamento quando ambos informados (mesma regra do backend). */
export function isOpeningBeforeClosing(opening: string | null | undefined, closing: string | null | undefined): boolean {
  const from = parseTime(opening);
  const to = parseTime(closing);
  return from === null || to === null || from < to;
}

/** Texto de exibição do horário da filial no grid. */
export function formatBranchHours(opening: string | null | undefined, closing: string | null | undefined): string {
  const from = toTimeInputValue(opening);
  const to = toTimeInputValue(closing);
  return from && to ? `${from} – ${to}` : "—";
}
