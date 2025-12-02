// ============================================================================
// DEV.com - Índice de Especialistas
// ============================================================================

import { Especialista, Mesa } from '../types';

// Importar todos os especialistas
import { CEO, CPO, GUARDIAO, SCRUM_MASTER } from './estrategia-produto';
import { VENDAS, MARKETPLACES, OMNICHANNEL, ECOMMERCE, CRM_CS } from './comercial-clientes';
import { CFO, TRIBUTARIO, ECONOMISTA, PRICING } from './financeiro-fiscal';
import { LOGISTICA, COMPRAS, ESTOQUE } from './operacoes-logistica';
import { BI, GA4, GTM, IA_AUTOMACOES, DATA_ENGINEER } from './dados-ia';
import { CTO, FRONTEND, BACKEND, DEVOPS, GITHUB_CF, SEGURANCA, INFRA, DBA, MOBILE } from './tecnica';
import { SEO, COPYWRITER, EMAIL_MARKETING, SOCIAL_MEDIA, VIDEO } from './marketing-conteudo';
import { UX_UI, UX_WRITER, BRANDING, SUPORTE_CX, ONBOARDING, TECH_WRITER } from './experiencia';
import { ADVOGADO } from './juridico';
import { RH_PEOPLE } from './people';
import { QA_PROCESSOS } from './qualidade';

// Lista completa de especialistas
export const ESPECIALISTAS: Especialista[] = [
  // Estratégia & Produto
  CEO, CPO, GUARDIAO, SCRUM_MASTER,
  // Comercial & Clientes
  VENDAS, MARKETPLACES, OMNICHANNEL, ECOMMERCE, CRM_CS,
  // Financeiro & Fiscal
  CFO, TRIBUTARIO, ECONOMISTA, PRICING,
  // Operações & Logística
  LOGISTICA, COMPRAS, ESTOQUE,
  // Dados & IA
  BI, GA4, GTM, IA_AUTOMACOES, DATA_ENGINEER,
  // Técnica
  CTO, FRONTEND, BACKEND, DEVOPS, GITHUB_CF, SEGURANCA, INFRA, DBA, MOBILE,
  // Marketing & Conteúdo
  SEO, COPYWRITER, EMAIL_MARKETING, SOCIAL_MEDIA, VIDEO,
  // Experiência
  UX_UI, UX_WRITER, BRANDING, SUPORTE_CX, ONBOARDING, TECH_WRITER,
  // Jurídico
  ADVOGADO,
  // People
  RH_PEOPLE,
  // Qualidade
  QA_PROCESSOS
];

// Mapa para acesso rápido por ID
export const ESPECIALISTAS_MAP: Record<string, Especialista> = {};
ESPECIALISTAS.forEach(esp => {
  ESPECIALISTAS_MAP[esp.id] = esp;
});

// Templates de mesas pré-configuradas
export const MESAS_TEMPLATES: Mesa[] = [
  {
    id: 'novo-modulo-vendas',
    nome: 'Novo Módulo de Vendas',
    especialistas: ['cpo', 'vendas', 'pricing', 'ux-ui', 'backend', 'qa-processos']
  },
  {
    id: 'integracao-marketplace',
    nome: 'Integração com Marketplace',
    especialistas: ['marketplaces', 'cto', 'backend', 'data-engineer']
  },
  {
    id: 'otimizacao-estoque',
    nome: 'Otimização de Estoque',
    especialistas: ['estoque', 'logistica', 'compras', 'bi', 'dba']
  },
  {
    id: 'lancamento-ecommerce',
    nome: 'Lançamento E-commerce',
    especialistas: ['ecommerce', 'seo', 'copywriter', 'frontend', 'cto']
  },
  {
    id: 'compliance-lgpd',
    nome: 'Compliance LGPD',
    especialistas: ['advogado', 'seguranca', 'dba', 'cto']
  },
  {
    id: 'app-mobile',
    nome: 'App Mobile',
    especialistas: ['mobile', 'logistica', 'ux-ui', 'backend', 'devops']
  },
  {
    id: 'dashboard-executivo',
    nome: 'Dashboard Executivo',
    especialistas: ['bi', 'cfo', 'cpo', 'frontend', 'dba']
  },
  {
    id: 'automacao-processos',
    nome: 'Automação de Processos',
    especialistas: ['ia-automacoes', 'backend', 'cpo', 'qa-processos']
  },
  {
    id: 'definicao-arquitetura',
    nome: 'Definição de Arquitetura',
    especialistas: ['ceo', 'cto', 'devops', 'seguranca', 'dba']
  },
  {
    id: 'planejamento-sprint',
    nome: 'Planejamento de Sprint',
    especialistas: ['scrum-master', 'cpo', 'cto', 'frontend', 'backend']
  }
];

// Re-export individuais
export {
  CEO, CPO, GUARDIAO, SCRUM_MASTER,
  VENDAS, MARKETPLACES, OMNICHANNEL, ECOMMERCE, CRM_CS,
  CFO, TRIBUTARIO, ECONOMISTA, PRICING,
  LOGISTICA, COMPRAS, ESTOQUE,
  BI, GA4, GTM, IA_AUTOMACOES, DATA_ENGINEER,
  CTO, FRONTEND, BACKEND, DEVOPS, GITHUB_CF, SEGURANCA, INFRA, DBA, MOBILE,
  SEO, COPYWRITER, EMAIL_MARKETING, SOCIAL_MEDIA, VIDEO,
  UX_UI, UX_WRITER, BRANDING, SUPORTE_CX, ONBOARDING, TECH_WRITER,
  ADVOGADO,
  RH_PEOPLE,
  QA_PROCESSOS
};
