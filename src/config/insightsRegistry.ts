import type { InsightChave, InsightItem } from "../services/model/insights.types";

/** Em qual tela o contador do insight aparece. */
export type EscopoInsight = "cliente" | "financeiro";

export interface ColunaInsight {
  titulo: string;
  /** Extrai o texto da célula. Métricas vêm formatadas do backend. */
  valor: (item: InsightItem) => string;
  /** Alinhar à direita números e valores, como o resto dos grids do sistema. */
  numerica?: boolean;
}

export interface DefinicaoInsight {
  chave: InsightChave;
  titulo: string;
  /** Explica a regra no tooltip do card — o time precisa saber por que o paciente está na lista. */
  descricao: string;
  /** Chamada da ação, exibida no grid. */
  acao: string;
  escopo: EscopoInsight;
  /** Mensagem que abre a conversa no WhatsApp a partir da lista. */
  mensagemWhatsapp: string;
  colunas: ColunaInsight[];
  /** Janela em dias configurável pelo usuário, quando o insight aceita. */
  diasPadrao?: number;
}

const metrica = (nome: string) => (item: InsightItem) => item.metricas?.[nome] ?? "—";

const dataBr = (item: InsightItem) =>
  item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "—";

const moedaBr = (item: InsightItem) =>
  item.valor === null || item.valor === undefined
    ? "—"
    : item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const colunaPaciente: ColunaInsight = {
  titulo: "Paciente",
  valor: (item) => item.clienteNome,
};

/**
 * Registro dos insights disponíveis no front.
 *
 * Ligar um insight novo do backlog é acrescentar uma entrada aqui e a chave no
 * enum de `insights.types` — a faixa e o grid são genéricos e não mudam.
 */
