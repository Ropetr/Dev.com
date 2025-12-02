# 🔧 DEV.com - IDs dos Recursos Cloudflare

> ⚠️ Este arquivo é apenas para referência. Os IDs já estão configurados nos arquivos de deploy.

## Account
- **Account ID:** `f14d821b52a4f6ecbad7fb0e0afba8e5`

## Recursos DEV.com

| Recurso | Nome | ID |
|---------|------|-----|
| 🗄️ D1 Database | `DEVcom-database` | `8cb74e46-ee62-4a66-b3a1-596d9ebd5a7e` |
| ⚡ KV Namespace | `DEVcom-cache` | `5706642392dc4af1ba7eef4a3a0e2322` |
| 📦 R2 Bucket | `devcom-storage` | (nome é o ID) |
| 🤖 AI Gateway | `devcom-ai-gateway` | (nome é o ID) |

## Endpoints (após deploy)

- **API:** `https://devcom-orchestrator.<seu-subdomain>.workers.dev`
- **AI Gateway:** `https://gateway.ai.cloudflare.com/v1/f14d821b52a4f6ecbad7fb0e0afba8e5/devcom-ai-gateway`

## Tabelas D1

| Tabela | Descrição |
|--------|-----------|
| `projetos` | Projetos da DEV.com |
| `mesas` | Mesas de especialistas |
| `conversas` | Histórico de conversas |
| `mensagens` | Mensagens individuais |
| `decisoes` | Decisões documentadas |
| `documentos` | Documentos gerados |
| `ferramentas_log` | Log de ferramentas |
