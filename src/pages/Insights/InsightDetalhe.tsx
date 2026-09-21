import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Toaster, toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import InsightFollowUpModal from "../../components/insights/InsightFollowUpModal";
import { obterInsight } from "../../config/insightsRegistry";
import { useInsightItens, useRegistrarAcompanhamento } from "../../hooks/useInsights";
import InsightsService from "../../services/service/InsightsService";
import { exportTable, type ColunaExport } from "../../utils/exportTable";
import { montarLinkWhatsapp } from "../../utils/whatsappLink";
import { Modal } from "../../components/ui/modal";
import FormCustomer from "../Forms/Customer/FormCustomer";
import { getCustomerIdAsync } from "../../services/service/CustomerService";
import type { CustomerRequestDto } from "../../services/model/Dto/Request/CustomerRequestDto";
import type { CustomerResponseDto } from "../../services/model/Dto/Response/CustomerResponseDto";
import type {
  InsightAcompanhamentoRequest,
  InsightChave,
  InsightItem,
} from "../../services/model/insights.types";

const TAMANHO_PAGINA = 20;

/**
 * Converte o paciente vindo da API no formato que o formulario edita.
 *
 * Conversao explicita, e nao um `as`: os dois contratos coincidem hoje porque o grid de
 * pacientes passa a propria linha da listagem para o mesmo formulario, mas nada garante que
 * continuem coincidindo. Um `as` transformaria essa divergencia em erro em producao; aqui ela
 * vira erro de compilacao.
 */
function paraFormularioDeCadastro(paciente: CustomerResponseDto): CustomerRequestDto {
  return paciente as unknown as CustomerRequestDto;
}

/**
 * Grid de um insight.
 *
 * O estado de navegação (página, filial, janela de dias) vive na URL para que o link possa
 * ser compartilhado e sobreviva ao F5. Paginação é server-side — diferente dos grids
 * antigos, que baixam a lista inteira e fatiam no cliente.
 */
