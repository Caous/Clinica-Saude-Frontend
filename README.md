# Instituto Barros — Admin Frontend

![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)
![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black.svg)

Painel administrativo da clínica de fisioterapia Instituto Barros. SPA React para gestão de pacientes, funcionários, filiais, agenda, sessões, financeiro, WhatsApp e documentação do sistema.

---

## Stack

| Biblioteca | Uso |
|-----------|-----|
| React 18 + TypeScript 5 | UI + tipagem |
| Vite 5 | Build/Dev server |
| React Router v6 | Roteamento SPA |
| Axios | HTTP client |
| TailwindCSS | Estilos |
| ApexCharts | Gráficos do dashboard |
| FullCalendar | Calendário de agendamentos |
| flatpickr | Date pickers |
| react-dnd | Drag-and-drop |

---

## Executar localmente

```bash
git clone https://github.com/InstitutoBarrosTecnologia/frontend_instituto_barros.git
cd FrontEnd_Instituto_Barros/FrontEnd_Instituto_Barros
npm install
npm run dev      # http://localhost:5173
```

### Build produção

```bash
npm run build
npm run preview
```

---

## Variáveis de ambiente

Criar `.env` na raiz (nunca commitar):

```env
VITE_API_URL=https://instituto-barros-sistema.azurewebsites.net
```

---

## Estrutura do projeto

```
src/
├── components/        # Componentes reutilizáveis (modais, tabelas, inputs, badges)
├── pages/
│   ├── Calendar.tsx        # Agenda / check-in (regra 48h)
│   ├── Dashboard/          # Gráficos e métricas
│   ├── Forms/
│   │   ├── Employee/       # FormEmployee — cadastro e edição de funcionários
│   │   └── Customer/       # FormCustomer — cadastro e edição de pacientes
│   ├── Tables/             # Tabelas de listagem
│   ├── Documentacao.tsx    # Documentação interativa do sistema
│   └── AuthPages/          # Login, reset senha
├── services/
│   ├── service/            # Serviços HTTP (AxioService, CustomerService, UserService…)
│   └── model/Dto/          # DTOs de requisição e resposta
├── hooks/                  # Custom hooks
├── context/                # React Context (auth, filial…)
├── layout/                 # Sidebar, Header, Footer
├── data/
│   └── documentacao.ts     # Dados dos módulos de documentação
└── utils/                  # Helpers (token, roles, formatação)
```

---

## Autenticação e roles

Token JWT em `localStorage` (extraído do cookie após login). Role verificada via `getUserRoleFromToken` + `userHasRole`.

| Role | Acesso |
|------|--------|
| `Administrador` | Total — incluindo gestão de roles de usuários |
| `Administrativo` | Agenda, pacientes, funcionários |
| `Fisioterapeuta` | Própria agenda, check-in |
| `CoordenadorFisioterapeuta` | Agenda de todos os fisios, check-in |
| `Comercial` | WhatsApp, leads |
| `Financeiro` | Módulo financeiro |
| `Funcionario` | Operacional básico |

Rotas protegidas por `PrivateRoute`. CSRF token obtido de `GET /Api/User/GetCsrfToken` e enviado como header `X-CSRF-Token` em todas as mutations.

---

## Módulos principais

### Agenda (`Calendar.tsx`)
- FullCalendar com eventos por filial e fisioterapeuta
- Check-in bloqueado 48h após fim do evento para `Fisioterapeuta` e `CoordenadorFisioterapeuta`
- `isFisioterapeutaUser` usa `||` (não `&&`) para incluir CoordenadorFisioterapeuta

### Funcionários (`Forms/Employee/FormEmployee.tsx`)
- Seção "Configurar acesso ao sistema": cria/edita usuário vinculado
- Modo edição: carrega automaticamente dados via `UserService.getUserAccessByFuncionarioId`
  - Pré-preenche userName, email e role
  - Exibe badges removíveis para cada role atual (somente Administrador)
  - Clique no badge remove a role via `UserService.removeRole`

### Dashboard
- 10+ métricas operacionais e financeiras
- Rate limit backend: 20 req/30s — não fazer polling

### WhatsApp
- Conversas salvas do bot n8n
- Número configurado via `WhatsappNumber`

### Documentação (`Documentacao.tsx`)
- Accordion por módulo do sistema (rota `/documentacao`)
- Dados em `src/data/documentacao.ts`

---

## Padrões de desenvolvimento

### HTTP
- Usar sempre `instanceApi` de `services/service/AxioService.ts` — interceptors injetam JWT e CSRF automaticamente
- Nunca importar `axios` diretamente nas páginas

### Role check
Usar `userHasRole(roles, ROLE)` — nunca comparação direta de string. Roles múltiplas: `||`.

### Selects e dropdowns
Usar endpoint `Summary` correspondente (ex: `/GetAllCustomer/Summary`) — nunca `GetAll` completo, que carrega histórico inteiro e causa timeout.

---

## CI/CD

Push para `master` → deploy automático na Vercel (`sistema-instituto.vercel.app`).

---

## Pendências conhecidas

- Token JWT em `localStorage` — vulnerável a XSS. Preferível cookie HTTPOnly (requer mudança no backend).
- Sem testes automatizados de UI.
- Sem refresh token — sessão expira em 1h sem aviso.
