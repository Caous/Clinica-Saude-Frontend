/**
 * scheduleRecurrence - Núcleo puro de cálculo de datas recorrentes de agendamentos.
 *
 * Fonte única da regra de recorrência usada tanto pelo hook `useScheduleRecurrence`
 * quanto pela página `Calendar`. Sem dependências de React ou I/O — determinístico e
 * testável (relógio injetável via `now`).
 *
 * Regras (ver PBI-20260710-recorrencia-data-a-partir-de):
 * - A data-base do cálculo é `startFrom` ("A partir de"), inclusive.
 * - Nenhuma data anterior a `startFrom` é gerada.
 * - A primeira ocorrência é o primeiro dia-da-semana selecionado >= `startFrom`.
 * - O intervalo (semanal/quinzenal/mensal) é aplicado em blocos de semanas.
 * - A validação de horário passado só vale quando `startFrom` é o próprio dia atual.
 */

export type RecurrenceType = "semanal" | "quinzenal" | "mensal";

/** Intervalo, em semanas, entre blocos de ocorrências para cada tipo de recorrência. */
export const RECURRENCE_WEEK_INTERVAL: Record<RecurrenceType, number> = {
  semanal: 1,
  quinzenal: 2,
  mensal: 4,
};

/** Mapa nome do dia (pt-BR) -> índice de `Date.getDay()` (Domingo = 0). */
export const WEEKDAY_TO_NUMBER: Record<string, number> = {
  Domingo: 0,
  "Segunda-Feira": 1,
  "Terça-Feira": 2,
  "Quarta-Feira": 3,
  "Quinta-Feira": 4,
  "Sexta-Feira": 5,
  Sábado: 6,
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Data-base padrão da recorrência: o dia seguinte a `now`, à meia-noite.
 * Ex.: hoje = 10/07 -> retorna 11/07 00:00.
 */
export function getDefaultStartFrom(now: Date = new Date()): Date {
  const start = startOfDay(now);
  start.setDate(start.getDate() + 1);
  return start;
}

export interface RecurrenceDatesParams {
  /** Dias da semana selecionados (nomes pt-BR, ver `WEEKDAY_TO_NUMBER`). */
  daysOfWeek: string[];
  /** Quantidade de ocorrências desejada. */
  count: number;
  /** Data-base "A partir de" (inclusive). */
  startFrom: Date;
  /** Tipo de recorrência; padrão "semanal". */
  recurrenceType?: RecurrenceType;
  /** Horário "HH:mm" — usado só para descartar horário passado quando `startFrom` é hoje. */
  time?: string;
  /** Relógio injetável (para testes); padrão `new Date()`. */
  now?: Date;
}

/**
 * Calcula as datas (à meia-noite) da recorrência a partir de `startFrom`.
 */
export function calculateRecurrenceDates(params: RecurrenceDatesParams): Date[] {
  const {
    daysOfWeek,
    count,
    startFrom,
    recurrenceType = "semanal",
    time,
    now = new Date(),
  } = params;

  if (!daysOfWeek || daysOfWeek.length === 0 || count <= 0) {
    return [];
  }

  const dayNumbers = daysOfWeek
    .map((day) => WEEKDAY_TO_NUMBER[day])
    .filter((day): day is number => day !== undefined)
    .sort((a, b) => a - b);

  if (dayNumbers.length === 0) {
    return [];
  }

  const base = startOfDay(startFrom);
  const weekInterval = RECURRENCE_WEEK_INTERVAL[recurrenceType] ?? 1;

  // Primeira ocorrência = primeiro dia-da-semana selecionado >= `base`.
  // O intervalo (quinzenal/mensal) é contado A PARTIR DELA — não de uma grade
  // alinhada à semana do `startFrom`. Caso contrário, quando o dia selecionado
  // cai antes do `startFrom` dentro da mesma semana, o bloco seguinte saltaria
  // um intervalo inteiro (ex.: quinzenal a partir de ter/14 pularia 20 e iria p/ 27).
  const firstOccurrence = new Date(base);
  while (!dayNumbers.includes(firstOccurrence.getDay())) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1);
  }

  // Âncora = domingo da semana que contém a PRIMEIRA ocorrência (getDay: Domingo = 0).
  // Blocos de ocorrências caem em `âncora + k * intervalo` semanas.
  const anchorSunday = new Date(firstOccurrence);
  anchorSunday.setDate(firstOccurrence.getDate() - firstOccurrence.getDay());

  // Validação de horário passado só se aplica quando "a partir de" é o dia atual.
  const startFromIsToday = isSameDay(base, now);

  const dates: Date[] = [];
  let week = 0;
  const maxWeeks = 520; // ~10 anos: guarda contra laço infinito.

  while (dates.length < count && week < maxWeeks) {
    for (const dayNumber of dayNumbers) {
      if (dates.length >= count) {
        break;
      }

      const candidate = new Date(anchorSunday);
      candidate.setDate(anchorSunday.getDate() + week * 7 + dayNumber);

      // AC-5: nunca gerar data anterior a "a partir de".
      if (candidate < base) {
        continue;
      }

      // Só descarta horário passado quando startFrom é hoje e o candidato é hoje.
      if (startFromIsToday && time && isSameDay(candidate, now)) {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduleTime = new Date(candidate);
        scheduleTime.setHours(hours, minutes, 0, 0);
        if (scheduleTime <= now) {
          continue;
        }
      }

      dates.push(candidate);
    }

    week += weekInterval;
  }

  return dates;
}
