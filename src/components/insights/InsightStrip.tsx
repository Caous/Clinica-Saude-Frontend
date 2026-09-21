import { useNavigate } from "react-router";
import InsightCard from "./InsightCard";
import { INSIGHTS } from "../../config/insightsRegistry";
import { useInsightContadores } from "../../hooks/useInsights";
import type {
  InsightChave,
  InsightContadorResponse,
  InsightFiltro,
} from "../../services/model/insights.types";

interface InsightStripProps {
  chaves: InsightChave[];
  filtro?: InsightFiltro;
  /** Título da faixa. Passe `null` para exibir só os cards. */
  titulo?: string | null;
}

interface CardDoInsightProps {
  chave: InsightChave;
  filtro?: InsightFiltro;
  contador?: InsightContadorResponse;
  carregando: boolean;
  erro: boolean;
}

/**
 * Um card. Só apresentação: o número já chegou pelo contador em lote da faixa.
 */
function CardDoInsight({ chave, filtro, contador, carregando, erro }: CardDoInsightProps) {
  const navigate = useNavigate();
  const definicao = INSIGHTS[chave];

  if (!definicao) return null;

  // A janela em dias continua indo na URL do detalhe: é lá que o usuário pode ajustá-la.
  const parametros = new URLSearchParams();
  if (filtro?.filialId) parametros.append("filialId", filtro.filialId);

  const dias = filtro?.dias ?? definicao.diasPadrao;
  if (dias !== undefined) parametros.append("dias", String(dias));

  const querystring = parametros.toString();

  return (
    <InsightCard
      titulo={definicao.titulo}
      descricao={definicao.descricao}
      total={contador?.total ?? 0}
      severidade={contador?.severidade}
      carregando={carregando}
      erro={erro}
      onSelecionar={() =>
        navigate(`/insights/${chave}${querystring ? `?${querystring}` : ""}`)
      }
    />
  );
}

/**
 * Faixa de insights.
 *
 * Todos os contadores vêm de uma requisição só. A tela de Pacientes exibe 33 cards e uma
 * chamada por card esgotava a partição de rate limit do endpoint (30 req/30s) no primeiro
 * recarregamento — o usuário via a faixa inteira em erro depois de um F5.
 */
export default function InsightStrip({ chaves, filtro, titulo = "Insights" }: InsightStripProps) {
  const { data: contadores, isLoading, isError } = useInsightContadores(chaves, filtro);

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
          <CardDoInsight
            key={chave}
            chave={chave}
            filtro={filtro}
            contador={contadores?.get(chave)}
            carregando={isLoading}
            erro={isError}
          />
        ))}
      </div>
    </section>
  );
}
