// ============================================================================
// DEV.com - Export de todos os 44 Especialistas
// ============================================================================

// Estratégia & Produto
export { CEO, CPO, GUARDIAO, SCRUM_MASTER } from './estrategia-produto';

// Comercial & Clientes (exportar quando criar)
export { VENDAS, MARKETPLACES, OMNICHANNEL, ECOMMERCE, CRM_CS } from './comercial-clientes';

// Financeiro & Fiscal (exportar quando criar)
export { CFO, TRIBUTARIO, ECONOMISTA, PRICING } from './financeiro-fiscal';

// Operações & Logística
export { LOGISTICA, COMPRAS, ESTOQUE } from './operacoes-logistica';

// Dados & IA
export { BI, GA4, GTM, IA_AUTOMACOES, DATA_ENGINEER } from './dados-ia';

// Técnica
export { CTO, FRONTEND, BACKEND, DEVOPS, GITHUB_CLOUDFLARE, SEGURANCA, INFRA, DBA, MOBILE } from './tecnica';

// Marketing & Conteúdo (exportar quando criar)
export { SEO, COPYWRITER, EMAIL_MARKETING, SOCIAL_MEDIA, VIDEO } from './marketing-conteudo';

// Experiência (exportar quando criar)
export { UX_UI, UX_WRITER, BRANDING, SUPORTE_CX, ONBOARDING, TECH_WRITER } from './experiencia';

// Jurídico (exportar quando criar)
export { ADVOGADO } from './juridico';

// People (exportar quando criar)
export { RH_PEOPLE } from './people';

// Qualidade (exportar quando criar)
export { QA_PROCESSOS } from './qualidade';

// ----------------------------------------------------------------------------
// Mapa de todos os especialistas por ID
// ----------------------------------------------------------------------------

import type { Especialista, EspecialistaId } from '../types';
import * as estrategia from './estrategia-produto';
import * as operacoes from './operacoes-logistica';
import * as dados from './dados-ia';
import * as tecnica from './tecnica';

export const ESPECIALISTAS_MAP: Record<EspecialistaId, Especialista> = {
  // Estratégia & Produto
  'ceo': estrategia.CEO,
  'cpo': estrategia.CPO,
  'guardiao': estrategia.GUARDIAO,
  'scrum-master': estrategia.SCRUM_MASTER,
  
  // Comercial & Clientes (placeholder até criar)
  'vendas': estrategia.CEO, // placeholder
  'marketplaces': estrategia.CEO,
  'omnichannel': estrategia.CEO,
  'ecommerce': estrategia.CEO,
  'crm-cs': estrategia.CEO,
  
  // Financeiro & Fiscal (placeholder até criar)
  'cfo': estrategia.CEO,
  'tributario': estrategia.CEO,
  'economista': estrategia.CEO,
  'pricing': estrategia.CEO,
  
  // Operações & Logística
  'logistica': operacoes.LOGISTICA,
  'compras': operacoes.COMPRAS,
  'estoque': operacoes.ESTOQUE,
  
  // Dados & IA
  'bi': dados.BI,
  'ga4': dados.GA4,
  'gtm': dados.GTM,
  'ia-automacoes': dados.IA_AUTOMACOES,
  'data-engineer': dados.DATA_ENGINEER,
  
  // Técnica
  'cto': tecnica.CTO,
  'frontend': tecnica.FRONTEND,
  'backend': tecnica.BACKEND,
  'devops': tecnica.DEVOPS,
  'github-cloudflare': tecnica.GITHUB_CLOUDFLARE,
  'seguranca': tecnica.SEGURANCA,
  'infra': tecnica.INFRA,
  'dba': tecnica.DBA,
  'mobile': tecnica.MOBILE,
  
  // Marketing & Conteúdo (placeholder até criar)
  'seo': estrategia.CEO,
  'copywriter': estrategia.CEO,
  'email-marketing': estrategia.CEO,
  'social-media': estrategia.CEO,
  'video': estrategia.CEO,
  
  // Experiência (placeholder até criar)
  'ux-ui': estrategia.CEO,
  'ux-writer': estrategia.CEO,
  'branding': estrategia.CEO,
  'suporte-cx': estrategia.CEO,
  'onboarding': estrategia.CEO,
  'tech-writer': estrategia.CEO,
  
  // Jurídico (placeholder até criar)
  'advogado': estrategia.CEO,
  
  // People (placeholder até criar)
  'rh-people': estrategia.CEO,
  
  // Qualidade (placeholder até criar)
  'qa-processos': estrategia.CEO,
};

// ----------------------------------------------------------------------------
// Mesas pré-configuradas por tipo de demanda
// ----------------------------------------------------------------------------

import type { MesaTemplate } from '../types';

export const MESAS_TEMPLATES: MesaTemplate[] = [
  {
    caso: 'Novo módulo de vendas',
    especialistas: ['cpo', 'vendas', 'pricing', 'ux-ui', 'backend', 'qa-processos'],
    descricao: 'Para criar módulos relacionados a vendas, orçamentos, pedidos'
  },
  {
    caso: 'Integração com marketplace',
    especialistas: ['marketplaces', 'cto', 'backend', 'data-engineer'],
    descricao: 'Para integrar com Mercado Livre, Amazon, Shopee, etc.'
  },
  {
    caso: 'Otimização de estoque',
    especialistas: ['estoque', 'logistica', 'compras', 'bi', 'dba'],
    descricao: 'Para módulos de estoque, inventário, WMS'
  },
  {
    caso: 'Lançamento de e-commerce',
    especialistas: ['ecommerce', 'seo', 'copywriter', 'frontend', 'cto'],
    descricao: 'Para criar ou otimizar loja virtual'
  },
  {
    caso: 'Compliance LGPD',
    especialistas: ['advogado', 'seguranca', 'dba', 'cto'],
    descricao: 'Para requisitos de privacidade e segurança'
  },
  {
    caso: 'App mobile',
    especialistas: ['mobile', 'logistica', 'ux-ui', 'backend', 'devops'],
    descricao: 'Para criar apps de motorista, vendedor, cliente'
  },
  {
    caso: 'Dashboard executivo',
    especialistas: ['bi', 'cfo', 'cpo', 'frontend', 'dba'],
    descricao: 'Para criar painéis gerenciais e KPIs'
  },
  {
    caso: 'Automação de processos',
    especialistas: ['ia-automacoes', 'backend', 'cpo', 'qa-processos'],
    descricao: 'Para automatizar tarefas repetitivas'
  },
  {
    caso: 'Definição de arquitetura',
    especialistas: ['ceo', 'cto', 'devops', 'seguranca', 'dba'],
    descricao: 'Para decisões técnicas de alto nível'
  },
  {
    caso: 'Planejamento de sprint',
    especialistas: ['scrum-master', 'cpo', 'cto', 'frontend', 'backend'],
    descricao: 'Para organizar trabalho em sprints'
  }
];

// ----------------------------------------------------------------------------
// Helper para buscar especialista
// ----------------------------------------------------------------------------

export function getEspecialista(id: EspecialistaId): Especialista | undefined {
  return ESPECIALISTAS_MAP[id];
}

export function getEspecialistasPorDiretoria(diretoria: string): Especialista[] {
  return Object.values(ESPECIALISTAS_MAP).filter(e => e.diretoria === diretoria);
}

export function getMesaTemplate(caso: string): MesaTemplate | undefined {
  return MESAS_TEMPLATES.find(m => 
    m.caso.toLowerCase().includes(caso.toLowerCase()) ||
    m.descricao.toLowerCase().includes(caso.toLowerCase())
  );
}