export const INSIGHTS: Record<string, DefinicaoInsight> = {
  PlanoAcabando: {
    chave: "PlanoAcabando",
    titulo: "Planos acabando",
    descricao:
      "Pacientes em tratamento com apenas 1 ou 2 sessões restantes no plano. É a janela para oferecer a renovação antes de o plano terminar.",
    acao: "Ligar para renovar",
    escopo: "cliente",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros 😀 Vi que seu plano está chegando ao fim. Podemos conversar sobre a renovação?",
    colunas: [
      colunaPaciente,
      { titulo: "Restantes", valor: metrica("Sessões restantes"), numerica: true },
      { titulo: "Contratadas", valor: metrica("Sessões contratadas"), numerica: true },
      { titulo: "Último check-in", valor: metrica("Último check-in") },
    ],
  },

  PacienteDormente: {
    chave: "PacienteDormente",
    titulo: "Pacientes sumidos",
    descricao:
      "Pacientes com plano ativo e sessões disponíveis, mas sem check-in há mais de 14 dias. Abandono em curso — dá para agir antes de perder o plano inteiro.",
    acao: "Resgatar paciente",
    escopo: "cliente",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros 😀 Sentimos sua falta nas últimas semanas. Vamos remarcar sua próxima sessão?",
    diasPadrao: 14,
    colunas: [
      colunaPaciente,
      { titulo: "Dias sem vir", valor: metrica("Dias sem check-in"), numerica: true },
      { titulo: "Restantes", valor: metrica("Sessões restantes"), numerica: true },
      { titulo: "Último check-in", valor: dataBr },
    ],
  },

  AniversariantesHoje: {
    chave: "AniversariantesHoje",
    titulo: "Aniversariantes de hoje",
    descricao:
      "Pacientes que fazem aniversário hoje. A coluna de plano ativo indica a oferta: quem está em tratamento recebe cortesia, quem não está recebe proposta.",
    acao: "Parabenizar",
    escopo: "cliente",
    mensagemWhatsapp:
      "Parabéns! 🎉 A equipe do Instituto Barros deseja um feliz aniversário para você!",
    colunas: [
      colunaPaciente,
      { titulo: "Idade", valor: metrica("Idade"), numerica: true },
      { titulo: "Plano ativo", valor: metrica("Plano ativo") },
      { titulo: "Nascimento", valor: dataBr },
    ],
  },

  ParcelasVencidas: {
    chave: "ParcelasVencidas",
    titulo: "Parcelas vencidas",
    descricao:
      "Parcelas pendentes com vencimento no passado. Ordenadas da mais antiga para a mais recente.",
    acao: "Cobrar",
    escopo: "financeiro",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros. Identificamos uma parcela em aberto. Podemos ajudar a regularizar?",
    colunas: [
      colunaPaciente,
      { titulo: "Valor", valor: moedaBr, numerica: true },
      { titulo: "Dias em atraso", valor: metrica("Dias em atraso"), numerica: true },
      { titulo: "Vencimento", valor: dataBr },
    ],
  },

  PlanoZeradoSemRenovar: {
    chave: "PlanoZeradoSemRenovar",
    titulo: "Terminaram e sumiram",
    descricao:
      "Pacientes que concluíram o plano e não abriram nenhum plano novo depois. Oportunidade de renovação já perdida no prazo, mas ainda recuperável.",
    acao: "Oferecer novo plano",
    escopo: "cliente",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros 😀 Você concluiu seu plano conosco. Vamos montar a próxima etapa do seu tratamento?",
    diasPadrao: 3,
    colunas: [
      colunaPaciente,
      { titulo: "Contratadas", valor: metrica("Sessões contratadas"), numerica: true },
      { titulo: "Concluído em", valor: dataBr },
    ],
  },

  FaltouOntem: {
    chave: "FaltouOntem",
    titulo: "Faltaram ontem",
    descricao:
      "Pacientes que não compareceram à sessão de ontem. Ligar hoje, enquanto ainda é o assunto do dia, é o que reduz a chance de abandono.",
    acao: "Remarcar",
    escopo: "cliente",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros. Sentimos sua falta na sessão de ontem. Vamos remarcar?",
    colunas: [
      colunaPaciente,
      { titulo: "Data da falta", valor: dataBr },
      { titulo: "Contratadas", valor: metrica("Sessões contratadas"), numerica: true },
    ],
  },

  SessaoAmanhaNaoConfirmada: {
    chave: "SessaoAmanhaNaoConfirmada",
    titulo: "Amanhã sem confirmar",
    descricao:
      "Agendamentos de amanhã que o paciente ainda não confirmou. Confirmar hoje é a forma mais barata de derrubar o índice de falta.",
    acao: "Confirmar",
    escopo: "cliente",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros. Podemos confirmar sua sessão de amanhã?",
    colunas: [
      colunaPaciente,
      { titulo: "Horário", valor: (item) => (item.data ? new Date(item.data).toLocaleString("pt-BR") : "—") },
    ],
  },

  ParcelasVence7Dias: {
    chave: "ParcelasVence7Dias",
    titulo: "Vencem em 7 dias",
    descricao:
      "Parcelas pendentes com vencimento nos próximos dias. Lembrete preventivo custa menos que cobrança depois do atraso.",
    acao: "Lembrar",
    escopo: "financeiro",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros. Passando para lembrar da parcela que vence nos próximos dias.",
    diasPadrao: 7,
    colunas: [
      colunaPaciente,
      { titulo: "Valor", valor: moedaBr, numerica: true },
      { titulo: "Vencimento", valor: dataBr },
    ],
  },

  PlanoSemPagamento: {
    chave: "PlanoSemPagamento",
    titulo: "Plano sem pagamento",
    descricao:
      "Planos em andamento sem data de pagamento e sem nenhuma transação de recebimento vinculada. O tratamento está sendo prestado sem receita registrada.",
    acao: "Regularizar",
    escopo: "financeiro",
    mensagemWhatsapp:
      "Olá! Aqui é do Instituto Barros. Precisamos acertar o pagamento do seu plano. Podemos ajudar?",
    colunas: [
      colunaPaciente,
      { titulo: "Contratadas", valor: metrica("Sessões contratadas"), numerica: true },
      { titulo: "Plano aberto em", valor: dataBr },
    ],
  },
};

/** Insights exibidos na faixa da tela de Pacientes. */
export const INSIGHTS_DA_TELA_CLIENTE: InsightChave[] = [
  "PlanoAcabando",
  "PacienteDormente",
  "FaltouOntem",
  "SessaoAmanhaNaoConfirmada",
  "AniversariantesHoje",
  "PlanoZeradoSemRenovar",
];

/** Insights exibidos na faixa da tela do Financeiro. */
export const INSIGHTS_DA_TELA_FINANCEIRO: InsightChave[] = [
  "ParcelasVencidas",
  "ParcelasVence7Dias",
  "PlanoSemPagamento",
];

export function obterInsight(chave: string | undefined): DefinicaoInsight | undefined {
  return chave ? INSIGHTS[chave] : undefined;
}
