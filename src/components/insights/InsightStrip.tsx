import { useNavigate } from "react-router";
import InsightCard from "./InsightCard";
import { INSIGHTS } from "../../config/insightsRegistry";
import { useInsightContador } from "../../hooks/useInsights";
import type { InsightChave, InsightFiltro } from "../../services/model/insights.types";

interface InsightStripProps {
  chaves: InsightChave[];
  filtro?: InsightFiltro;
  /** Título da faixa. Passe `null` para exibir só os cards. */
  titulo?: string | null;
}

/**
 * Um card por insight. Isolado em componente próprio para que o hook seja chamado
 * uma vez por card — chamar hooks em laço dentro do pai quebraria a ordem das Hooks
 * se a lista de chaves mudasse.
 */
function CardDoInsight({ chave, filtro }: { chave: InsightChave; filtro?: InsightFiltro }) {
  const navigate = useNavigate();
  const definicao = INSIGHTS[chave];
  const filtroEfetivo = { dias: definicao?.diasPadrao, ...filtro };
  const { data, isLoading, isError } = useInsightContador(chave, filtroEfetivo);

  if (!definicao) return null;

  const parametros = new URLSearchParams();
  if (filtroEfetivo.filialId) parametros.append("filialId", filtroEfetivo.filialId);
  if (filtroEfetivo.dias !== undefined) parametros.append("dias", String(filtroEfetivo.dias));
  const querystring = parametros.toString();

  return (
    <InsightCard
      titulo={definicao.titulo}
      descricao={definicao.descricao}
      total={data?.total ?? 0}
      severidade={data?.severidade}
      carregando={isLoading}
      erro={isError}
      onSelecionar={() =>
        navigate(`/insights/${chave}${querystring ? `?${querystring}` : ""}`)
      }
    />
  );
}

/**
 * Faixa de insights.
 *
 * Cada card dispara o próprio contador. São chamadas separadas de propósito: o backend tem
 * partição de rate limit própria (30 req/30s) e cada contador resolve em COUNT, sem
 * materializar linha.
 */
export default function InsightStrip({ chaves, filtro, titulo = "Insights" }: InsightStripProps) {
  if (chaves.length === 0) return null;

  return (
    <section aria-label={titulo ?? "Insights"} className="mb-6">
      {titulo && (
        <h2 className="mb-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          {titulo}
        </h2>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chaves.map((chave) => (
          <CardDoInsight key={chave} chave={chave} filtro={filtro} />
        ))}
      </div>
    </section>
  );
}
