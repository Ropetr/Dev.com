# 🏢 DEV.com - Fábrica de Software Virtual

<div align="center">

![Versão](https://img.shields.io/badge/Versão-3.0-blue)
![Especialistas](https://img.shields.io/badge/Especialistas-44-green)
![Diretorias](https://img.shields.io/badge/Diretorias-11-orange)
![Stack](https://img.shields.io/badge/Stack-Cloudflare-orange)
![AI](https://img.shields.io/badge/AI-Multi--Agent-purple)

**Sistema Multi-Agente de IA para Desenvolvimento de Software**

*44 Especialistas Virtuais • 11 Diretorias • Governança Completa • Full Enterprise*

[Documentação](#-documentação) • [Arquitetura](#-arquitetura) • [Começando](#-começando) • [Deploy](#-deploy)

</div>

---

## 🎯 O que é a DEV.com?

A **DEV.com** é uma **fábrica de software virtual** implementada como um sistema **multi-agente de IA** no Cloudflare. Cada especialista é um agente autônomo com personalidade, conhecimento e ferramentas específicas.

### ✨ Características

| Feature | Descrição |
|---------|-----------|
| 🤖 **44 Agentes Especializados** | Cada especialista é uma IA com system prompt específico |
| 🎯 **Orchestrator Inteligente** | CEO/Moderador que monta "mesas" de especialistas |
| 💬 **Conversas Paralelas** | Múltiplos especialistas respondem simultaneamente |
| 🧠 **Memória Persistente** | Cada agente lembra do contexto do projeto |
| 🔧 **Tools & Function Calling** | Agentes podem criar código, issues, documentos |
| 📊 **MCP Integration** | Model Context Protocol para ferramentas externas |
| 🚀 **Serverless & Escalável** | Roda em Cloudflare Workers + Durable Objects |

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🏢 DEV.com Multi-Agent System v3.0                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                    🎯 ORCHESTRATOR AGENT                          │    │
│    │              (CEO / Moderador de Mesas)                          │    │
│    │  • Analisa demandas do cliente                                   │    │
│    │  • Monta mesas de especialistas                                  │    │
│    │  • Coordena respostas paralelas                                  │    │
│    │  • Sintetiza outputs finais                                      │    │
│    └────────────────────────┬─────────────────────────────────────────┘    │
│                             │                                               │
│              ┌──────────────┼──────────────┬──────────────┐                │
│              ▼              ▼              ▼              ▼                │
│    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│    │   Agent 1    │ │   Agent 2    │ │   Agent 3    │ │   Agent N    │    │
│    │  (CPO)       │ │  (CTO)       │ │  (CFO)       │ │  (...)       │    │
│    │              │ │              │ │              │ │              │    │
│    │ Durable Obj  │ │ Durable Obj  │ │ Durable Obj  │ │ Durable Obj  │    │
│    │ + State      │ │ + State      │ │ + State      │ │ + State      │    │
│    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│              │              │              │              │                │
│              └──────────────┴──────┬───────┴──────────────┘                │
│                                    ▼                                       │
│    ┌─────────────────────────────────────────────────────────────────┐    │
│    │                         🔧 TOOLS LAYER                           │    │
│    ├─────────────────────────────────────────────────────────────────┤    │
│    │  📁 D1 Database     │  📦 R2 Storage    │  ⚡ KV Cache          │    │
│    │  (Contexto/Projeto) │  (Documentos)     │  (Estado Rápido)      │    │
│    ├─────────────────────────────────────────────────────────────────┤    │
│    │  🐙 GitHub API      │  📝 Doc Generator │  🔄 Workflows         │    │
│    │  (Code/Issues/PRs)  │  (Markdown/PDF)   │  (Long Tasks)         │    │
│    └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
Dev.com/
├── packages/
│   ├── orchestrator/          # 🎯 Agente Orquestrador (CEO/Moderador)
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point
│   │   │   ├── orchestrator.ts # Lógica de orquestração
│   │   │   ├── mesa.ts        # Montagem de mesas
│   │   │   └── prompts.ts     # System prompts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── agents/                # 🤖 44 Agentes Especialistas
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point
│   │   │   ├── base-agent.ts  # Classe base
│   │   │   └── especialistas/ # System prompts por especialista
│   │   │       ├── ceo.ts
│   │   │       ├── cpo.ts
│   │   │       ├── cto.ts
│   │   │       └── ... (44 especialistas)
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── shared/                # 📦 Código compartilhado
│   │   ├── src/
│   │   │   ├── types.ts       # TypeScript types
│   │   │   ├── tools.ts       # Ferramentas compartilhadas
│   │   │   ├── prompts.ts     # Prompts base
│   │   │   └── utils.ts       # Utilitários
│   │   └── package.json
│   │
│   └── web-ui/                # 🌐 Interface Web (React)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   └── hooks/
│       ├── wrangler.toml
│       └── package.json
│
├── docs/                      # 📚 Documentação
│   ├── especialistas/         # Docs de cada especialista
│   ├── arquitetura/           # Diagramas e decisões
│   └── api/                   # Referência da API
│
├── infrastructure/            # 🏗️ Infraestrutura
│   ├── d1/                    # Schemas do banco
│   ├── r2/                    # Configurações de storage
│   └── kv/                    # Namespaces KV
│
├── scripts/                   # 🔧 Scripts de automação
│
├── .github/
│   └── workflows/             # CI/CD
│
├── package.json               # Monorepo root
├── pnpm-workspace.yaml        # Workspace config
├── turbo.json                 # Turborepo config
└── wrangler.toml              # Config global
```

---

## 👥 Os 44 Especialistas

### Por Diretoria

| Diretoria | Especialistas | Emoji |
|-----------|---------------|-------|
| **Estratégia & Produto** | CEO, CPO, Guardião, Scrum Master | 🎯📋📚🔄 |
| **Comercial & Clientes** | Vendas, Marketplaces, Omnichannel, E-commerce, CRM/CS | 💼🛒💬🛍️🤝 |
| **Financeiro & Fiscal** | CFO, Tributário, Economista, Pricing | 💰🧾📊💲 |
| **Operações & Logística** | Logística, Compras, Estoque | 🚚🛒📦 |
| **Dados & IA** | BI, GA4, GTM, IA & Automações, Data Engineer | 📈📱🏷️🤖🔧 |
| **Técnica** | CTO, Frontend, Backend, DevOps, GitHub/CF, Segurança, Infra, DBA, Mobile | 👨‍💻🌐⚙️🚀☁️🔐🖥️🗄️📱 |
| **Marketing & Conteúdo** | SEO, Copywriter, Email Marketing, Social Media, Vídeo | 🔍✏️📧📱🎬 |
| **Experiência** | UX/UI, UX Writer, Branding, Suporte/CX, Onboarding, Tech Writer | 🎨✍️🎭🎧🎓📝 |
| **Jurídico** | Advogado | ⚖️ |
| **People** | RH/People | 👥 |
| **Qualidade** | QA de Processos | ✅ |

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- Conta Cloudflare com Workers AI habilitado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Ropetr/Dev.com.git
cd Dev.com

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env

# Configure Cloudflare
npx wrangler login
```

### Desenvolvimento Local

```bash
# Inicie todos os serviços
pnpm dev

# Ou individualmente
pnpm --filter orchestrator dev
pnpm --filter agents dev
pnpm --filter web-ui dev
```

---

## 🛠️ Deploy

### Deploy Automático (CI/CD)

O deploy é feito automaticamente via GitHub Actions quando você faz push para `main`.

### Deploy Manual

```bash
# Deploy de todos os pacotes
pnpm deploy

# Ou individualmente
pnpm --filter orchestrator deploy
pnpm --filter agents deploy
pnpm --filter web-ui deploy
```

---

## 📖 Documentação

- [Arquitetura Completa](./docs/arquitetura/ARCHITECTURE.md)
- [Guia dos Especialistas](./docs/especialistas/README.md)
- [API Reference](./docs/api/README.md)
- [Contribuindo](./CONTRIBUTING.md)

---

## 🔧 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Runtime** | Cloudflare Workers |
| **State** | Durable Objects (Agents SDK) |
| **AI** | Workers AI (Llama 3.3 70B) |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare R2 |
| **Cache** | Cloudflare KV |
| **Frontend** | React + Vite |
| **Monorepo** | pnpm + Turborepo |
| **CI/CD** | GitHub Actions |

---

## 📊 Roadmap

- [x] Estrutura do monorepo
- [x] Orchestrator Agent
- [x] 44 System Prompts
- [ ] Tools Layer (D1, R2, KV)
- [ ] GitHub Integration
- [ ] MCP Server
- [ ] Web UI
- [ ] Workflows para tarefas longas

---

## 📄 Licença

MIT © [Planac](https://github.com/Ropetr)

---

<div align="center">

**DEV.com v3.0** – Multi-Agent AI System

*44 Especialistas • 11 Diretorias • Full Enterprise*

🎯 Transformando ideias em sistemas com inteligência artificial

</div>
