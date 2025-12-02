// ============================================================================
// DEV.com Agent Durable Object
// Cada especialista é uma instância deste Durable Object
// ============================================================================

import { DurableObject } from 'cloudflare:workers';
import type { Env, EspecialistaId, AgentState, MemoriaItem } from '@dev.com/shared/types';
import { ESPECIALISTAS_MAP } from '@dev.com/shared/especialistas';

export class AgentDO extends DurableObject {
  private especialistaId: EspecialistaId | null = null;
  private agentState: AgentState | null = null;
  private env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
  }

  private async initState(especialistaId: EspecialistaId) {
    this.especialistaId = especialistaId;
    
    // Try to load state from SQL
    const stored = this.ctx.storage.sql
      .exec('SELECT * FROM agent_state WHERE id = ?', especialistaId)
      .toArray()[0] as any;
    
    if (stored) {
      this.agentState = {
        id: stored.id,
        especialista_id: stored.especialista_id,
        projeto_id: stored.projeto_id,
        memoria: JSON.parse(stored.memoria || '[]'),
        ultima_atividade: stored.ultima_atividade
      };
    } else {
      // Create initial state
      this.agentState = {
        id: crypto.randomUUID(),
        especialista_id: especialistaId,
        memoria: [],
        ultima_atividade: new Date().toISOString()
      };
      
      // Create table if not exists
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS agent_state (
          id TEXT PRIMARY KEY,
          especialista_id TEXT NOT NULL,
          projeto_id TEXT,
          memoria TEXT,
          ultima_atividade TEXT
        )
      `);
      
      // Insert initial state
      this.ctx.storage.sql.exec(
        `INSERT INTO agent_state (id, especialista_id, memoria, ultima_atividade) 
         VALUES (?, ?, ?, ?)`,
        this.agentState.id,
        especialistaId,
        '[]',
        this.agentState.ultima_atividade
      );
    }
  }

  private async saveState() {
    if (!this.agentState) return;
    
    this.ctx.storage.sql.exec(
      `UPDATE agent_state SET 
        projeto_id = ?,
        memoria = ?,
        ultima_atividade = ?
       WHERE id = ?`,
      this.agentState.projeto_id || null,
      JSON.stringify(this.agentState.memoria),
      new Date().toISOString(),
      this.agentState.id
    );
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Get especialista ID from DO name (set when created)
    const doId = this.ctx.id.toString();
    
    switch (url.pathname) {
      case '/invoke':
        return this.handleInvoke(request);
      case '/memoria':
        return this.handleMemoria(request);
      case '/estado':
        return this.handleEstado();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // ============================================================================
  // Handle Invoke - Main entry point to consult this specialist
  // ============================================================================
  private async handleInvoke(request: Request): Promise<Response> {
    const { mensagem, contexto, especialista_id, projeto_id } = await request.json() as any;
    
    // Initialize state if needed
    if (!this.agentState && especialista_id) {
      await this.initState(especialista_id);
    }
    
    // Get specialist configuration
    const especialista = this.especialistaId ? ESPECIALISTAS_MAP[this.especialistaId] : null;
    
    if (!especialista) {
      return Response.json({ 
        error: 'Especialista não configurado',
        especialista_id: this.especialistaId 
      }, { status: 400 });
    }
    
    try {
      // Build context with memory
      const memoriaRelevante = this.getMemoriaRelevante(mensagem);
      const contextoCompleto = this.buildContexto(contexto, memoriaRelevante);
      
      // Build messages for AI
      const messages = [
        { role: 'system', content: especialista.systemPrompt },
        ...(contextoCompleto ? [{ role: 'system', content: `CONTEXTO:\n${contextoCompleto}` }] : []),
        { role: 'user', content: mensagem }
      ];
      
      // Call AI
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: messages as any,
        max_tokens: 1500
      });
      
      const resposta = (response as any).response || '[Sem resposta]';
      
      // Extract and store learnings in memory
      await this.extrairAprendizados(mensagem, resposta);
      
      // Update state
      if (this.agentState) {
        this.agentState.ultima_atividade = new Date().toISOString();
        if (projeto_id) {
          this.agentState.projeto_id = projeto_id;
        }
        await this.saveState();
      }
      
      return Response.json({
        especialista: {
          id: especialista.id,
          nome: especialista.nome,
          emoji: especialista.emoji
        },
        resposta,
        memoria_utilizada: memoriaRelevante.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Agent ${this.especialistaId} error:`, error);
      return Response.json({ 
        error: 'Erro ao processar',
        details: error instanceof Error ? error.message : 'Unknown'
      }, { status: 500 });
    }
  }

  // ============================================================================
  // Memory Management
  // ============================================================================
  private getMemoriaRelevante(mensagem: string): MemoriaItem[] {
    if (!this.agentState?.memoria) return [];
    
    // Simple relevance: check if any keywords match
    const palavras = mensagem.toLowerCase().split(/\s+/);
    
    return this.agentState.memoria
      .filter(item => {
        const conteudoLower = item.conteudo.toLowerCase();
        return palavras.some(p => conteudoLower.includes(p)) || item.relevancia > 0.7;
      })
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 5); // Max 5 relevant items
  }

  private buildContexto(contextoExterno?: string, memoriaRelevante?: MemoriaItem[]): string {
    const partes: string[] = [];
    
    if (contextoExterno) {
      partes.push(`Contexto do projeto:\n${contextoExterno}`);
    }
    
    if (memoriaRelevante && memoriaRelevante.length > 0) {
      const memoriaTexto = memoriaRelevante
        .map(m => `- [${m.tipo}] ${m.conteudo}`)
        .join('\n');
      partes.push(`Memória relevante:\n${memoriaTexto}`);
    }
    
    return partes.join('\n\n');
  }

  private async extrairAprendizados(mensagem: string, resposta: string) {
    // Simple extraction: store key decisions and context
    if (!this.agentState) return;
    
    // Check for decision patterns
    const decisoes = resposta.match(/decid[io]|proponho|recomendo|sugiro/gi);
    if (decisoes && decisoes.length > 0) {
      const novoItem: MemoriaItem = {
        tipo: 'decisao',
        conteudo: `Sobre "${mensagem.slice(0, 50)}...": ${resposta.slice(0, 200)}...`,
        timestamp: new Date().toISOString(),
        relevancia: 0.8
      };
      
      this.agentState.memoria.push(novoItem);
      
      // Keep memory limited
      if (this.agentState.memoria.length > 50) {
        this.agentState.memoria = this.agentState.memoria
          .sort((a, b) => b.relevancia - a.relevancia)
          .slice(0, 40);
      }
    }
  }

  // ============================================================================
  // Handle Memoria endpoint
  // ============================================================================
  private async handleMemoria(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      return Response.json({
        memoria: this.agentState?.memoria || [],
        total: this.agentState?.memoria?.length || 0
      });
    }
    
    if (request.method === 'POST') {
      const { tipo, conteudo, relevancia } = await request.json() as any;
      
      if (!this.agentState) {
        return Response.json({ error: 'Agent não inicializado' }, { status: 400 });
      }
      
      const novoItem: MemoriaItem = {
        tipo: tipo || 'contexto',
        conteudo,
        timestamp: new Date().toISOString(),
        relevancia: relevancia || 0.5
      };
      
      this.agentState.memoria.push(novoItem);
      await this.saveState();
      
      return Response.json({ success: true, item: novoItem });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // ============================================================================
  // Handle Estado endpoint
  // ============================================================================
  private async handleEstado(): Promise<Response> {
    return Response.json({
      especialista_id: this.especialistaId,
      estado: this.agentState,
      especialista: this.especialistaId ? ESPECIALISTAS_MAP[this.especialistaId] : null
    });
  }
}
