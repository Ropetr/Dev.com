// ============================================================================
// DEV.com Multi-Agent System - Types
// ============================================================================

// ----------------------------------------------------------------------------
// Diretorias e Especialistas
// ----------------------------------------------------------------------------

export type DiretoriaId = 
  | 'estrategia-produto'
  | 'comercial-clientes'
  | 'financeiro-fiscal'
  | 'operacoes-logistica'
  | 'dados-ia'
  | 'tecnica'
  | 'marketing-conteudo'
  | 'experiencia'
  | 'juridico'
  | 'people'
  | 'qualidade';

export interface Diretoria {
  id: DiretoriaId;
  nome: string;
  descricao: string;
  cor: string;
  emoji: string;
}

export type EspecialistaId = 
  // Estratégia & Produto
  | 'ceo' | 'cpo' | 'guardiao' | 'scrum-master'
  // Comercial & Clientes
  | 'vendas' | 'marketplaces' | 'omnichannel' | 'ecommerce' | 'crm-cs'
  // Financeiro & Fiscal
  | 'cfo' | 'tributario' | 'economista' | 'pricing'
  // Operações & Logística
  | 'logistica' | 'compras' | 'estoque'
  // Dados & IA
  | 'bi' | 'ga4' | 'gtm' | 'ia-automacoes' | 'data-engineer'
  // Técnica
  | 'cto' | 'frontend' | 'backend' | 'devops' | 'github-cloudflare' | 'seguranca' | 'infra' | 'dba' | 'mobile'
  // Marketing & Conteúdo
  | 'seo' | 'copywriter' | 'email-marketing' | 'social-media' | 'video'
  // Experiência
  | 'ux-ui' | 'ux-writer' | 'branding' | 'suporte-cx' | 'onboarding' | 'tech-writer'
  // Jurídico
  | 'advogado'
  // People
  | 'rh-people'
  // Qualidade
  | 'qa-processos';

export interface Especialista {
  id: EspecialistaId;
  numero: number;
  nome: string;
  diretoria: DiretoriaId;
  emoji: string;
  foco: string;
  descricao: string;
  systemPrompt: string;
  ferramentas: FerramentaId[];
}

// ----------------------------------------------------------------------------
// Ferramentas (Tools)
// ----------------------------------------------------------------------------

export type FerramentaId = 
  | 'database-query'      // Consultar D1
  | 'database-write'      // Escrever D1
  | 'storage-read'        // Ler R2
  | 'storage-write'       // Escrever R2
  | 'cache-get'           // Ler KV
  | 'cache-set'           // Escrever KV
  | 'github-issue'        // Criar issue
  | 'github-pr'           // Criar PR
  | 'github-code'         // Gerar código
  | 'doc-generator'       // Gerar documentos
  | 'diagram-generator'   // Gerar diagramas
  | 'api-spec'            // Gerar specs de API
  | 'sql-generator'       // Gerar SQL
  | 'test-generator'      // Gerar testes
  | 'workflow-trigger';   // Disparar workflow

export interface Ferramenta {
  id: FerramentaId;
  nome: string;
  descricao: string;
  parametros: ParametroFerramenta[];
}

export interface ParametroFerramenta {
  nome: string;
  tipo: 'string' | 'number' | 'boolean' | 'object' | 'array';
  descricao: string;
  obrigatorio: boolean;
}

// ----------------------------------------------------------------------------
// Mesa de Especialistas
// ----------------------------------------------------------------------------

export interface Mesa {
  id: string;
  nome: string;
  descricao: string;
  especialistas: EspecialistaId[];
  criado_em: string;
  atualizado_em: string;
}

export interface MesaTemplate {
  caso: string;
  especialistas: EspecialistaId[];
  descricao: string;
}

// ----------------------------------------------------------------------------
// Mensagens e Conversas
// ----------------------------------------------------------------------------

export type MensagemRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Mensagem {
  id: string;
  role: MensagemRole;
  content: string;
  especialista?: EspecialistaId;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversa {
  id: string;
  projeto_id: string;
  mesa_id?: string;
  mensagens: Mensagem[];
  criado_em: string;
  atualizado_em: string;
}

// ----------------------------------------------------------------------------
// Projeto
// ----------------------------------------------------------------------------

export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  cliente: string;
  status: 'ativo' | 'pausado' | 'concluido' | 'arquivado';
  fase: string;
  contexto: string;
  criado_em: string;
  atualizado_em: string;
}

// ----------------------------------------------------------------------------
// Orchestrator
// ----------------------------------------------------------------------------

export interface OrchestratorInput {
  mensagem: string;
  projeto_id?: string;
  mesa_id?: string;
  contexto?: string;
}

export interface OrchestratorOutput {
  resposta: string;
  mesa_utilizada: Mesa;
  contribuicoes: ContribuicaoEspecialista[];
  ferramentas_usadas: FerramentaUsada[];
  proximos_passos?: string[];
}

export interface ContribuicaoEspecialista {
  especialista: EspecialistaId;
  contribuicao: string;
  ferramentas_usadas: FerramentaId[];
  confianca: number; // 0-1
}

export interface FerramentaUsada {
  ferramenta: FerramentaId;
  especialista: EspecialistaId;
  input: Record<string, unknown>;
  output: unknown;
  duracao_ms: number;
}

// ----------------------------------------------------------------------------
// Agent State (Durable Object)
// ----------------------------------------------------------------------------

export interface AgentState {
  id: string;
  especialista_id: EspecialistaId;
  projeto_id?: string;
  memoria: MemoriaItem[];
  ultima_atividade: string;
}

export interface MemoriaItem {
  tipo: 'decisao' | 'contexto' | 'aprendizado' | 'preferencia';
  conteudo: string;
  timestamp: string;
  relevancia: number; // 0-1
}

// ----------------------------------------------------------------------------
// API Types
// ----------------------------------------------------------------------------

export interface ApiRequest {
  action: 'chat' | 'create-mesa' | 'get-projeto' | 'list-especialistas';
  payload: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duracao_ms: number;
    tokens_usados?: number;
    especialistas_consultados?: EspecialistaId[];
  };
}

// ----------------------------------------------------------------------------
// Environment Bindings (Cloudflare)
// ----------------------------------------------------------------------------

export interface Env {
  // AI
  AI: Ai;
  
  // Database
  DB: D1Database;
  
  // Storage
  STORAGE: R2Bucket;
  
  // Cache
  CACHE: KVNamespace;
  
  // Durable Objects
  ORCHESTRATOR: DurableObjectNamespace;
  AGENTS: DurableObjectNamespace;
  
  // Secrets
  GITHUB_TOKEN?: string;
  
  // Config
  ENVIRONMENT: 'development' | 'staging' | 'production';
}