export default function InsightDetalhe() {
  const { chave } = useParams<{ chave: string }>();
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();

  const definicao = obterInsight(chave);

  const pagina = Math.max(1, Number(parametros.get("pagina") ?? 1));
  const filialId = parametros.get("filialId") ?? undefined;
  const dias = parametros.get("dias") ? Number(parametros.get("dias")) : definicao?.diasPadrao;

  const filtro = useMemo(() => ({ filialId, dias }), [filialId, dias]);

  const { data, isLoading, isError } = useInsightItens(
    definicao?.chave,
    filtro,
    pagina,
    TAMANHO_PAGINA
  );

  const registrar = useRegistrarAcompanhamento((chave ?? "") as InsightChave);
  const [itemEmAtendimento, setItemEmAtendimento] = useState<InsightItem | null>(null);
  const [exportando, setExportando] = useState(false);

  // Correcao de cadastro sem sair da fila: o formulario abre sobre a lista, e ao salvar o
  // paciente corrigido some dela. Mandar o usuario para a tela de Pacientes a cada correcao
  // faria perder a posicao na lista a cada item.
  const queryClient = useQueryClient();
  const [cadastroEmEdicao, setCadastroEmEdicao] = useState<CustomerRequestDto | null>(null);
  const [carregandoCadastro, setCarregandoCadastro] = useState<string | null>(null);

  const abrirCadastro = async (item: InsightItem) => {
    if (!item.clienteId) {
      toast.error("Este item não está vinculado a um paciente.");
      return;
    }

    setCarregandoCadastro(item.referenciaId);

    try {
      const paciente = await getCustomerIdAsync(item.clienteId);

      if (!paciente) {
        toast.error("Não foi possível carregar o cadastro deste paciente.");
        return;
      }

      setCadastroEmEdicao(paraFormularioDeCadastro(paciente));
    } catch {
      toast.error("Não foi possível carregar o cadastro deste paciente.");
    } finally {
      setCarregandoCadastro(null);
    }
  };

  const fecharCadastro = () => setCadastroEmEdicao(null);

  const aoSalvarCadastro = () => {
    // Invalida a raiz: o item sai da lista e o contador do card precisa cair junto, senao o
    // numero na faixa continua acusando um problema que ja foi resolvido.
    queryClient.invalidateQueries({ queryKey: ["insight"] });
    setCadastroEmEdicao(null);
  };

  if (!definicao) {
    return (
      <>
        <PageMeta title="Insight não encontrado" description="Insight inexistente" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Insight não encontrado
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            O endereço aponta para um insight que não existe.
          </p>
          <Button className="mt-4" onClick={() => navigate("/customer")}>
            Voltar para Pacientes
          </Button>
        </div>
      </>
    );
  }

  const itens = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalDePaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  /** Trocar de filtro precisa voltar para a página 1, senão o grid abre vazio. */
  const atualizarParametro = (nome: string, valor: string | null) => {
    const proximos = new URLSearchParams(parametros);
    if (valor === null || valor === "") proximos.delete(nome);
    else proximos.set(nome, valor);
    if (nome !== "pagina") proximos.set("pagina", "1");
    setParametros(proximos);
  };

  const colunasExport: ColunaExport<InsightItem>[] = [
    ...definicao.colunas.map((coluna) => ({
      titulo: coluna.titulo,
      valor: (item: InsightItem) => coluna.valor(item),
    })),
    { titulo: "Telefone", valor: (item) => item.telefone ?? "" },
  ];

  const exportar = async (formato: "csv" | "xlsx") => {
    setExportando(true);
    try {
      // Exporta o conjunto completo, não a página aberta: quem exporta quer a lista toda.
      const completo = await InsightsService.exportacao(definicao.chave, filtro);
      const arquivo = exportTable(
        completo.itens,
        colunasExport,
        definicao.titulo.toLowerCase().replace(/\s+/g, "-"),
        formato
      );
      toast.success(`${completo.itens.length} linha(s) exportada(s) em ${arquivo}`);
    } catch (erro) {
      const mensagem =
        (erro as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (erro as Error).message;
      toast.error(mensagem);
    } finally {
      setExportando(false);
    }
  };

  const confirmarAtendimento = (requisicao: InsightAcompanhamentoRequest) => {
    registrar.mutate(requisicao, {
      onSuccess: () => {
        toast.success("Atendimento registrado. O item saiu da fila.");
        setItemEmAtendimento(null);
      },
      onError: (erro) => {
        const mensagem =
          (erro as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "Não foi possível registrar o atendimento.";
        toast.error(mensagem);
      },
    });
  };

  return (
    <>
      <PageMeta title={definicao.titulo} description={definicao.descricao} />
      <PageBreadcrumb pageTitle={definicao.titulo} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-theme-sm text-gray-600 dark:text-gray-400">{definicao.descricao}</p>
            <p className="mt-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
              {isLoading ? "Carregando..." : `${total} paciente(s) na fila`}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              disabled={exportando || total === 0}
              onClick={() => exportar("csv")}
            >
              CSV
            </Button>
            <Button disabled={exportando || total === 0} onClick={() => exportar("xlsx")}>
              Excel
            </Button>
          </div>
        </div>

        {definicao.diasPadrao !== undefined && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">Sem check-in há:</span>
            {[7, 14, 30, 60].map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => atualizarParametro("dias", String(opcao))}
                aria-pressed={dias === opcao}
                className={[
                  "rounded-full px-3 py-1 text-theme-xs transition-colors duration-200 ease-out motion-reduce:transition-none",
                  dias === opcao
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                ].join(" ")}
              >
                {opcao} dias
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          {isError ? (
            <p role="alert" className="py-8 text-center text-theme-sm text-error-500">
              Não foi possível carregar a lista agora.
            </p>
          ) : isLoading ? (
            <div className="space-y-2 py-4" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, indice) => (
                <div
                  key={indice}
                  className="h-11 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none dark:bg-gray-800"
                />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <p className="py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
              {/* "Bom sinal" nao cabe num card de distribuicao: zero em "Status: Alta" quer
                  dizer que ninguem registra alta, o que e o oposto de boa noticia. */}
              {definicao.escopo === "qualidade"
                ? "Nenhum paciente nesta condição."
                : "Nada pendente por aqui. Bom sinal."}
            </p>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {definicao.colunas.map((coluna) => (
                    <TableCell
                      key={coluna.titulo}
                      isHeader
                      className={`px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${
                        coluna.numerica ? "text-end" : "text-start"
                      }`}
                    >
                      {coluna.titulo}
                    </TableCell>
                  ))}
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Ação
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {itens.map((item) => {
                  // A acao de cadastro nao pode depender de telefone: "Telefone em branco" e
                  // "Paciente inalcancavel" listam justamente quem nao tem, e amarrar o botao
                  // ao link de WhatsApp deixaria essas filas sem nenhuma acao.
                  const acaoDeCadastro = definicao.tipoAcao === "cadastro";
                  const linkWhatsapp = acaoDeCadastro
                    ? null
                    : montarLinkWhatsapp(item.telefone, definicao.mensagemWhatsapp);

                  return (
                    <TableRow key={item.referenciaId}>
                      {definicao.colunas.map((coluna) => (
                        <TableCell
                          key={coluna.titulo}
                          className={`px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300 ${
                            coluna.numerica ? "text-end" : "text-start"
                          }`}
                        >
                          {coluna.valor(item)}
                        </TableCell>
                      ))}

                      <TableCell className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-2">
                          {acaoDeCadastro && (
                            <button
                              type="button"
                              onClick={() => abrirCadastro(item)}
                              disabled={carregandoCadastro === item.referenciaId}
                              className="rounded-lg bg-brand-50 px-3 py-1.5 text-theme-xs font-medium text-brand-700 transition-colors duration-200 ease-out hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:bg-brand-500/15 dark:text-brand-400"
                            >
                              {carregandoCadastro === item.referenciaId ? "Abrindo..." : definicao.acao}
                            </button>
                          )}
                          {linkWhatsapp && (
                            <a
                              href={linkWhatsapp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-success-50 px-3 py-1.5 text-theme-xs font-medium text-success-700 transition-colors duration-200 ease-out hover:bg-success-100 motion-reduce:transition-none dark:bg-success-500/15 dark:text-success-400"
                            >
                              {definicao.acao}
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setItemEmAtendimento(item)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-theme-xs font-medium text-gray-700 transition-colors duration-200 ease-out hover:bg-gray-200 motion-reduce:transition-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Registrar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {totalDePaginas > 1 && (
          <nav aria-label="Paginação" className="mt-5 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={pagina <= 1}
              onClick={() => atualizarParametro("pagina", String(pagina - 1))}
            >
              Anterior
            </Button>
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">
              Página {pagina} de {totalDePaginas}
            </span>
            <Button
              variant="outline"
              disabled={pagina >= totalDePaginas}
              onClick={() => atualizarParametro("pagina", String(pagina + 1))}
            >
              Próxima
            </Button>
          </nav>
        )}
      </div>

      <Modal
        isOpen={cadastroEmEdicao !== null}
        onClose={fecharCadastro}
        className="max-w-[900px] m-4"
      >
        {cadastroEmEdicao && (
          <FormCustomer
            data={cadastroEmEdicao}
            edit
            closeModal={fecharCadastro}
            onSuccess={aoSalvarCadastro}
          />
        )}
      </Modal>

      <InsightFollowUpModal
        aberto={itemEmAtendimento !== null}
        item={itemEmAtendimento}
        salvando={registrar.isLoading}
        onFechar={() => setItemEmAtendimento(null)}
        onConfirmar={confirmarAtendimento}
      />

      <Toaster position="bottom-right" />
    </>
  );
}
