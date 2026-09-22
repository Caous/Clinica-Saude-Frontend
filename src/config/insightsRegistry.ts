import type { InsightChave, InsightItem } from "../services/model/insights.types";
import { formatCPF, formatPhone } from "../components/helper/formatUtils";

/** Em qual tela o contador do insight aparece. */
export type EscopoInsight = "cliente" | "financeiro" | "qualidade" | "funcionario";

export interface ColunaInsight {
  titulo: string;
  /** Extrai o texto da célula. Métricas vêm formatadas do backend. */
  valor: (item: InsightItem) => string;
  /** Alinhar à direita números e valores, como o resto dos grids do sistema. */
  numerica?: boolean;
}

/**
 * O que o time faz com a linha.
 *
 * `whatsapp` abre a conversa com o paciente; `cadastro` abre a ficha para corrigir o dado.
 * Insight de qualidade nunca é `whatsapp`: metade da lista de "Telefone em branco" não tem
 * telefone justamente por isso.
 */
export type TipoDeAcaoInsight = "whatsapp" | "cadastro" | "fichaDeFuncionario";

export interface DefinicaoInsight {
  chave: InsightChave;
  titulo: string;
  /** Explica a regra no tooltip do card — o time precisa saber por que o paciente está na lista. */
  descricao: string;
  /** Chamada da ação, exibida no grid. */
  acao: string;
  escopo: EscopoInsight;
  /** Padrão `whatsapp`, para os insights de venda continuarem como estavam. */
  tipoAcao?: TipoDeAcaoInsight;
  /**
   * Mensagem que abre a conversa no WhatsApp. Obrigatória apenas quando a ação é `whatsapp`.
   * Aceita o token `{nome_cliente}`, trocado pelo nome do paciente da linha antes de montar
   * o link (ver `aplicarNomeNaMensagem`).
   */
  mensagemWhatsapp?: string;
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

/** Clínica opera em 4 unidades; a lista precisa dizer para qual encaminhar. */
const colunaUnidade: ColunaInsight = {
  titulo: "Unidade",
  valor: (item) => item.filialNome ?? "—",
};

/** Texto padrao de celula sem conteudo, igual ao resto dos grids. */
const SEM_CONTEUDO = "—";

/**
 * Nos insights que existem justamente por causa do campo vazio, o travessao nao comunica:
 * parece falha de carregamento. O texto explicito diz que o cadastro e que esta incompleto.
 */
const SEM_DADO = "Não tem dado";

const colunaTelefoneCom = (vazio: string): ColunaInsight => ({
  titulo: "Telefone",
  // Mesmo formatador do grid de pacientes e do de funcionarios: o numero precisa sair igual
  // em toda tela, senao o mesmo paciente parece ter cadastros diferentes.
  valor: (item) => formatPhone(item.telefone?.trim()) || vazio,
});

const colunaEmailCom = (vazio: string): ColunaInsight => ({
  titulo: "E-mail",
  valor: (item) => item.metricas?.["E-mail"]?.trim() || vazio,
});

const colunaTelefone = colunaTelefoneCom(SEM_CONTEUDO);
const colunaEmail = colunaEmailCom(SEM_CONTEUDO);

const colunaCpfCom = (vazio: string): ColunaInsight => ({
  titulo: "CPF",
  valor: (item) => item.metricas?.["CPF"]?.trim() || vazio,
});

const colunaCpf = colunaCpfCom(SEM_CONTEUDO);

const colunaCadastradoEm: ColunaInsight = {
  titulo: "Cadastrado em",
  valor: metrica("Cadastrado em"),
};

/** Liga a sujeira a quem a produziu: sem isso corrige-se o registro e o processo segue igual. */
const colunaCadastradoPor: ColunaInsight = {
  titulo: "Cadastrado por",
  valor: metrica("Cadastrado por"),
};

/**
 * Coluna do valor que se repete.
 *
 * Recebe o formatador porque o backend devolve o valor ja normalizado -- so digitos, para os
 * cadastros do mesmo grupo casarem. Bom para comparar, ruim de ler: o mesmo telefone aparece
 * mascarado no card do paciente e cru aqui. O formatador devolve a leitura de sempre.
 */
const colunaValorRepetidoCom = (formatar: (valor: string) => string): ColunaInsight => ({
  titulo: "Valor repetido",
  valor: (item) => {
    const valor = item.metricas?.["Valor repetido"];
    return valor ? formatar(valor) : "—";
  },
});

const colunaOcorrencias: ColunaInsight = {
  titulo: "Cadastros",
  valor: metrica("Ocorrências"),
  numerica: true,
};

/**
 * Insight de qualidade de cadastro.
 *
 * Fábrica em vez de 27 objetos escritos à mão: o que varia entre eles é título, descrição e
 * conjunto de colunas. Ação, escopo e ausência de mensagem de WhatsApp são iguais em todos, e
 * repetir isso 27 vezes só criaria 27 lugares para divergir.
 */
function qualidade(
  chave: InsightChave,
  titulo: string,
  descricao: string,
  colunas: ColunaInsight[]
): DefinicaoInsight {
  return {
    chave,
    titulo,
    descricao,
    acao: "Abrir cadastro",
    tipoAcao: "cadastro",
    escopo: "qualidade",
    colunas,
  };
}

/** Colunas dos cards de distribuição por status e de campo não preenchido. */
const colunasDeCadastro: ColunaInsight[] = [
  colunaPaciente,
  colunaTelefone,
  colunaCadastradoEm,
  colunaCadastradoPor,
  colunaUnidade,
];

const colunaCargo: ColunaInsight = {
  titulo: "Cargo",
  valor: metrica("Cargo"),
};

const colunaNascimento: ColunaInsight = {
  titulo: "Nascimento",
  valor: metrica("Nascimento"),
};

const colunaIdade: ColunaInsight = {
  titulo: "Idade",
  valor: metrica("Idade"),
  numerica: true,
};

/**
 * Insight de cadastro de funcionário.
 *
 * Mesma ideia da fábrica de qualidade do paciente, com dois pontos próprios: a ação abre a
 * ficha do funcionário, não a do paciente, e a coluna de unidade sai — quase todos esses
 * cards existem justamente porque a ficha está incompleta, e a unidade é um dos campos que
 * pode estar faltando.
 */
function funcionario(
  chave: InsightChave,
  titulo: string,
  descricao: string,
  colunas: ColunaInsight[]
): DefinicaoInsight {
  return {
    chave,
    titulo,
    descricao,
    acao: "Abrir ficha",
    tipoAcao: "fichaDeFuncionario",
    escopo: "funcionario",
    colunas,
  };
}

/** Colunas dos cards de campo em branco da ficha de funcionário. */
const colunasDeFicha: ColunaInsight[] = [
  colunaPaciente,
  colunaCargo,
  colunaTelefone,
  colunaEmail,
  colunaUnidade,
];

/** Colunas dos três cards de duplicidade — o valor repetido vem antes do resto. */
const colunasDeDuplicidade = (formatar: (valor: string) => string): ColunaInsight[] => [
  colunaPaciente,
  colunaValorRepetidoCom(formatar),
  colunaOcorrencias,
  colunaCadastradoEm,
  colunaUnidade,
];

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
      "Olá {nome_cliente}, tudo bem? Estamos observando e você está no final de suas sessões como tem sido o atendimento tem se sentido melhor, acha que podemos continuar a contribuir na sua evolução e viver sem dor?",
    colunas: [
      colunaPaciente,
      { titulo: "Restantes", valor: metrica("Sessões restantes"), numerica: true },
      { titulo: "Contratadas", valor: metrica("Sessões contratadas"), numerica: true },
      { titulo: "Último check-in", valor: metrica("Último check-in") },
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
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
      colunaUnidade,
    ],
  },

  // --------------- qualidade de cadastro: distribuicao por status ---------------
  // Continuam na faixa mesmo marcando zero: o vazio tambem e informacao. Hoje 97% da base
  // esta parada em Novo Paciente e nenhum paciente jamais recebeu Alta, Cancelado ou Inativo --
  // e isso que estes dez cards colocam na frente do time.

  StatusNovoPaciente: qualidade(
    "StatusNovoPaciente",
    "Status: Novo Paciente",
    "Pacientes com status Novo Paciente. Se o número não cai com o tempo, o status não está sendo atualizado ao longo do tratamento.",
    colunasDeCadastro
  ),

  StatusAguardandoAvaliacao: qualidade(
    "StatusAguardandoAvaliacao",
    "Status: Aguardando Avaliação",
    "Pacientes que já entraram na base e ainda aguardam a avaliação inicial. Fila de entrada do tratamento.",
    colunasDeCadastro
  ),

  StatusEmAvaliacao: qualidade(
    "StatusEmAvaliacao",
    "Status: Em Avaliação",
    "Pacientes com a avaliação em andamento, ainda sem plano de tratamento fechado.",
    colunasDeCadastro
  ),

  StatusPlanoTratamento: qualidade(
    "StatusPlanoTratamento",
    "Status: Plano de Tratamento",
    "Pacientes com plano de tratamento montado, prontos para iniciar ou já iniciando as sessões.",
    colunasDeCadastro
  ),

  StatusEmAtendimento: qualidade(
    "StatusEmAtendimento",
    "Status: Em Atendimento",
    "Pacientes com tratamento em curso, consumindo sessões do plano contratado.",
    colunasDeCadastro
  ),

  StatusFaltouAtendimento: qualidade(
    "StatusFaltouAtendimento",
    "Status: Faltou Atendimento",
    "Pacientes cujo último registro foi uma falta. Status que deveria voltar para Em Atendimento assim que a pessoa retornar.",
    colunasDeCadastro
  ),

  StatusTratamentoConcluido: qualidade(
    "StatusTratamentoConcluido",
    "Status: Tratamento Concluído",
    "Pacientes que terminaram o plano contratado. É daqui que sai a fila de renovação.",
    colunasDeCadastro
  ),

  StatusAlta: qualidade(
    "StatusAlta",
    "Status: Alta",
    "Pacientes que receberam alta. Zerado significa que ninguém registra alta no sistema, não que ninguém teve alta.",
    colunasDeCadastro
  ),

  StatusCancelado: qualidade(
    "StatusCancelado",
    "Status: Cancelado",
    "Pacientes com tratamento cancelado antes da conclusão. Zerado costuma significar que o cancelamento não é registrado.",
    colunasDeCadastro
  ),

  StatusInativo: qualidade(
    "StatusInativo",
    "Status: Inativo",
    "Pacientes marcados como inativos. Zerado significa que a base nunca é higienizada por status, e não que todo mundo segue ativo.",
    colunasDeCadastro
  ),

  // --------------- qualidade de cadastro: contato ---------------

  EmailVazio: qualidade(
    "EmailVazio",
    "E-mail em branco",
    "Cadastros sem e-mail. Cada um deles fica de fora de toda comunicação por e-mail. Os pacientes sem nenhum contato também aparecem aqui e no card de telefone.",
    // A coluna vazia fica: e a prova, linha a linha, do motivo de o paciente estar na fila.
    [
      colunaPaciente,
      colunaEmailCom(SEM_DADO),
      colunaTelefone,
      colunaCadastradoEm,
      colunaCadastradoPor,
      colunaUnidade,
    ]
  ),

  EmailInvalido: qualidade(
    "EmailInvalido",
    "E-mail com formato inválido",
    "E-mail preenchido mas fora de formato utilizável: sem arroba, sem domínio ou com espaço no meio. O envio falha em silêncio.",
    [colunaPaciente, colunaEmail, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  EmailPlaceholder: qualidade(
    "EmailPlaceholder",
    "E-mail de fachada",
    "E-mail preenchido só para vencer a obrigatoriedade do formulário: naotem@, exemplo@, teste@ e parentes. Tecnicamente válido, inútil na prática.",
    [colunaPaciente, colunaEmail, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  EmailDuplicado: qualidade(
    "EmailDuplicado",
    "E-mail repetido",
    "Mesmo e-mail em mais de um cadastro. Costuma ser o mesmo paciente cadastrado duas vezes, ou o e-mail de um familiar usado para todos. A lista vem agrupada para comparar.",
    colunasDeDuplicidade((valor) => valor)
  ),

  TelefoneVazio: qualidade(
    "TelefoneVazio",
    "Telefone em branco",
    "Cadastros sem telefone. Sem telefone não há confirmação de sessão nem resgate por WhatsApp.",
    [
      colunaPaciente,
      colunaTelefoneCom(SEM_DADO),
      colunaEmail,
      colunaCadastradoEm,
      colunaCadastradoPor,
      colunaUnidade,
    ]
  ),

  TelefoneDuplicado: qualidade(
    "TelefoneDuplicado",
    "Telefone repetido",
    "Mesmo telefone em mais de um cadastro, já desconsiderando a máscara. Pode ser telefone de família ou cadastro duplicado.",
    colunasDeDuplicidade(formatPhone)
  ),

  TelefoneDigitosIguais: qualidade(
    "TelefoneDigitosIguais",
    "Telefone com dígitos iguais",
    "Números como 11111111111, digitados para passar pela obrigatoriedade do campo.",
    [colunaPaciente, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  TelefoneCurto: qualidade(
    "TelefoneCurto",
    "Telefone incompleto",
    "Menos de 10 dígitos: falta o DDD ou o número foi cortado. Não disca.",
    [colunaPaciente, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  SemEmailESemTelefone: qualidade(
    "SemEmailESemTelefone",
    "Paciente inalcançável",
    "Sem e-mail e sem telefone. A clínica não tem por onde chamar essa pessoa. É o pior caso da base e o que deve ser atacado primeiro.",
    // As duas colunas vazias entram de proposito: e o que prova, linha a linha, por que o
    // paciente esta nesta fila.
    [
      colunaPaciente,
      colunaTelefoneCom(SEM_DADO),
      colunaEmailCom(SEM_DADO),
      colunaCadastradoEm,
      colunaCadastradoPor,
      colunaUnidade,
    ]
  ),

  // --------------- qualidade de cadastro: CPF ---------------

  CpfDigitosRepetidos: qualidade(
    "CpfDigitosRepetidos",
    "CPF com dígitos repetidos",
    "CPF preenchido com 11 dígitos iguais. Não identifica ninguém e impede a emissão de recibo.",
    [colunaPaciente, colunaCpf, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  CpfVazio: qualidade(
    "CpfVazio",
    "CPF em branco",
    "Cadastros sem CPF. Sem ele não há emissão de recibo nem forma confiável de identificar o paciente.",
    [
      colunaPaciente,
      colunaCpfCom(SEM_DADO),
      colunaTelefone,
      colunaCadastradoEm,
      colunaCadastradoPor,
      colunaUnidade,
    ]
  ),

  CpfDigitoVerificadorInvalido: qualidade(
    "CpfDigitoVerificadorInvalido",
    "CPF com dígito inválido",
    "CPF que não passa no dígito verificador: número inventado ou digitado errado. Trava na emissão fiscal.",
    [colunaPaciente, colunaCpf, colunaTelefone, colunaCadastradoPor, colunaUnidade]
  ),

  CpfDuplicado: qualidade(
    "CpfDuplicado",
    "CPF repetido",
    "Mesmo CPF em mais de um cadastro. É o sinal mais forte de paciente duplicado: histórico e plano ficam divididos entre duas fichas.",
    colunasDeDuplicidade(formatCPF)
  ),

  // --------------- qualidade de cadastro: campos nao preenchidos ---------------

  EnderecoVazio: qualidade(
    "EnderecoVazio",
    "Sem endereço",
    "Nenhum componente de endereço preenchido: sem rua, CEP, bairro e cidade.",
    colunasDeCadastro
  ),

  PatologiaVazia: qualidade(
    "PatologiaVazia",
    "Sem patologia",
    "Ficha clínica sem a patologia que trouxe o paciente. É o campo que sustenta evolução e relatório.",
    colunasDeCadastro
  ),

  DocumentoIdentificacaoVazio: qualidade(
    "DocumentoIdentificacaoVazio",
    "Sem documento",
    "Cadastros sem documento de identificação. Campo exigido na primeira consulta e quase nunca preenchido.",
    colunasDeCadastro
  ),

  // ─────────────── cadastro de funcionário ───────────────
  // Contam apenas funcionários ativos. Hoje oito destes dez cards nascem zerados: o valor
  // aqui é de vigilância, para o próximo cadastro torto aparecer no mesmo dia.

  FuncionarioAniversarianteDoDia: funcionario(
    "FuncionarioAniversarianteDoDia",
    "Aniversariantes de hoje",
    "Funcionários que fazem aniversário hoje. Quem não tem data de nascimento na ficha nunca aparece aqui.",
    [colunaPaciente, colunaCargo, colunaNascimento, colunaIdade, colunaUnidade]
  ),

  FuncionarioAniversarianteDoMes: funcionario(
    "FuncionarioAniversarianteDoMes",
    "Aniversariantes do mês",
    "Funcionários que fazem aniversário no mês corrente, o mês inteiro. Quem faz hoje também aparece aqui — um card é para parabenizar agora, o outro para planejar o mês.",
    [colunaPaciente, colunaCargo, colunaNascimento, colunaIdade, colunaUnidade]
  ),

  FuncionarioCpfVazio: funcionario(
    "FuncionarioCpfVazio",
    "CPF em branco",
    "Fichas de funcionário sem CPF. Sem ele não há como emitir nada no nome da pessoa.",
    colunasDeFicha
  ),

  FuncionarioSemFilial: funcionario(
    "FuncionarioSemFilial",
    "Sem unidade",
    "Funcionário sem unidade vinculada. Fica de fora da escala e de qualquer número por filial.",
    [colunaPaciente, colunaCargo, colunaTelefone, colunaEmail]
  ),

  FuncionarioEmailVazio: funcionario(
    "FuncionarioEmailVazio",
    "E-mail em branco",
    "Fichas sem e-mail. É por onde passa comunicado interno e recuperação de acesso.",
    colunasDeFicha
  ),

  FuncionarioTelefoneVazio: funcionario(
    "FuncionarioTelefoneVazio",
    "Telefone em branco",
    "Fichas sem telefone. Sem ele não há como acionar a pessoa fora do horário nem em troca de plantão.",
    colunasDeFicha
  ),

  FuncionarioCargoVazio: funcionario(
    "FuncionarioCargoVazio",
    "Sem cargo",
    "Fichas sem cargo preenchido. O cargo é o que diz quem faz o quê na escala e nos relatórios.",
    colunasDeFicha
  ),

  FuncionarioCpfDuplicado: funcionario(
    "FuncionarioCpfDuplicado",
    "CPF repetido",
    "Mesmo CPF em mais de um funcionário ativo. É o sinal mais forte de ficha duplicada — o histórico de atendimento fica dividido entre as duas.",
    colunasDeDuplicidade(formatCPF)
  ),

  FuncionarioEmailDuplicado: funcionario(
    "FuncionarioEmailDuplicado",
    "E-mail repetido",
    "Mesmo e-mail em mais de um funcionário ativo. Costuma ser a mesma pessoa cadastrada duas vezes.",
    colunasDeDuplicidade((valor) => valor)
  ),

  FuncionarioTelefoneDuplicado: funcionario(
    "FuncionarioTelefoneDuplicado",
    "Telefone repetido",
    "Mesmo telefone em mais de um funcionário ativo, já desconsiderando a máscara. Pode ser ficha duplicada ou telefone de recado compartilhado.",
    colunasDeDuplicidade(formatPhone)
  ),

  FilialNaoDefinida: qualidade(
    "FilialNaoDefinida",
    "Sem unidade",
    "Cadastros sem unidade vinculada. Ficam de fora de qualquer número por filial.",
    colunasDeCadastro
  ),
};

/** Insights exibidos na faixa da tela de Pacientes. */
/**
 * Insights exibidos na faixa da tela de Pacientes.
 *
 * Os de venda vem primeiro porque e o que gera receita hoje; os de qualidade vem em seguida,
 * agrupados por assunto. Sao 33 cards e uma requisicao so -- ver `useInsightContadores`.
 */
export const INSIGHTS_DA_TELA_CLIENTE: InsightChave[] = [
  // Oportunidades de venda.
  "PlanoAcabando",
  "PacienteDormente",
  "FaltouOntem",
  "SessaoAmanhaNaoConfirmada",
  "AniversariantesHoje",
  "PlanoZeradoSemRenovar",
  // Distribuicao por status.
  "StatusNovoPaciente",
  "StatusAguardandoAvaliacao",
  "StatusEmAvaliacao",
  "StatusPlanoTratamento",
  "StatusEmAtendimento",
  "StatusFaltouAtendimento",
  "StatusTratamentoConcluido",
  "StatusAlta",
  "StatusCancelado",
  "StatusInativo",
  // Contato.
  "SemEmailESemTelefone",
  "EmailVazio",
  "EmailInvalido",
  "EmailPlaceholder",
  "EmailDuplicado",
  "TelefoneVazio",
  "TelefoneDuplicado",
  "TelefoneDigitosIguais",
  "TelefoneCurto",
  // CPF.
  "CpfDuplicado",
  "CpfDigitoVerificadorInvalido",
  "CpfDigitosRepetidos",
  "CpfVazio",
  // Campos nao preenchidos.
  "EnderecoVazio",
  "PatologiaVazia",
  "DocumentoIdentificacaoVazio",
  "FilialNaoDefinida",
];

/**
 * Insights exibidos na faixa da tela de Funcionários.
 *
 * Aniversário primeiro porque é o que tem uso diário; depois duplicidade, que é o mais grave;
 * e por fim os campos em branco. Dez cards: com a faixa recolhida em três linhas, cabem todos
 * no desktop e o botão de expandir aparece nas telas mais estreitas.
 */
export const INSIGHTS_DA_TELA_FUNCIONARIO: InsightChave[] = [
  "FuncionarioAniversarianteDoDia",
  "FuncionarioAniversarianteDoMes",
  "FuncionarioCpfDuplicado",
  "FuncionarioEmailDuplicado",
  "FuncionarioTelefoneDuplicado",
  "FuncionarioCpfVazio",
  "FuncionarioEmailVazio",
  "FuncionarioTelefoneVazio",
  "FuncionarioCargoVazio",
  "FuncionarioSemFilial",
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
