import { ReactNode } from "react";
import { InsightSeveridade } from "../../services/model/insights.types";

interface InsightCardProps {
  titulo: string;
  descricao: string;
  total: number;
  severidade?: InsightSeveridade;
  carregando?: boolean;
  erro?: boolean;
  icone?: ReactNode;
  onSelecionar: () => void;
}

/**
 * Paleta por severidade, montada sobre os tokens de `index.css`.
 * Sem hex solto: trocar a identidade visual é mexer nos tokens, não nos componentes.
 */
const CORES: Record<InsightSeveridade, { destaque: string; marcador: string }> = {
  [InsightSeveridade.Informativo]: {
    destaque: "text-gray-800 dark:text-white/90",
    marcador: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  },
  [InsightSeveridade.Atencao]: {
    destaque: "text-warning-600 dark:text-warning-400",
    marcador: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  },
  [InsightSeveridade.Critico]: {
    destaque: "text-error-600 dark:text-error-400",
    marcador: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  },
};

/**
 * Rótulo anunciado pelo leitor de tela.
 *
 * Com erro o card mostra "—", e anunciar "0" faria o usuário entender que não há nada
 * pendente quando na verdade o dado não chegou.
 */
function rotuloAcessivel(
  titulo: string,
  descricao: string,
  total: number,
  carregando: boolean,
  erro: boolean
): string {
  if (carregando) return `${titulo}, carregando`;
  if (erro) return `${titulo}, não foi possível carregar`;
  return `${titulo}: ${total}. ${descricao}`;
}

/**
 * Contador clicável de um insight.
 *
 * É um `<button>`, não uma `div` com onClick: o card navega, então precisa ser alcançável
 * por teclado, acionável por Enter e Espaço e anunciado como ação pelo leitor de tela.
 */
export default function InsightCard({
  titulo,
  descricao,
  total,
  severidade = InsightSeveridade.Informativo,
  carregando = false,
  erro = false,
  icone,
  onSelecionar,
}: InsightCardProps) {
  const cores = CORES[severidade] ?? CORES[InsightSeveridade.Informativo];
  const vazio = !carregando && !erro && total === 0;

  return (
    <button
      type="button"
      onClick={onSelecionar}
      disabled={carregando || erro}
      title={descricao}
      aria-label={rotuloAcessivel(titulo, descricao, total, carregando, erro)}
      className={[
        "group flex w-full flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left md:p-6",
        "dark:border-gray-800 dark:bg-white/[0.03]",
        "transition-colors duration-200 ease-out motion-reduce:transition-none",
        "focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/50",
        "disabled:cursor-default disabled:opacity-70",
        "enabled:cursor-pointer enabled:hover:border-brand-300 dark:enabled:hover:border-brand-700",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cores.marcador}`}>
          {icone ?? <span aria-hidden="true" className="text-theme-sm font-bold">!</span>}
        </span>

        {vazio && (
          <span className="text-theme-xs text-gray-400 dark:text-gray-500">nada pendente</span>
        )}
      </span>

      <span className="mt-5 flex items-end justify-between gap-3">
        <span className="text-theme-sm text-gray-500 dark:text-gray-400">{titulo}</span>

        {carregando ? (
          // Esqueleto em vez de "..." para a faixa não pular de altura quando o número chega.
          <span
            aria-hidden="true"
            className="h-7 w-10 animate-pulse rounded-md bg-gray-100 motion-reduce:animate-none dark:bg-gray-800"
          />
        ) : (
          <span className={`text-title-sm font-bold ${erro ? "text-gray-400" : cores.destaque}`}>
            {erro ? "—" : total}
          </span>
        )}
      </span>

      {erro && (
        <span className="mt-2 text-theme-xs text-error-500">
          Não foi possível carregar agora.
        </span>
      )}
    </button>
  );
}
