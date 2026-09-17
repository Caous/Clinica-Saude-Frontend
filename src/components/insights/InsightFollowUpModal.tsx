import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { InsightSituacao } from "../../services/model/insights.types";
import type { InsightAcompanhamentoRequest, InsightItem } from "../../services/model/insights.types";

interface InsightFollowUpModalProps {
  aberto: boolean;
  item: InsightItem | null;
  salvando?: boolean;
  onFechar: () => void;
  onConfirmar: (requisicao: InsightAcompanhamentoRequest) => void;
}

const OPCOES = [
  {
    situacao: InsightSituacao.Contatado,
    rotulo: "Já entrei em contato",
    ajuda: "O item sai da fila por 7 dias e volta depois, caso não feche.",
  },
  {
    situacao: InsightSituacao.Adiado,
    rotulo: "Adiar",
    ajuda: "O item some da fila até a data escolhida.",
  },
  {
    situacao: InsightSituacao.Descartado,
    rotulo: "Descartar",
    ajuda: "O item não volta para a fila, mas continua auditável.",
  },
];

function amanhaIso(): string {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toISOString().slice(0, 10);
}

/** Registra o que o time fez com um item do insight, fechando o ciclo. */
export default function InsightFollowUpModal({
  aberto,
  item,
  salvando = false,
  onFechar,
  onConfirmar,
}: InsightFollowUpModalProps) {
  const [situacao, setSituacao] = useState<InsightSituacao>(InsightSituacao.Contatado);
  const [snoozeAte, setSnoozeAte] = useState(amanhaIso());
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  if (!item) return null;

  const exigeMotivo = situacao !== InsightSituacao.Contatado;
  const exigeData = situacao === InsightSituacao.Adiado;

  const confirmar = () => {
    if (exigeMotivo && motivo.trim().length === 0) {
      setErro("Informe o motivo — é ele que permite auditar depois por que o item saiu da fila.");
      return;
    }

    if (exigeData && snoozeAte <= new Date().toISOString().slice(0, 10)) {
      setErro("A data de retorno precisa estar no futuro.");
      return;
    }

    setErro(null);
    onConfirmar({
      referenciaId: item.referenciaId,
      clienteId: item.clienteId ?? null,
      situacao,
      snoozeAte: exigeData ? snoozeAte : null,
      motivo: exigeMotivo ? motivo.trim() : null,
      observacao: observacao.trim() || null,
    });
  };

  return (
    <Modal isOpen={aberto} onClose={onFechar} className="m-4 max-w-[560px]">
      <div className="p-6">
        <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Registrar atendimento
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{item.clienteNome}</p>

        <fieldset className="mt-5">
          <legend className="sr-only">O que foi feito</legend>

          <div className="flex flex-col gap-2">
            {OPCOES.map((opcao) => (
              <label
                key={opcao.situacao}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors duration-200 ease-out hover:border-brand-300 has-checked:border-brand-500 motion-reduce:transition-none dark:border-gray-800 dark:hover:border-brand-700"
              >
                <input
                  type="radio"
                  name="situacao-insight"
                  className="mt-1 accent-brand-500"
                  checked={situacao === opcao.situacao}
                  onChange={() => {
                    setSituacao(opcao.situacao);
                    setErro(null);
                  }}
                />
                <span>
                  <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {opcao.rotulo}
                  </span>
                  <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                    {opcao.ajuda}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {exigeData && (
          <div className="mt-4">
            <Label htmlFor="insight-snooze">Voltar para a fila em</Label>
            <input
              id="insight-snooze"
              type="date"
              value={snoozeAte}
              min={amanhaIso()}
              onChange={(evento) => setSnoozeAte(evento.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
            />
          </div>
        )}

        {exigeMotivo && (
          <div className="mt-4">
            <Label htmlFor="insight-motivo">Motivo</Label>
            <input
              id="insight-motivo"
              type="text"
              maxLength={200}
              value={motivo}
              aria-invalid={Boolean(erro) && motivo.trim().length === 0}
              aria-describedby={erro ? "insight-erro" : undefined}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ex.: paciente mudou de cidade"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
            />
          </div>
        )}

        <div className="mt-4">
          <Label htmlFor="insight-observacao">Observação (opcional)</Label>
          <textarea
            id="insight-observacao"
            rows={3}
            maxLength={500}
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
            placeholder="O que o paciente respondeu"
            className="w-full rounded-lg border border-gray-300 bg-transparent p-4 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
          />
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            A anotação também é gravada no histórico do paciente.
          </p>
        </div>

        {erro && (
          <p id="insight-erro" role="alert" className="mt-3 text-theme-sm text-error-500">
            {erro}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={salvando}>
            {salvando ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
