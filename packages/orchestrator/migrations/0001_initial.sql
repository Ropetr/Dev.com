-- ============================================================================
-- DEV.com Database Schema
-- Migration: 0001_initial
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Projetos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projetos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  descricao TEXT,
  cliente TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'arquivado')),
  fase TEXT DEFAULT 'discovery',
  contexto TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projetos_cliente ON projetos(cliente);
CREATE INDEX idx_projetos_status ON projetos(status);

-- ----------------------------------------------------------------------------
-- Mesas de Especialistas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesas (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  descricao TEXT,
  projeto_id TEXT REFERENCES projetos(id),
  especialistas TEXT NOT NULL, -- JSON array of especialista IDs
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mesas_projeto ON mesas(projeto_id);

-- ----------------------------------------------------------------------------
-- Conversas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversas (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  projeto_id TEXT REFERENCES projetos(id),
  mesa_id TEXT REFERENCES mesas(id),
  titulo TEXT,
  resumo TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversas_projeto ON conversas(projeto_id);
CREATE INDEX idx_conversas_mesa ON conversas(mesa_id);

-- ----------------------------------------------------------------------------
-- Mensagens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensagens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversa_id TEXT NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  especialista_id TEXT,
  metadata TEXT, -- JSON
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX idx_mensagens_especialista ON mensagens(especialista_id);

-- ----------------------------------------------------------------------------
-- Decisões (histórico de decisões importantes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisoes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  projeto_id TEXT REFERENCES projetos(id),
  conversa_id TEXT REFERENCES conversas(id),
  titulo TEXT NOT NULL,
  contexto TEXT,
  decisao TEXT NOT NULL,
  consequencias TEXT,
  alternativas TEXT,
  especialistas_envolvidos TEXT, -- JSON array
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decisoes_projeto ON decisoes(projeto_id);

-- ----------------------------------------------------------------------------
-- Documentos Gerados
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  projeto_id TEXT REFERENCES projetos(id),
  tipo TEXT NOT NULL, -- 'readme', 'spec', 'api', 'fluxo', etc
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  versao INTEGER DEFAULT 1,
  r2_key TEXT, -- Reference to R2 storage if large
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documentos_projeto ON documentos(projeto_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);

-- ----------------------------------------------------------------------------
-- Ferramentas Utilizadas (log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ferramentas_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversa_id TEXT REFERENCES conversas(id),
  especialista_id TEXT NOT NULL,
  ferramenta TEXT NOT NULL,
  input TEXT, -- JSON
  output TEXT, -- JSON
  duracao_ms INTEGER,
  sucesso INTEGER DEFAULT 1,
  erro TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ferramentas_conversa ON ferramentas_log(conversa_id);
CREATE INDEX idx_ferramentas_especialista ON ferramentas_log(especialista_id);

-- ----------------------------------------------------------------------------
-- Triggers para atualizar timestamps
-- ----------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS projetos_atualizado
AFTER UPDATE ON projetos
BEGIN
  UPDATE projetos SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS mesas_atualizado
AFTER UPDATE ON mesas
BEGIN
  UPDATE mesas SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS conversas_atualizado
AFTER UPDATE ON conversas
BEGIN
  UPDATE conversas SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS documentos_atualizado
AFTER UPDATE ON documentos
BEGIN
  UPDATE documentos SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
