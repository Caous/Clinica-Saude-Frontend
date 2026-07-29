/**
 * Resposta dos endpoints Reativar* (restauração de registro excluído logicamente).
 *
 * A restauração e a gravação do log de auditoria falham de forma independente —
 * o registro pode voltar sem que a ação fique registrada em Logs. Quando isso
 * acontece, `aviso` traz a mensagem a exibir ao usuário.
 */
export interface RestoreResponseDto {
    restaurado: boolean;
    auditoriaRegistrada: boolean;
    aviso?: string | null;
}
