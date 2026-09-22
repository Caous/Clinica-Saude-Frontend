import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import InsightCard from "./InsightCard";
import { INSIGHTS } from "../../config/insightsRegistry";
import { useInsightContadores } from "../../hooks/useInsights";
import type {
  InsightChave,
  InsightContadorResponse,
  InsightFiltro,
} from "../../services/model/insights.types";

/** Linhas de cards visíveis enquanto a faixa está recolhida. */
const LINHAS_VISIVEIS_RECOLHIDA = 3;

// Os mesmos pontos de quebra das classes do grid (`sm:grid-cols-2 xl:grid-cols-4`).
// Se um mudar, o outro muda junto — senão a faixa corta no meio de uma linha.
const LARGURA_SM = 640;
const LARGURA_XL = 1280;

function colunasPara(largura: number): number {
  if (largura >= LARGURA_XL) return 4;
  if (largura >= LARGURA_SM) return 2;
  return 1;
}

/**
 * Quantas colunas o grid está exibindo agora.
 *
 * Precisa ser medido, e não assumido: "3 linhas" são 12 cards no desktop, 6 no tablet e 3 no
 * celular. Cortar por um número fixo deixaria a faixa recolhida com altura diferente em cada
 * tela — em 4 colunas sobraria espaço, em 1 coluna a tela continuaria rolando.
 */
function useColunasDaFaixa(): number {
  const [colunas, setColunas] = useState(() =>
    colunasPara(typeof window === "undefined" ? LARGURA_XL : window.innerWidth)
  );

  useEffect(() => {
    const medir = () => setColunas(colunasPara(window.innerWidth));

    medir();
    window.addEventListener("resize", medir);

    return () => window.removeEventListener("resize", medir);
  }, []);

  return colunas;
}

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
 * Os contadores chegam em blocos, e cada bloco pinta os seus cards assim que responde: a
 * faixa não espera o conjunto inteiro para sair do esqueleto. É o meio-termo entre uma
 * chamada por card — que esgotava a partição de rate limit do endpoint (30 req/30s) logo no
 * primeiro F5 — e uma chamada única, que prendia as 33 contagens no tempo da mais lenta.
 *
 * Recolhida em três linhas por padrão. Com 33 cards a faixa ocupava nove linhas e empurrava o
 * grid de pacientes para fora da tela — quem entra em `/customer` costuma estar indo ao grid,
 * não à faixa.
 */
export default function InsightStrip({ chaves, filtro, titulo = "Insights" }: InsightStripProps) {
  // Busca sempre todas as chaves, inclusive as que estão recolhidas: são as mesmas requisições
  // em bloco de qualquer jeito, e assim expandir não custa nova espera.
  const { contadores, estados } = useInsightContadores(chaves, filtro);

  const colunas = useColunasDaFaixa();
  const [expandida, setExpandida] = useState(false);
  const idDoGrid = useId();

  if (chaves.length === 0) return null;

  const limite = colunas * LINHAS_VISIVEIS_RECOLHIDA;
  const temCardsEscondidos = chaves.length > limite;
  const visiveis = expandida || !temCardsEscondidos ? chaves : chaves.slice(0, limite);
  const escondidos = chaves.length - limite;

  return (
    <section aria-label={titulo ?? "Insights"} className="mb-6">
      {titulo && (
        <h2 className="mb-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          {titulo}
        </h2>
      )}

      <div id={idDoGrid} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visiveis.map((chave) => (
          <CardDoInsight
            key={chave}
            chave={chave}
            filtro={filtro}
            contador={contadores.get(chave)}
            carregando={estados.get(chave)?.carregando ?? true}
            erro={estados.get(chave)?.erro ?? false}
          />
        ))}
      </div>

      {temCardsEscondidos && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpandida((atual) => !atual)}
            aria-expanded={expandida}
            aria-controls={idDoGrid}
            className="rounded-lg px-3 py-1.5 text-theme-sm font-medium text-gray-600 transition-colors duration-200 ease-out hover:bg-gray-100 hover:text-gray-800 motion-reduce:transition-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {expandida ? "Mostrar menos" : `Mostrar mais ${escondidos}`}
          </button>
        </div>
      )}
    </section>
  );
}
