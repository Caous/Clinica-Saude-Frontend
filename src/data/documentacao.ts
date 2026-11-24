import { USER_ROLES } from "../services/util/rolePermissions";
import { buildCustomerImportCsvTemplate } from "../utils/customerImportTemplate";

export interface DocStep {
  titulo: string;
  descricao: string;
}

/** Arquivo gerado no navegador (sem backend) e oferecido para download. */
export interface DocDownload {
  /** Texto do botão. */
  label: string;
  /** Nome sugerido do arquivo baixado (ex.: "modelo-importacao-pacientes.csv"). */
  filename: string;
  /** MIME type do arquivo (ex.: "text/csv;charset=utf-8"). */
  mime: string;
  /** Conteúdo do arquivo, embutido no dado (nenhuma chamada ao backend). */
  content?: string;
  /** Gera o conteúdo com o nome da marca configurada. Use `content` OU `buildContent`. */
  buildContent?: (brandName: string) => string;
}

export interface DocSection {
  titulo: string;
  intro?: string;
  passos?: DocStep[];
  regras?: string[];
  dicas?: string[];
  downloads?: DocDownload[];
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
        titulo: "Quem vê o quê (visualização por perfil)",
        intro:
          "A Agenda mostra conteúdos diferentes conforme o perfil de quem está logado. Isso evita que um profissional veja a agenda de outro e organiza o que cada um pode fazer.",
        regras: [
          "Fisioterapeuta: vê APENAS a própria agenda (os eventos em que ele é o fisioterapeuta). Não vê a agenda dos colegas.",
          "Coordenador de Fisioterapia: vê a agenda de TODOS os fisioterapeutas, sem filtro — é a visão de coordenação.",
          "Administrador e Administrativo: veem todas as agendas e são os únicos que podem CRIAR, EDITAR (todos os campos) e EXCLUIR eventos.",
          "Comercial: também enxerga a agenda para acompanhar os agendamentos.",
          "Fisioterapeuta e Coordenador só podem MUDAR O STATUS do evento (ex.: Confirmado, Finalizado). Não conseguem trocar cliente, fisioterapeuta ou data/hora, nem excluir.",
        ],
        dicas: [
          "Se você é fisioterapeuta e não encontra um agendamento, confirme com o administrativo se o evento foi criado com você como responsável — só assim ele aparece na sua agenda.",
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
          { titulo: "Novo paciente", descricao: "Na lista de pacientes, clique no botão para adicionar um novo paciente." },
          { titulo: "Dados pessoais", descricao: "Preencha Nome, Sexo, CPF (ou Documento, se for estrangeiro), Data de Nascimento e o contato (telefone/e-mail)." },
          { titulo: "Endereço", descricao: "Informe o endereço quando disponível — ajuda em relatórios e no contato." },
          { titulo: "Unidade / Filial", descricao: "Selecione a filial do paciente. O campo é obrigatório no formulário." },
          { titulo: "Salvar", descricao: "Confira os dados e clique em Salvar. O paciente passa a aparecer na lista." },
        ],
        regras: [
          "A filial é obrigatória no formulário, mas no banco o vínculo é opcional — pacientes antigos podem estar sem filial.",
          "Estrangeiro: sem CPF de 11 dígitos, use o campo Documento. Isso afeta a criação de acesso ao portal (ver módulo Acessos de Clientes).",
        ],
      },
      {
        titulo: "Listar e buscar pacientes",
        intro:
          "A lista mostra todos os pacientes com suas informações principais e o andamento das sessões.",
        dicas: [
          "Use a busca por nome para localizar rapidamente. A busca ignora acentos (ex.: 'joao' encontra 'João').",
          "A contagem de sessões é separada em duas colunas: 'Sessões Plano' (as baixas que consomem o plano do paciente) e 'Check-in Fisio' (a produtividade registrada pelo fisioterapeuta).",
          "Clique nos cabeçalhos para ordenar a lista.",
        ],
      },
      {
        titulo: "Abrir o paciente (modal de informações)",
        intro:
          "Clicar no NOME do paciente na lista abre um modal (janela) com as informações completas dele — dados pessoais, contato e histórico.",
        passos: [
          { titulo: "Clicar no nome", descricao: "Na lista, clique sobre o nome do paciente." },
          { titulo: "Ver informações", descricao: "O modal exibe os detalhes do paciente e o histórico de alterações." },
          { titulo: "Editar", descricao: "A partir desse modal você pode editar os dados e salvar. O histórico de alterações fica registrado." },
        ],
      },
      {
        titulo: "Editar e excluir paciente",
        passos: [
          { titulo: "Editar", descricao: "Abra o paciente pelo nome, altere os campos desejados e salve." },
          { titulo: "Excluir", descricao: "Use a ação de excluir na lista/modal quando o cadastro for indevido ou duplicado." },
        ],
        regras: [
          "Excluir um paciente é uma ação sensível: prefira corrigir o cadastro. Só exclua duplicidades ou cadastros de teste.",
        ],
      },
      {
        titulo: "Botão Check-in (dentro de Pacientes)",
        intro:
          "Na rota de Pacientes há um botão de Check-in que permite registrar uma sessão diretamente, sem precisar abrir a Agenda. É um atalho para quem faz o atendimento.",
        passos: [
          { titulo: "Localizar o paciente", descricao: "Encontre o paciente na lista." },
          { titulo: "Clicar em Check-in", descricao: "Abre o modal 'Sessão de Fisioterapia' com data e hora já preenchidas." },
          { titulo: "Selecionar a ordem de serviço", descricao: "Escolha o plano (ordem de serviço) que vai receber a sessão e preencha o histórico/conduta." },
          { titulo: "Confirmar", descricao: "Clique em Check-in para registrar a sessão." },
        ],
        regras: [
          "Fisioterapeuta registra check-in do tipo Fisio (produtividade); Administrativo/Administrador registra o tipo Plano (baixa que consome a sessão).",
          "As mesmas regras da Agenda valem aqui: fisioterapeuta não faz check-in Fisio após 48h e não repete o mesmo tipo de check-in no mesmo plano e dia.",
        ],
      },
      {
        titulo: "Importar pacientes por planilha (Excel/CSV)",
        intro:
          "Para cadastrar muitos pacientes de uma vez, use a importação por planilha. O sistema lê o arquivo e cria os pacientes automaticamente. Baixe o modelo abaixo, preencha e envie.",
        passos: [
          { titulo: "Baixar o modelo", descricao: "Clique em 'Baixar modelo CSV' e abra o arquivo no Excel ou no Google Planilhas." },
          { titulo: "Preencher os dados", descricao: "Comece a preencher a partir da 5ª linha da planilha (as 4 primeiras são título, instruções e cabeçalho e são ignoradas na importação). Use uma linha por paciente, respeitando a ordem das colunas: Nº, Nome, Telefone, CPF, Data de Nascimento e E-mail." },
          { titulo: "Enviar o arquivo", descricao: "Na tela de Pacientes, use a opção de importar e selecione o arquivo preenchido." },
          { titulo: "Conferir", descricao: "Ao final, o sistema informa quantos pacientes foram cadastrados." },
        ],
        regras: [
          "Colunas lidas pela importação: Nome (obrigatório), Telefone, CPF (obrigatório e válido — 11 dígitos), Data de Nascimento e E-mail.",
          "A coluna 'Nº' é só de organização e NÃO é importada — mas mantenha-a, pois é ela que deixa o Nome na coluna certa.",
          "Linha sem Nome ou com CPF inválido é ignorada automaticamente (não gera erro, apenas não cadastra aquela linha).",
          "CPF deve vir só com números, sem pontos nem traços. Telefone também: apenas dígitos com DDD.",
          "Se a Data de Nascimento estiver em branco ou inválida, o sistema assume a data atual.",
        ],
        dicas: [
          "Na planilha de importação, os dados dos pacientes começam na 5ª linha. As 4 primeiras linhas (título, instruções, linha em branco e cabeçalho) são ignoradas pela importação — não as remova nem altere.",
          "O modelo abaixo já vem nesse formato: um CSV com essas 4 linhas iniciais e uma linha de exemplo na 5ª linha, pronto para preencher. O import oficial é um Excel (.xlsx) com essas mesmas colunas e o mesmo layout.",
        ],
        downloads: [
          {
            label: "Baixar modelo CSV",
            filename: "modelo-importacao-pacientes.csv",
            mime: "text/csv;charset=utf-8",
            buildContent: buildCustomerImportCsvTemplate,
          },
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
        titulo: "Cadastrar um funcionário",
        passos: [
          { titulo: "Novo funcionário", descricao: "Abra o cadastro de funcionários e comece um novo registro." },
          { titulo: "Dados", descricao: "Preencha Nome, CPF, contato, cargo, unidade e a Cor (essa cor identifica o profissional na Agenda)." },
          { titulo: "Salvar", descricao: "Salve para criar o funcionário. Se você não configurar o acesso, ele fica apenas como cadastro (sem login no sistema)." },
        ],
      },
      {
        titulo: "Configurar o acesso do funcionário ao sistema",
        intro:
          "O acesso é o login que o funcionário usa para entrar no sistema. Um funcionário pode existir só como cadastro (sem login) ou ter um usuário vinculado. Essa é a relação funcionário ↔ usuário.",
        passos: [
          { titulo: "Marcar 'Configurar acesso ao sistema'", descricao: "No formulário do funcionário, marque essa opção para criar ou atualizar o login dele." },
          { titulo: "Usuário e senha automáticos", descricao: "Ao marcar, o sistema já preenche o Nome de usuário (nome + sobrenome), gera uma Senha forte e puxa o E-mail da empresa do cadastro. Todos esses campos são editáveis." },
          { titulo: "Escolher o Perfil (role)", descricao: "Selecione o perfil — Fisioterapeuta, Coordenador de Fisioterapia, Administrativo, Comercial, Financeiro ou Administrador. É o perfil que define o que a pessoa pode ver e fazer." },
          { titulo: "Salvar", descricao: "Ao salvar, o login é criado/atualizado. Anote a senha gerada e repasse ao funcionário com segurança." },
        ],
        regras: [
          "O perfil (role) controla as permissões: cada perfil vê menus e ações diferentes. Ex.: Fisioterapeuta vê só a própria agenda; Financeiro tem acesso de leitura às áreas operacionais.",
          "Editar o acesso permite trocar o perfil, redefinir a senha e atualizar o e-mail do login.",
        ],
        dicas: [
          "Jargão: 'role' é o mesmo que 'perfil de acesso'. É a etiqueta que diz o que o usuário pode fazer no sistema.",
        ],
      },
      {
        titulo: "Editar, desativar ou excluir funcionário",
        passos: [
          { titulo: "Editar", descricao: "Abra o funcionário, altere os dados ou o acesso e salve." },
          { titulo: "Desativar/Excluir", descricao: "Use a ação correspondente quando o funcionário deixar a clínica." },
        ],
        regras: [
          "Ao desativar (ou excluir) um funcionário, o acesso dele é invalidado automaticamente: a senha é trocada por um valor aleatório e ele não consegue mais entrar no sistema.",
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
          { titulo: "Nova unidade", descricao: "Abra o cadastro de unidades e inicie um novo registro." },
          { titulo: "Dados da unidade", descricao: "Informe nome, endereço e, se houver, o gerente responsável." },
          { titulo: "Salvar", descricao: "A unidade fica disponível para vincular a pacientes, funcionários e eventos." },
        ],
      },
      {
        titulo: "Editar unidade",
        passos: [
          { titulo: "Abrir", descricao: "Na lista de unidades, selecione a unidade que deseja alterar." },
          { titulo: "Atualizar", descricao: "Altere nome, endereço ou responsável e salve. As alterações passam a valer para os novos vínculos." },
        ],
        dicas: [
          "Alterar o nome da unidade muda como ela aparece nos filtros e relatórios em todo o sistema.",
        ],
      },
      {
        titulo: "Excluir unidade",
        passos: [
          { titulo: "Localizar", descricao: "Encontre a unidade na lista." },
          { titulo: "Excluir", descricao: "Use a ação de excluir para remover a unidade." },
        ],
        regras: [
          "Só exclua uma unidade que não esteja mais em uso. Unidades com pacientes, funcionários ou eventos vinculados devem ser mantidas para não perder o histórico.",
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
        titulo: "Como funciona: categoria e subcategoria",
        intro:
          "Os serviços são organizados em dois níveis. A CATEGORIA é o grupo geral (ex.: 'Avaliação Inicial', 'Sessão Avulsa', 'Pilates'). A SUBCATEGORIA é a variação específica dentro da categoria, e é nela que fica o VALOR do serviço.",
        dicas: [
          "Pense na categoria como a 'pasta' e na subcategoria como o 'item com preço' dentro dela.",
          "Ao montar uma Ordem de Serviço (plano), você escolhe a subcategoria — por isso o valor vem dela.",
        ],
      },
      {
        titulo: "Criar categoria",
        passos: [
          { titulo: "Nova categoria", descricao: "Abra o cadastro de categorias e crie um novo grupo (ex.: 'Avaliação Inicial', 'Sessão Avulsa')." },
          { titulo: "Salvar", descricao: "A categoria fica disponível para receber subcategorias." },
        ],
        dicas: [
          "Categorias cujo nome contém 'Avaliação' são reconhecidas como serviços de avaliação — isso guia a baixa automática da Agenda para a ordem de serviço de avaliação do paciente.",
        ],
      },
      {
        titulo: "Criar subcategoria",
        passos: [
          { titulo: "Nova subcategoria", descricao: "Abra o cadastro de subcategorias." },
          { titulo: "Vincular à categoria", descricao: "Escolha a categoria à qual essa subcategoria pertence." },
          { titulo: "Definir valor", descricao: "Informe o valor do serviço e salve." },
        ],
      },
      {
        titulo: "Editar e excluir",
        passos: [
          { titulo: "Editar", descricao: "Selecione a categoria ou subcategoria, altere os dados (nome ou valor) e salve." },
          { titulo: "Excluir", descricao: "Remova categorias/subcategorias que não são mais oferecidas." },
        ],
        regras: [
          "Evite excluir itens já usados em ordens de serviço antigas, para preservar o histórico e os relatórios.",
        ],
      },
      {
        titulo: "Filtrar e localizar",
        dicas: [
          "Use a busca e os filtros da tela para encontrar rapidamente uma categoria ou subcategoria específica.",
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
        titulo: "O que é a Ordem de Serviço (plano)",
        intro:
          "A Ordem de Serviço (OS) é o plano de tratamento do paciente: quantas sessões ele contratou, quais serviços, quanto pagou e como. É a OS que 'segura' as sessões que serão consumidas nos check-ins.",
      },
      {
        titulo: "Cadastrar ordem de serviço",
        passos: [
          { titulo: "Selecionar paciente", descricao: "Escolha o cliente da ordem de serviço." },
          { titulo: "Serviços e valores", descricao: "Adicione os serviços (categoria/subcategoria) e a quantidade total de sessões contratadas." },
          { titulo: "Definir as datas", descricao: "Preencha a Data de pagamento e a Data do plano (competência) — veja a seção específica sobre a diferença entre elas." },
          { titulo: "Forma de pagamento", descricao: "Defina forma de pagamento, valores e descontos. Se necessário, ative o Pagamento Misto (sinal + restante)." },
          { titulo: "Salvar", descricao: "A ordem fica ativa e disponível para receber check-ins. Ao salvar, o sistema também cria a transação financeira correspondente." },
        ],
        regras: [
          "A Data do plano (competência) é obrigatória. É ela que o faturamento do dashboard usa.",
          "Ao criar a OS, a transação financeira já entra com status Concluída (regra de negócio: nova OS sobe como concluída).",
        ],
      },
      {
        titulo: "Pagamento Misto (sinal + restante)",
        intro:
          "O Pagamento Misto divide o valor em duas partes: um SINAL pago agora e o RESTANTE pago depois. Use quando o paciente dá uma entrada e paga o restante em outra data/forma.",
        passos: [
          { titulo: "Ativar o Pagamento Misto", descricao: "Ligue a chave 'Pagamento Misto (Sinal + Restante)' no formulário." },
          { titulo: "Informar o sinal", descricao: "Preencha o Valor do Sinal, a Forma de Pagamento do Sinal e a Conta do Sinal." },
          { titulo: "Definir o restante", descricao: "Informe a data de vencimento do valor restante (quando o resto será pago)." },
          { titulo: "Salvar", descricao: "O sistema registra o sinal (agora) e o restante (depois) na mesma ordem de serviço." },
        ],
        regras: [
          "O Valor do Sinal deve ser maior que zero e menor que o valor total do plano.",
          "Forma de pagamento e conta do sinal são obrigatórias quando o Pagamento Misto está ativo.",
        ],
      },
      {
        titulo: "Data de pagamento x Data do plano (competência)",
        intro:
          "São duas datas diferentes e é importante não confundir. A Data de pagamento é QUANDO o dinheiro entrou. A Data do plano (competência) é o MÊS a que aquele plano se refere — é ela que o faturamento do dashboard usa para saber em qual mês contar a venda.",
        regras: [
          "Data de pagamento: registra quando o pagamento foi efetivamente feito.",
          "Data do plano (competência): define em que mês/período aquela venda entra no faturamento. Se ficar em branco, o sistema usaria a data de hoje — por isso ela é obrigatória.",
          "Use a competência para lançar planos retroativos sem bagunçar o faturamento do mês atual.",
        ],
        dicas: [
          "Exemplo numérico (plano retroativo): hoje é 13/07. Um paciente fechou um plano de R$ 1.200 em 28/06, mas você só está lançando agora. Coloque Data de pagamento = 13/07 (quando de fato entrou/está sendo lançado) e Data do plano (competência) = 28/06. Assim, os R$ 1.200 entram no faturamento de JUNHO (mês correto da venda), e não inflam o faturamento de julho.",
          "Se você deixasse a competência em julho, o dashboard mostraria R$ 1.200 a mais em julho e R$ 1.200 a menos em junho — distorcendo os dois meses.",
        ],
      },
      {
        titulo: "Editar e excluir ordem de serviço",
        passos: [
          { titulo: "Editar", descricao: "Abra a OS, ajuste serviços, sessões, valores ou datas e salve." },
          { titulo: "Excluir", descricao: "Remova ordens criadas por engano. Prefira corrigir a excluir, para preservar o financeiro e o histórico de sessões." },
        ],
      },
      {
        titulo: "Acompanhamento de sessões",
        dicas: [
          "As colunas mostram 'Sessões Plano X/Total' (baixas) e 'Check-in Fisio Y/Total' (produtividade).",
          "Somente o check-in do tipo Plano (baixa) consome a sessão do paciente. O check-in Fisio conta a produtividade e não desconta do plano.",
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
        titulo: "O que é esta tela",
        intro:
          "Aqui ficam listados todos os check-ins (sessões) já registrados no sistema, sejam do tipo Fisio (produtividade do fisioterapeuta) ou Plano (baixa que consome a sessão do paciente). É a tela para auditar e corrigir registros.",
      },
      {
        titulo: "Visualizar e filtrar",
        dicas: [
          "Cada check-in mostra data, hora, status, tipo (Fisio/Plano) e quem registrou.",
          "Use os filtros para localizar check-ins por paciente, período ou tipo.",
          "Use esta tela para auditar as baixas dos planos e a produtividade dos fisioterapeutas.",
        ],
      },
      {
        titulo: "Excluir um check-in",
        passos: [
          { titulo: "Localizar o check-in", descricao: "Use os filtros para encontrar o registro específico que precisa ser removido." },
          { titulo: "Conferir os dados", descricao: "Confirme paciente, data, tipo (Fisio ou Plano) e quem registrou antes de excluir." },
          { titulo: "Excluir", descricao: "Use a ação de excluir e confirme." },
        ],
        regras: [
          "Excluir um check-in do tipo Plano DEVOLVE a sessão ao plano do paciente (o contador 'Sessões Plano' diminui). Ou seja, aquela sessão volta a ficar disponível.",
          "Excluir um check-in do tipo Fisio reduz a contagem de produtividade daquele fisioterapeuta no dia.",
        ],
      },
      {
        titulo: "Quando e por que excluir",
        intro:
          "Excluir check-in é uma correção — não é rotina. Faça apenas quando o registro estiver errado.",
        dicas: [
          "Exclua quando houver duplicidade (dois check-ins para a mesma sessão), quando a baixa caiu no paciente ou plano errado, ou quando o atendimento não aconteceu de fato.",
          "Antes de excluir uma baixa (tipo Plano), lembre que a sessão volta para o plano — confira se é isso mesmo que você quer.",
          "Na dúvida, confirme com o administrativo/coordenação antes de excluir, pois a exclusão afeta a contagem de sessões e os relatórios.",
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
        titulo: "O que é o acesso ao portal",
        intro:
          "O portal do cliente é uma área onde o paciente entra para acompanhar o próprio tratamento. Nesta tela você cria e gerencia o login (usuário e senha) de cada cliente. A lista mostra quem já tem acesso e se ele está ativo ou desativado.",
      },
      {
        titulo: "Criar o acesso de um cliente",
        passos: [
          { titulo: "Localizar o cliente", descricao: "Busque o cliente na listagem de acessos." },
          { titulo: "Gerar acesso", descricao: "Use a ação de gerar/criar acesso. O sistema cria o login automaticamente." },
          { titulo: "Anotar a senha", descricao: "A senha é mostrada no momento da criação. Anote e repasse ao cliente com segurança — ela não fica visível depois." },
        ],
        regras: [
          "O nome de usuário do portal é o CPF do cliente (só números, 11 dígitos).",
          "Clientes estrangeiros (sem CPF válido de 11 dígitos) NÃO recebem acesso — o sistema pula esses cadastros e informa o motivo.",
          "Se o cliente já tem acesso ativo, o sistema avisa que ele já possui acesso e não cria outro.",
        ],
      },
      {
        titulo: "Como a senha é gerada",
        intro:
          "A senha é criada automaticamente pelo sistema — você não digita uma senha manualmente.",
        regras: [
          "A senha é aleatória, com 12 caracteres, misturando letras maiúsculas, minúsculas e números.",
          "O sistema garante que toda senha tenha pelo menos uma letra maiúscula, uma minúscula e um número (senha forte).",
          "A senha só aparece uma vez, na hora da criação/reativação. Por isso é importante copiá-la e enviar ao cliente na hora.",
        ],
        dicas: [
          "Se o cliente perder a senha, gere o acesso novamente (reativar) para obter uma nova.",
        ],
      },
      {
        titulo: "Ativar e desativar o acesso",
        intro:
          "Ativar e desativar controla se o cliente CONSEGUE OU NÃO entrar no portal, sem apagar o cadastro dele.",
        regras: [
          "Desativar: bloqueia o login. O cliente deixa de conseguir entrar no portal imediatamente, mas o cadastro e o histórico são preservados (é um bloqueio, não uma exclusão).",
          "Ativar (reativar) um cliente que estava desativado: libera o login de novo e GERA UMA NOVA SENHA — a senha anterior deixa de valer, então repasse a nova ao cliente.",
          "Enquanto estiver desativado, qualquer tentativa de login do cliente é recusada.",
        ],
        dicas: [
          "Use 'desativar' quando quiser suspender o acesso temporariamente (ex.: fim do tratamento) sem perder os dados.",
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
        titulo: "Para que serve",
        intro:
          "Este módulo integra as conversas de WhatsApp ao sistema. As mensagens trocadas com os pacientes ficam registradas aqui, para que a recepção e o comercial acompanhem o atendimento sem sair do sistema.",
      },
      {
        titulo: "Como funciona o atendimento",
        passos: [
          { titulo: "Abrir uma conversa", descricao: "Na lista de contatos/conversas, selecione o paciente para ver o histórico de mensagens." },
          { titulo: "Ler o histórico", descricao: "Todas as mensagens enviadas e recebidas aparecem em ordem, como em um chat." },
          { titulo: "Responder", descricao: "Responda pela própria tela — a mensagem é enviada ao WhatsApp do paciente e fica registrada no histórico." },
          { titulo: "Marcar como lida", descricao: "Ao abrir a conversa, ela pode ser marcada como lida, ajudando a controlar o que ainda falta responder." },
        ],
        dicas: [
          "As mensagens são salvas automaticamente pela integração — nada se perde ao fechar a tela.",
          "Use o histórico para retomar o contato de onde parou, mesmo que outro atendente tenha respondido antes.",
        ],
      },
      {
        titulo: "Bom saber",
        dicas: [
          "A integração conecta o WhatsApp ao sistema por trás dos panos; para você, funciona como uma caixa de mensagens dentro do sistema.",
          "Se as mensagens pararem de chegar, avise o time técnico — pode ser a conexão da integração que precisa ser restabelecida.",
        ],
      },
    ],
  },

  // ===================== FINANCEIRO =====================
  {
    id: "financeiro",
    titulo: "Financeiro",
    icone: "💰",
    resumo: "Gestão financeira: lançamentos (despesas e recebimentos), status, parcelas e contadores.",
    roles: [
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.FINANCEIRO,
    ],
    secoes: [
      {
        titulo: "O que é a Gestão Financeira",
        intro:
          "Esta tela controla todas as saídas (despesas) e entradas (recebimentos) da clínica. No topo há 6 contadores que resumem o mês; abaixo, o grid (tabela) com cada lançamento e seus botões de ação.",
      },
      {
        titulo: "Criar um lançamento",
        passos: [
          { titulo: "Novo Lançamento", descricao: "Clique em 'Novo Lançamento' para abrir o formulário." },
          { titulo: "Tipo", descricao: "Escolha se é Despesa/Saída ou Recebimento/Entrada." },
          { titulo: "Dados", descricao: "Informe descrição, valor, forma de pagamento, conta, filial e, se for o caso, o cliente e a ordem de serviço." },
          { titulo: "Parcelas", descricao: "Se houver parcelamento, defina as parcelas e vencimentos." },
          { titulo: "Salvar", descricao: "O lançamento entra no grid com o status inicial (geralmente Pendente)." },
        ],
      },
      {
        titulo: "Editar e excluir lançamentos",
        passos: [
          { titulo: "Editar status", descricao: "Use o botão 'Status' na linha para avançar o lançamento (ex.: de Pendente para Aprovada, depois Concluída)." },
          { titulo: "Excluir", descricao: "Use o botão 'Excluir' na linha para remover um lançamento indevido." },
        ],
        regras: [
          "Perfis de leitura (Financeiro somente-leitura) enxergam os dados, mas os botões de criar/editar/excluir ficam ocultos.",
        ],
      },
      {
        titulo: "Status e o efeito nos botões do grid",
        intro:
          "Cada lançamento tem um status: Pendente, Aprovada, Concluída ou Cancelada. O status controla quais botões ficam disponíveis na linha.",
        regras: [
          "Pendente: aguardando aprovação. Todos os botões da linha (Status, Excluir, Parcelas) ficam ativos.",
          "Aprovada: autorizada, mas ainda não paga/concluída. Ainda dá para mudar o status, excluir e ver parcelas.",
          "Concluída: lançamento finalizado (pago). Os botões Status, Excluir e Parcelas ficam DESABILITADOS — é um estado final e travado.",
          "Cancelada: lançamento anulado. Também é estado final: os botões Status, Excluir e Parcelas ficam DESABILITADOS.",
          "O botão 'Pagamento' só aparece quando a forma de pagamento é 'A Definir' e o lançamento não está Cancelado — serve para definir a forma depois.",
          "Para marcar como Concluída um lançamento de crédito com parcelas, TODAS as parcelas precisam estar pagas; senão o sistema bloqueia e avisa.",
        ],
        dicas: [
          "Resumindo: Concluída e Cancelada 'travam' a linha (nada mais é editado); Pendente e Aprovada ainda permitem ações.",
        ],
      },
      {
        titulo: "Entendendo os 6 contadores do topo",
        intro:
          "Os cartões no topo resumem o período filtrado (por padrão, o mês atual, do dia 1 ao último dia). Ao mudar os filtros de data, unidade, cliente, forma de pagamento ou tipo, os contadores se ajustam.",
        regras: [
          "Recebimento esperado (verde): soma das entradas/recebimentos esperados no mês. É o que a clínica espera receber no período.",
          "Despesas (vermelho): soma dos gastos aprovados no mês. Mostra quanto está saindo do caixa.",
          "Saldo Líquido (azul/vermelho): Recebimento esperado menos Despesas. Se positivo, é 'Lucro' esperado do mês; se negativo, 'Déficit'.",
          "Transações Pendentes (amarelo): soma dos lançamentos que ainda aguardam aprovação. É dinheiro/compromisso que ainda não foi confirmado.",
          "Total Aprovado (índigo): soma do que foi aprovado dentro do período filtrado.",
          "Total Concluído (verde-esmeralda): soma do que foi efetivamente concluído (pago) dentro do período filtrado.",
        ],
        dicas: [
          "Recebimento esperado e Despesas seguem sempre o mês corrente; Total Aprovado e Total Concluído seguem exatamente o período que você filtrou.",
          "Os valores vêm dos próprios lançamentos: mudar o status de um lançamento (ex.: concluir um recebimento) altera os contadores correspondentes.",
        ],
      },
      {
        titulo: "Filtrar e conferir",
        dicas: [
          "Use os filtros (data, unidade, cliente, forma de pagamento, tipo, status) para focar em um conjunto específico de lançamentos.",
          "O contador de transações no cabeçalho mostra quantos lançamentos existem no período e o nome do mês.",
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
        titulo: "Para que serve",
        intro:
          "As notificações são avisos internos enviados aos usuários do sistema (equipe). Servem para comunicar lembretes, orientações e informações importantes que aparecem para quem usa o sistema.",
      },
      {
        titulo: "Adicionar (enviar) uma notificação",
        passos: [
          { titulo: "Nova notificação", descricao: "Abra o envio de notificações." },
          { titulo: "Compor", descricao: "Escolha os destinatários (perfis/usuários) e escreva a mensagem, com título e conteúdo." },
          { titulo: "Enviar", descricao: "Confirme o envio. A notificação é entregue e passa a constar no histórico." },
        ],
        regras: [
          "O envio de notificações é restrito ao Administrador; os demais perfis conseguem consultar o histórico.",
        ],
      },
      {
        titulo: "Editar uma notificação",
        passos: [
          { titulo: "Localizar", descricao: "Encontre a notificação no histórico/lista." },
          { titulo: "Editar", descricao: "Ajuste o título ou o conteúdo e salve as alterações." },
        ],
      },
      {
        titulo: "Excluir uma notificação",
        passos: [
          { titulo: "Localizar", descricao: "Encontre a notificação na lista." },
          { titulo: "Excluir", descricao: "Remova a notificação que não é mais necessária." },
        ],
      },
      {
        titulo: "Histórico",
        dicas: [
          "Consulte as notificações já enviadas.",
          "Todos os perfis (exceto Cliente) podem acompanhar o histórico de notificações.",
        ],
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
        titulo: "Como funciona o envio de e-mail",
        intro:
          "O sistema envia e-mails a partir de uma conta de e-mail configurada (servidor de envio, chamado de SMTP). Primeiro você configura essa conta uma vez; depois é possível disparar e-mails quando precisar.",
        dicas: [
          "Jargão: 'SMTP' é o servidor que efetivamente envia o e-mail — como a 'agência de correios' do sistema.",
        ],
      },
      {
        titulo: "Configurar o envio (SMTP)",
        passos: [
          { titulo: "Abrir configurações", descricao: "Acesse a configuração de e-mail do sistema." },
          { titulo: "Preencher os dados do servidor", descricao: "Informe o servidor de envio, porta, usuário/senha e o e-mail remetente, conforme fornecido pelo provedor de e-mail." },
          { titulo: "Salvar", descricao: "Depois de salvar, o sistema passa a poder enviar e-mails por essa conta." },
        ],
        regras: [
          "A configuração de e-mail é restrita ao Administrador.",
        ],
      },
      {
        titulo: "Disparar e-mails",
        passos: [
          { titulo: "Abrir o disparo", descricao: "Acesse a opção de enviar e-mail." },
          { titulo: "Definir destinatário e conteúdo", descricao: "Informe para quem enviar e o conteúdo/assunto." },
          { titulo: "Enviar", descricao: "O e-mail sai pela conta configurada." },
        ],
        dicas: [
          "Se o envio falhar, o problema costuma estar na configuração (usuário/senha ou servidor). Revise as configurações de SMTP.",
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
        titulo: "Relatórios disponíveis",
        intro:
          "Os relatórios reúnem os dados do sistema em uma visão consolidada para acompanhamento e tomada de decisão. Há três tipos:",
        regras: [
          "Relatório de Agenda: mostra os agendamentos e atendimentos do período (por status, fisioterapeuta, filial).",
          "Relatório Financeiro: consolida recebimentos e despesas do período — útil para o fechamento.",
          "Relatório Operacional: reúne indicadores da operação (sessões, produtividade, pacientes).",
        ],
      },
      {
        titulo: "Como gerar e filtrar",
        passos: [
          { titulo: "Escolher o tipo", descricao: "Selecione Agenda, Financeiro ou Operacional." },
          { titulo: "Definir o período", descricao: "Informe a data inicial e final desejadas." },
          { titulo: "Aplicar filtros", descricao: "Refine por filial, fisioterapeuta ou outros campos disponíveis para focar no que interessa." },
          { titulo: "Gerar", descricao: "Gere o relatório para visualizar/exportar os dados do período." },
        ],
        dicas: [
          "Comece com um período curto (ex.: o mês atual) e vá ampliando conforme a necessidade.",
          "Os relatórios são restritos a Administrador e Administrativo.",
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
        titulo: "Como ler o Dashboard",
        intro:
          "O Dashboard reúne indicadores em painéis. Todos os gráficos respeitam os filtros no topo (período, filial e outros): ao mudar o filtro, os gráficos se recalculam. Passe o mouse sobre os pontos/fatias para ver os valores exatos.",
        dicas: [
          "Há painéis diferentes conforme o perfil: Financeiro, Operação e Lead. Você vê os painéis liberados para o seu perfil.",
        ],
      },
      {
        titulo: "Painel Financeiro — cartões de resumo",
        intro:
          "No topo do painel financeiro há cartões (contadores) com Faturamento Esperado, Faturamento Real, % Recebido, Total de Despesas, Despesas Pagas e Despesas Pendentes, além de recortes por Mês, Semana e Dia.",
        dicas: [
          "Faturamento Esperado: total que a clínica espera receber (ordens Aprovadas ou Concluídas).",
          "Faturamento Real: o que efetivamente entrou (recebimentos Concluídos).",
          "% Recebido: quanto do esperado já foi recebido (Real ÷ Esperado).",
          "Cada cartão tem um ícone de informação (i) que explica de onde vem o número.",
        ],
      },
      {
        titulo: "Painel Financeiro — gráficos",
        intro:
          "Os gráficos financeiros mostram a composição e a evolução do dinheiro no período filtrado.",
        regras: [
          "Entrada & Saída (pizza): compara o total que entrou com o total que saiu no período — visão rápida de equilíbrio.",
          "Faturamento por Categoria (pizza): mostra quanto cada categoria de serviço faturou, para ver o que mais gera receita.",
          "Tipos de Transação (pizza): distribui os lançamentos por tipo/forma, ajudando a entender como o dinheiro se movimenta.",
          "Distribuição por Unidade (pizza): mostra a participação de cada filial no faturamento.",
          "Faturamento e Despesas Mensais (barras): compara, mês a mês, o que entrou e o que saiu — mostra a tendência ao longo do tempo.",
          "Faturamento Comparativo (linha/estatística): compara o faturamento entre períodos para ver se está subindo ou caindo.",
        ],
      },
      {
        titulo: "Painel Operação — indicadores e gráficos",
        intro:
          "O painel de Operação acompanha a atividade clínica: pacientes, sessões e produtividade. No topo há cartões com totais; abaixo, os gráficos.",
        regras: [
          "Sessões Mensais (barras): quantidade de sessões realizadas por mês — mostra o volume de atendimento ao longo do tempo.",
          "Distribuição por Unidade (pizza): participação de cada filial no volume de atendimentos.",
          "Serviços (pizza): distribuição das sessões/serviços por tipo de serviço prestado.",
          "Patologias (pizza): distribuição dos pacientes por patologia/queixa — ajuda a entender a demanda clínica.",
          "Clientes por Filial (pizza): quantos pacientes estão vinculados a cada unidade.",
          "Produtividade dos Fisioterapeutas (barras): quantas sessões/check-ins cada fisioterapeuta realizou — comparação de produtividade.",
          "Fisio x Plano (barras): compara os check-ins do tipo Fisio (produtividade) com os do tipo Plano (baixas do plano) — ajuda a conferir se produtividade e consumo do plano estão alinhados.",
        ],
        dicas: [
          "Passe o mouse sobre cada fatia/barra para ver o número exato e o percentual.",
        ],
      },
      {
        titulo: "Painel Lead",
        intro:
          "O painel de Lead acompanha os potenciais clientes (leads) e a conversão em pacientes. Fica disponível para os perfis comerciais/administrativos.",
        dicas: [
          "Use-o para acompanhar a captação e quanto dela vira paciente efetivo.",
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
        titulo: "O que são os logs",
        intro:
          "Os logs são o registro de auditoria do sistema: um histórico do que foi feito e por quem. Servem para investigar o que aconteceu quando há dúvida sobre uma alteração ou exclusão.",
      },
      {
        titulo: "O que os logs registram",
        regras: [
          "Ações críticas do sistema: cadastros, alterações e exclusões de dados importantes.",
          "Quem fez a ação (usuário), quando (data e hora) e a partir de qual dispositivo/origem.",
        ],
        dicas: [
          "Os logs não mudam os dados — são apenas leitura. Servem para conferência e responsabilização.",
        ],
      },
      {
        titulo: "Como consultar e filtrar",
        passos: [
          { titulo: "Abrir os logs", descricao: "Acesse a tela de logs (disponível apenas para o Administrador)." },
          { titulo: "Filtrar", descricao: "Filtre por usuário, período ou tipo de ação para encontrar o registro que procura." },
          { titulo: "Analisar", descricao: "Abra o registro para ver os detalhes da ação e cruzar com o que foi reportado." },
        ],
        dicas: [
          "Ao investigar um problema (ex.: um cadastro sumiu), filtre pelo período aproximado e pelo usuário envolvido para localizar a ação.",
        ],
      },
    ],
  },
];
