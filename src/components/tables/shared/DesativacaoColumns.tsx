import { TableCell } from "../../ui/table";
import { formatDate } from "../../helper/formatUtils";
import {
    canManageDeletedRecords,
    getUserRoleFromToken,
} from "../../../services/util/rolePermissions";

/**
 * Colunas de auditoria de exclusão lógica, compartilhadas pelos grids de
 * Pacientes, Funcionários, Unidades, Categorias e Sub-Categorias.
 *
 * Só o perfil Administrador enxerga registros excluídos e pode restaurá-los.
 * O backend aplica a mesma regra a partir do JWT — o gate daqui é só de UI.
 */

/** Campos de auditoria presentes em todo registro que herda de BaseResponseDto. */
export interface RegistroDesativavel {
    dataDesativacao?: string;
    usrDesativacao?: string;
    usrDescricaoDesativacao?: string;
}

/** Retorna true se o usuário logado pode ver e restaurar registros excluídos. */
export const useCanManageDeletedRecords = (): boolean => {
    const userRoles = getUserRoleFromToken(localStorage.getItem("token"));
    return canManageDeletedRecords(userRoles);
};

/**
 * Nome de quem desativou o registro.
 *
 * Prioriza `usrDescricaoDesativacao`, gravado no momento da exclusão. Registros
 * anteriores à correção do bug de autoria não têm nem o nome nem o Guid — daí o
 * "Não registrado" em vez de exibir um identificador cru.
 */
export const formatDesativadoPor = (registro: RegistroDesativavel): string => {
    if (registro.usrDescricaoDesativacao) return registro.usrDescricaoDesativacao;
    if (registro.usrDesativacao) return registro.usrDesativacao;
    return "Não registrado";
};

const headerClass =
    "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";
const bodyClass =
    "px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400";

/** Cabeçalhos "Data de Desativação" e "Desativado por". */
export function DesativacaoHeaderCells() {
    return (
        <>
            <TableCell isHeader className={headerClass}>
                Data de Desativação
            </TableCell>
            <TableCell isHeader className={headerClass}>
                Desativado por
            </TableCell>
        </>
    );
}

/** Células correspondentes, com travessão nos registros ativos. */
export function DesativacaoBodyCells({ registro }: { registro: RegistroDesativavel }) {
    const desativado = !!registro.dataDesativacao;

    return (
        <>
            <TableCell className={bodyClass}>
                {desativado ? formatDate(registro.dataDesativacao) : "—"}
            </TableCell>
            <TableCell className={bodyClass}>
                {desativado ? formatDesativadoPor(registro) : "—"}
            </TableCell>
        </>
    );
}

/** Botão de restauração — renderizar apenas em registros com dataDesativacao. */
export function RestoreButton({
    onClick,
    disabled = false,
}: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title="Restaurar registro"
            aria-label="Restaurar registro"
            className="p-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300 bg-white text-sm font-medium text-emerald-700 shadow-theme-xs transition hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-800 dark:text-emerald-400 dark:hover:bg-white/[0.03] dark:hover:text-emerald-200"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-6 h-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
            </svg>
        </button>
    );
}

/** Modal de confirmação da restauração, no mesmo formato do modal de exclusão. */
export function RestoreConfirmContent({
    titulo,
    mensagem,
    onCancel,
    onConfirm,
    isPending = false,
}: {
    titulo: string;
    mensagem: string;
    onCancel: () => void;
    onConfirm: (e: React.FormEvent) => void;
    isPending?: boolean;
}) {
    return (
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-center text-gray-800 dark:text-white/90">
                    {titulo}
                </h4>
            </div>
            <form className="flex flex-col" onSubmit={onConfirm}>
                <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
                    <h5 className="mb-5 text-lg font-medium text-center text-gray-800 dark:text-white/90 lg:mb-6">
                        {mensagem}
                    </h5>
                </div>
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-3 text-sm inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-emerald-600 text-white shadow-theme-xs hover:bg-emerald-700 disabled:bg-emerald-300 px-4 py-3 text-sm inline-flex items-center justify-center gap-2 rounded-lg transition"
                    >
                        Restaurar
                    </button>
                </div>
            </form>
        </div>
    );
}
