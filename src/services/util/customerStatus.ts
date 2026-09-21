/**
 * Status do paciente (`CustomerModel.Status`).
 *
 * Os rótulos estavam repetidos em cadeias de ternários espalhadas pelas telas de paciente.
 * Um lugar só evita o que já aconteceu antes: a tela de filtro e a de detalhe discordarem
 * sobre o nome do mesmo status.
 */
export const STATUS_DO_PACIENTE: Readonly<Record<number, string>> = {
  0: "Novo Paciente",
  1: "Aguardando Avaliação",
  2: "Em Avaliação",
  3: "Plano de Tratamento",
  4: "Em Atendimento",
  5: "Faltou Atendimento",
  6: "Tratamento Concluído",
  7: "Alta",
  8: "Cancelado",
  9: "Inativo",
};

/** Rótulo do status. Valor desconhecido ou ausente não inventa nome. */
export function rotuloDeStatusDoPaciente(status?: number | null): string {
  if (status === null || status === undefined) return "";

  return STATUS_DO_PACIENTE[status] ?? `Desconhecido (${status})`;
}

/** Opções do filtro de status, com "Todos" à frente. */
export const OPCOES_DE_STATUS_DO_PACIENTE: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  ...Object.entries(STATUS_DO_PACIENTE).map(([valor, rotulo]) => ({
    value: valor,
    label: rotulo,
  })),
];
