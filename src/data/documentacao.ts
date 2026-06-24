import { USER_ROLES } from "../services/util/rolePermissions";

export interface DocStep {
  titulo: string;
  descricao: string;
}

export interface DocSection {
  titulo: string;
  intro?: string;
  passos?: DocStep[];
  regras?: string[];
  dicas?: string[];
}

export interface DocModule {
  id: string;
  titulo: string;
  resumo: string;
  /** Ícone (emoji) só para enfeite visual da lista. */
  icone: string;
  /** Perfis que enxergam este módulo. Vazio = todos. */
  roles: string[];
  secoes: DocSection[];
}

const ADMIN_ADMINISTRATIVO = [
  USER_ROLES.ADMINISTRADOR,
  USER_ROLES.ADMINISTRATIVO,
];

export const DOCUMENTACAO: DocModule[] = [
  // ===================== AGENDA =====================
  {
    id: "agenda",
    titulo: "Agenda",
    icone: "📅",
    resumo:
      "Calendário de eventos/atendimentos. Criar, editar e excluir eventos, mudar status e registrar check-in.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.COMERCIAL,
      USER_ROLES.FISIOTERAPEUTA,
      USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    ],
    secoes: [
      {
        titulo: "Visão geral da tela",
        intro:
          "A Agenda mostra os eventos em formato de calendário (mês/semana/dia). Cada evento tem uma cor pela do fisioterapeuta e um ícone que indica o status.",
        dicas: [
          "Use os filtros no topo para ver por cliente, status ou filial.",
          "Fisioterapeuta vê automaticamente apenas a própria agenda.",
          "O ícone de status fica ao lado do horário. Quando há check-in do fisioterapeuta no dia, aparece também o 🚀.",
        ],
      },
      {
        titulo: "Criar um evento",
        passos: [
          { titulo: "Abrir o formulário", descricao: "Clique em 'Novo Evento' (canto superior) ou clique em um espaço vazio do calendário." },
          { titulo: "Preencher os dados", descricao: "Informe Título, Data & Hora Início e Fim. Opcionalmente Descrição, Localização, Cliente e Fisioterapeuta." },
          { titulo: "Marcar 'É uma avaliação?'", descricao: "Marque quando o evento for uma avaliação. Isso influencia a baixa automática ao finalizar (ver regras)." },
          { titulo: "Definir o Status", descricao: "Escolha o status do agendamento (A confirmar, Confirmado, Finalizado, etc.)." },
          { titulo: "Salvar", descricao: "Clique em Salvar. O evento aparece no calendário com a cor do fisioterapeuta." },
        ],
        regras: [
          "Apenas Administrador e Administrativo podem criar eventos. Fisioterapeuta/Coordenador não criam eventos.",
        ],
      },
      {
        titulo: "Editar um evento",
        passos: [
          { titulo: "Abrir", descricao: "Clique no evento no calendário para abrir o modal de edição." },
          { titulo: "Alterar", descricao: "Mude os campos desejados e clique em Salvar." },
        ],
        regras: [
          "Fisioterapeuta e Coordenador só podem alterar o STATUS do agendamento. Cliente, Fisioterapeuta e Data & Hora ficam bloqueados para esses perfis.",
        ],
      },
      {
        titulo: "Excluir um evento",
        passos: [
          { titulo: "Abrir o evento", descricao: "Clique no evento." },
          { titulo: "Excluir", descricao: "Use o botão de excluir (lixeira) no topo do modal." },
        ],
        regras: [
          "Fisioterapeuta e Coordenador não veem o botão de excluir.",
        ],
      },
      {
        titulo: "Registrar Check-in (Sessão de Fisioterapia)",
        intro:
          "O check-in registra que o atendimento aconteceu. Há dois tipos: Fisio (produtividade do fisioterapeuta) e Plano/Baixa Administrativa (consome a sessão do plano do paciente).",
        passos: [
          { titulo: "Abrir o evento", descricao: "Clique no evento que tenha um cliente vinculado." },
          { titulo: "Clicar em Check-in", descricao: "O botão verde 'Check-in' abre o modal 'Sessão de Fisioterapia'." },
          { titulo: "Conferir os dados", descricao: "Data e Hora já vêm preenchidas com o fim do atendimento. Selecione a ordem de serviço e preencha o histórico/conduta (obrigatório para o fisio)." },
          { titulo: "Confirmar", descricao: "Clique em Check-in para registrar." },
        ],
        regras: [
          "Fisioterapeuta gera check-in tipo Fisio; Administrativo/Administrador gera tipo Plano (baixa).",
          "Fisioterapeuta NÃO pode fazer check-in após 48h do fim do atendimento — o botão fica desabilitado.",
          "Fisioterapeuta pode fazer check-in mesmo se o evento já estiver Finalizado (baixa feita pelo administrativo), desde que dentro das 48h e ainda não tenha feito o check-in Fisio do dia.",
          "Fisio e Plano são independentes: ter uma baixa administrativa não impede o check-in do fisioterapeuta no mesmo dia (e vice-versa).",
          "Não é permitido dois check-ins do MESMO tipo, no mesmo plano e mesmo dia.",
        ],
      },
      {
        titulo: "Status Finalizado e baixa automática",
        intro:
          "Quando o Administrador/Administrativo marca o evento como Finalizado, o sistema dá baixa (check-in Plano/Realizada) na ordem de serviço do cliente.",
        regras: [
          "Se 'É uma avaliação?' estiver marcado, a baixa vai para a ordem de serviço de Avaliação do cliente (quando houver vaga).",
          "Caso o cliente não tenha OS de avaliação disponível, a baixa vai para a última ordem de serviço ativa que ainda permita debitar sessão.",
          "A baixa é idempotente: não duplica no mesmo plano/dia.",
        ],
      },
      {
        titulo: "Ícones de status",
        dicas: [
          "✅ Finalizado · 👍 Confirmado pelo paciente · ❓ A confirmar · ⏳ Em espera · ⚠️ Faltou · ❌/✖️ Cancelado · 🔄 Pré-atendimento · 📅 Reagendar.",
          "🚀 = houve check-in do fisioterapeuta para o cliente naquele dia (aparece junto do ícone de status).",
        ],
      },
    ],
  },

  // ===================== PACIENTES =====================
  {
    id: "pacientes",
    titulo: "Pacientes (Clientes)",
    icone: "🧑‍🤝‍🧑",
    resumo: "Cadastro e gestão de pacientes, com vínculo de filial e separação de check-ins.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.COMERCIAL,
      USER_ROLES.FISIOTERAPEUTA,
      USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    ],
    secoes: [
      {
        titulo: "Cadastrar um paciente",
        passos: [
          { titulo: "Novo paciente", descricao: "Na lista de pacientes, clique para adicionar um novo." },
          { titulo: "Dados pessoais", descricao: "Preencha Nome, Sexo, CPF (ou Documento se estrangeiro), Data de Nascimento e contato." },
          { titulo: "Unidade / Filial", descricao: "Selecione a filial do paciente. O campo é obrigatório no formulário." },
          { titulo: "Salvar", descricao: "Confira e salve." },
        ],
        regras: [
          "A filial é obrigatória no formulário, mas no banco o vínculo é opcional — pacientes antigos podem estar sem filial.",
        ],
      },
      {
        titulo: "Lista de pacientes",
        dicas: [
          "A coluna de sessões é separada em 'Sessões Plano' (baixas) e 'Check-in Fisio' (produtividade do fisioterapeuta).",
          "Use a busca/ordenação para localizar pacientes.",
        ],
      },
      {
        titulo: "Editar paciente",
        passos: [
          { titulo: "Abrir", descricao: "Clique no nome do paciente para abrir os detalhes/edição." },
          { titulo: "Atualizar", descricao: "Altere os dados e salve. O histórico de alterações fica registrado." },
        ],
      },
    ],
  },

  // ===================== FUNCIONÁRIOS =====================
  {
    id: "funcionarios",
    titulo: "Funcionários",
    icone: "👤",
    resumo: "Cadastro de funcionários e configuração de acesso ao sistema.",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Cadastrar/editar funcionário",
        passos: [
          { titulo: "Dados", descricao: "Preencha Nome, CPF, contato, cargo, unidade e cor (usada na agenda)." },
          { titulo: "Configurar acesso ao sistema", descricao: "Marque a opção para criar/atualizar o login do funcionário." },
          { titulo: "Usuário e senha automáticos", descricao: "Ao marcar, o sistema preenche o Nome de usuário (nome+sobrenome), gera uma Senha forte e puxa o E-mail empresa do cadastro. Todos editáveis." },
          { titulo: "Perfil", descricao: "Escolha o perfil (Fisioterapeuta, Administrativo, etc.) que define as permissões." },
          { titulo: "Salvar", descricao: "Salve para criar o funcionário e, se marcado, o acesso." },
        ],
      },
      {
        titulo: "Desativar/excluir funcionário",
        regras: [
          "Ao desativar (ou excluir) um funcionário, o acesso dele é invalidado automaticamente: a senha é trocada por um valor aleatório e ele não consegue mais logar.",
        ],
      },
    ],
  },

  // ===================== UNIDADES =====================
  {
    id: "unidades",
    titulo: "Unidades (Filiais)",
    icone: "🏢",
    resumo: "Cadastro das unidades/filiais da clínica.",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Cadastrar unidade",
        passos: [
          { titulo: "Dados da unidade", descricao: "Informe nome, endereço e, se houver, o gerente responsável." },
          { titulo: "Salvar", descricao: "A unidade fica disponível para vincular a pacientes, funcionários e eventos." },
        ],
      },
    ],
  },

  // ===================== CATEGORIAS / SUBCATEGORIAS =====================
  {
    id: "servicos",
    titulo: "Categorias e Serviços",
    icone: "🗂️",
    resumo: "Categorias e subcategorias que definem os serviços oferecidos (ex: Avaliação Inicial, Sessão Avulsa).",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Categoria de serviço",
        passos: [
          { titulo: "Criar categoria", descricao: "Cadastre a categoria (ex: 'Avaliação Inicial', 'Sessão Avulsa')." },
        ],
        dicas: [
          "Categorias que contêm 'Avaliação' são reconhecidas como serviços de avaliação para a baixa automática da agenda.",
        ],
      },
      {
        titulo: "Subcategoria de serviço",
        passos: [
          { titulo: "Criar subcategoria", descricao: "Vincule a subcategoria a uma categoria e defina o valor do serviço." },
        ],
      },
    ],
  },

  // ===================== TRATAMENTO E SESSÃO =====================
  {
    id: "ordem-servico",
    titulo: "Tratamento e Sessão (Ordem de Serviço)",
    icone: "📝",
    resumo: "Ordens de serviço (planos) do paciente, com quantidade de sessões e acompanhamento.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.COMERCIAL,
      USER_ROLES.FISIOTERAPEUTA,
      USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    ],
    secoes: [
      {
        titulo: "Criar ordem de serviço",
        passos: [
          { titulo: "Selecionar paciente", descricao: "Escolha o cliente da ordem de serviço." },
          { titulo: "Serviços e valores", descricao: "Adicione os serviços (categoria/subcategoria) e a quantidade total de sessões." },
          { titulo: "Pagamento", descricao: "Defina forma de pagamento, valores e descontos." },
          { titulo: "Salvar", descricao: "A ordem fica ativa e disponível para receber check-ins." },
        ],
      },
      {
        titulo: "Acompanhamento de sessões",
        dicas: [
          "As colunas mostram 'Sessões Plano X/Total' (baixas) e 'Check-in Fisio Y/Total' (produtividade).",
          "Somente o check-in do tipo Plano (baixa) consome a sessão do paciente.",
        ],
      },
    ],
  },

  // ===================== GERENCIAR CHECK-INS =====================
  {
    id: "checkins",
    titulo: "Gerenciar Check-ins",
    icone: "✔️",
    resumo: "Listagem e gestão dos check-ins (sessões) registrados.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    ],
    secoes: [
      {
        titulo: "Visualizar e filtrar",
        dicas: [
          "Cada check-in mostra data, hora, status, tipo (Fisio/Plano) e quem registrou.",
          "Use para auditar baixas e produtividade.",
        ],
      },
    ],
  },

  // ===================== ACESSOS CLIENTES =====================
  {
    id: "acessos-clientes",
    titulo: "Acessos de Clientes",
    icone: "🔑",
    resumo: "Gestão do acesso dos clientes ao portal.",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Conceder/gerenciar acesso",
        passos: [
          { titulo: "Localizar cliente", descricao: "Busque o cliente na listagem." },
          { titulo: "Acesso", descricao: "Crie ou ajuste as credenciais de acesso do cliente ao portal." },
        ],
      },
    ],
  },

  // ===================== WHATSAPP =====================
  {
    id: "whatsapp",
    titulo: "WhatsApp (Atendimento)",
    icone: "💬",
    resumo: "Atendimento e histórico de conversas de WhatsApp integradas ao sistema.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.COMERCIAL,
    ],
    secoes: [
      {
        titulo: "Atendimento",
        dicas: [
          "As mensagens trocadas ficam registradas e visíveis na tela de atendimento.",
          "Use para acompanhar o contato com o paciente.",
        ],
      },
    ],
  },

  // ===================== FINANCEIRO =====================
  {
    id: "financeiro",
    titulo: "Financeiro",
    icone: "💰",
    resumo: "Gestão financeira: despesas, entradas e parcelas.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.FINANCEIRO,
    ],
    secoes: [
      {
        titulo: "Gestão financeira",
        passos: [
          { titulo: "Lançar despesa/receita", descricao: "Registre transações financeiras vinculadas (ou não) a ordens de serviço." },
          { titulo: "Parcelas", descricao: "Acompanhe parcelas, vencimentos e pagamentos." },
        ],
        dicas: [
          "O perfil Financeiro tem acesso de leitura às demais áreas operacionais.",
        ],
      },
    ],
  },

  // ===================== NOTIFICAÇÕES =====================
  {
    id: "notificacoes",
    titulo: "Notificações",
    icone: "🔔",
    resumo: "Envio e histórico de notificações internas.",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Enviar notificação",
        passos: [
          { titulo: "Compor", descricao: "Defina destinatários e a mensagem." },
          { titulo: "Enviar", descricao: "A notificação é entregue e fica registrada no histórico." },
        ],
      },
      {
        titulo: "Histórico",
        dicas: ["Consulte as notificações enviadas e quem visualizou."],
      },
    ],
  },

  // ===================== E-MAIL =====================
  {
    id: "email",
    titulo: "E-mail",
    icone: "📧",
    resumo: "Configuração e disparo de e-mails/relatórios.",
    roles: ADMIN_ADMINISTRATIVO,
    secoes: [
      {
        titulo: "Configurações",
        passos: [
          { titulo: "Configurar", descricao: "Defina os parâmetros de envio de e-mail." },
        ],
      },
      {
        titulo: "Disparar",
        passos: [
          { titulo: "Disparo", descricao: "Envie e-mails/relatórios conforme a necessidade." },
        ],
      },
    ],
  },

  // ===================== RELATÓRIOS =====================
  {
    id: "relatorios",
    titulo: "Relatórios",
    icone: "📊",
    resumo: "Relatórios de Agenda, Financeiro e Operacional.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.FINANCEIRO,
    ],
    secoes: [
      {
        titulo: "Gerar relatórios",
        dicas: [
          "Escolha o tipo (Agenda, Financeiro ou Operacional) e o período desejado.",
          "Use os relatórios para acompanhar a operação e tomar decisões.",
        ],
      },
    ],
  },

  // ===================== DASHBOARD =====================
  {
    id: "dashboard",
    titulo: "Dashboard",
    icone: "📈",
    resumo: "Painéis Financeiro, Operação e Lead com indicadores e gráficos.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.ADMINISTRATIVO,
      USER_ROLES.FINANCEIRO,
      USER_ROLES.COORDENADOR_FISIOTERAPEUTA,
    ],
    secoes: [
      {
        titulo: "Painéis disponíveis",
        dicas: [
          "Operação: pacientes ativos, sessões, produtividade dos fisioterapeutas, patologias e clientes por filial.",
          "Financeiro: faturamento, despesas e entradas.",
          "Use os filtros de período para ajustar os indicadores.",
        ],
      },
    ],
  },

  // ===================== LOGS =====================
  {
    id: "logs",
    titulo: "Logs",
    icone: "📜",
    resumo: "Auditoria de ações críticas do sistema.",
    roles: [USER_ROLES.ADMINISTRADOR],
    secoes: [
      {
        titulo: "Consultar logs",
        dicas: [
          "Registra ações críticas (cadastros, alterações, exclusões) com usuário, data e dispositivo.",
          "Use para auditoria e investigação.",
        ],
      },
    ],
  },
];
