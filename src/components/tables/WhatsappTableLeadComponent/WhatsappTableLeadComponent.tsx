import {
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { Modal } from "../../ui/modal";
import Message from "../../whatsapp/message";
import { GroupMessage } from "../../../services/model/GroupMessage";
import { WhatsappConversationResponseDto } from "../../../services/model/Dto/Response/WhatsappConversationResponseDto";
import { getConversasAsync, getMensagensAsync, marcarComoLidaAsync } from "../../../services/service/WhatsappService";
import { useModal } from "../../../hooks/useModal";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

// Sentinela usada pelo componente <Message /> para alinhar as bolhas:
// fromUser contendo este valor é renderizado como mensagem da clínica (à direita).
const CLINICA_SENTINEL = "551150396001";

const formatPhone = (raw: string): string => {
  const d = (raw || "").replace(/\D/g, "");
  // 55 (DDI) + DDD (2) + número (8/9)
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export default function WhatsappTableLeadComponent() {
  const { isOpen: viewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [conversas, setConversas] = useState<WhatsappConversationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupMessage | undefined>(undefined);
  const [loadingMensagens, setLoadingMensagens] = useState(false);

  const carregarConversas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversasAsync();
      setConversas(data);
    } catch {
      toast.error("Não foi possível carregar os atendimentos do WhatsApp.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  const getStatusColor = (statusDescricao: string) => {
    switch (statusDescricao) {
      case "Nova":
        return "success";
      case "Ativa":
        return "info";
      case "Finalizada":
        return "warning";
      case "Arquivada":
        return "error";
      default:
        return "light";
    }
  };

  const paginatedData = useMemo(() => {
    return conversas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [conversas, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(conversas.length / itemsPerPage));
  }, [conversas.length, itemsPerPage]);

  const handleOpenModal = useCallback(async (conversa: WhatsappConversationResponseDto) => {
    openViewModal();
    setLoadingMensagens(true);
    setGroup(undefined);
    try {
      const mensagens = await getMensagensAsync(conversa.id);
      const mapped: GroupMessage = {
        id: { timestamp: 0, creationTime: conversa.dataCadastro },
        phoneNumber: conversa.nrTelefoneCliente,
        dateConversation: conversa.ultimaAtividade,
        conversationId: conversa.id,
        messages: mensagens.map((m) => ({
          id: m.id,
          fromUser: m.enviadaPelaClinica ? CLINICA_SENTINEL : conversa.nrTelefoneCliente,
          toUser: m.enviadaPelaClinica ? conversa.nrTelefoneCliente : CLINICA_SENTINEL,
          date: m.dataMensagem,
          text: m.conteudo,
        })),
      };
      setGroup(mapped);

      // Zera o contador de não lidas ao abrir a conversa.
      if (conversa.mensagensNaoLidas > 0) {
        marcarComoLidaAsync(conversa.id)
          .then(() => carregarConversas())
          .catch(() => {/* silencioso: leitura é best-effort */});
      }
    } catch {
      toast.error("Não foi possível carregar as mensagens desta conversa.");
    } finally {
      setLoadingMensagens(false);
    }
  }, [openViewModal, carregarConversas]);

  const handleCloseModal = () => {
    closeViewModal();
    setGroup(undefined);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table className="table-auto">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Nome
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Telefone
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Data/Hora
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Serviço
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Ações
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    Carregando atendimentos...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                    Nenhum atendimento de WhatsApp registrado.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.nomeCliente || item.nomeContato || "Contato sem nome"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {formatPhone(item.nrTelefoneCliente)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge size="sm" color={getStatusColor(item.statusDescricao)}>
                      {item.statusDescricao}
                    </Badge>
                    {item.mensagensNaoLidas > 0 && (
                      <Badge size="sm" color="error">
                        {item.mensagensNaoLidas} não lida{item.mensagensNaoLidas > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {formatDateTime(item.ultimaAtividade)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.esteiraBot || "Não identificado"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        rel="noopener"
                        title="Ver mensagens"
                        className="p-3 flex h-11 w-11 items-center justify-center rounded-full border border-blue-300 bg-white text-sm font-medium text-blue-700 shadow-theme-xs hover:bg-blue-50 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-400 dark:hover:bg-white/[0.03] dark:hover:text-blue-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6.663 3.116 1.805 4.172m-7.155 0A8.25 8.25 0 1 1 15.75 8.25M9.75 17.1m6.802-4.991a.75.75 0 0 0-1.225-.981m-.78.185a.75.75 0 0 0-1.06-1.061M12 18.75a6 6 0 0 1-6-6m6 6a6 6 0 0 0 6-6m-6 6v3.75m0-3.75h3.75" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Modal isOpen={viewModalOpen} onClose={handleCloseModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Mensagens
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Mensagens trocadas entre o cliente e o Bot
            </p>
          </div>
          {loadingMensagens ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">Carregando mensagens...</div>
          ) : group && group.messages.length > 0 ? (
            <Message group={group} />
          ) : (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">Nenhuma mensagem nesta conversa.</div>
          )}
        </div>
      </Modal>
    </>
  );
}
