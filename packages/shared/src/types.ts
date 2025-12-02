// ============================================================================
// DEV.com - Tipos e Interfaces Compartilhados
// ============================================================================

export type Diretoria =
  | 'Estratégia & Produto'
  | 'Comercial & Clientes'
  | 'Financeiro & Fiscal'
  | 'Operações & Logística'
  | 'Dados & IA'
  | 'Técnica'
  | 'Marketing & Conteúdo'
  | 'Experiência'
  | 'Jurídico'
  | 'People'
  | 'Qualidade';

export interface Especialista {
  id: string;
  nome: string;
  diretoria: Diretoria;
  emoji: string;
  foco: string;
  numero: number;
  systemPrompt: string;
}

export interface Mesa {
  id: string;
  nome: string;
  especialistas: string[];
  contexto?: string;
}

export interface Mensagem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  especialista?: string;
  timestamp?: string;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  cliente: string;
  status: 'ativo' | 'pausado' | 'concluido';
  fase: 'discovery' | 'design' | 'desenvolvimento' | 'validacao' | 'producao';
  contexto?: string;
}

export interface OrchestratorInput {
  mensagem: string;
  projeto_id?: string;
  mesa_id?: string;
  contexto?: Record<string, unknown>;
}

export interface OrchestratorOutput {
  resposta: string;
  mesa_utilizada: Mesa;
  contribuicoes: {
    especialista: string;
    contribuicao: string;
  }[];
  ferramentas_usadas: string[];
  proximos_passos: string[];
}

export interface AgentState {
  especialista_id: string;
  memoria: {
    tipo: 'decisao' | 'contexto' | 'aprendizado' | 'preferencia';
    conteudo: string;
    relevancia: number;
    criado_em: string;
  }[];
  projeto_atual?: string;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  AI: Ai;
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  ORCHESTRATOR: DurableObjectNamespace;
  AGENT: DurableObjectNamespace;
}
