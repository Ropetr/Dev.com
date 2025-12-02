// ============================================================================
// DEV.com - Agent Durable Object
// ============================================================================

import { DurableObject } from 'cloudflare:workers';
import { Env, AgentState, ESPECIALISTAS_MAP, CULTURA_EQUIPE } from '@dev.com/shared';

export class AgentDO extends DurableObject<Env> {
  private state: AgentState | null = null;
  private especialistaId: string = '';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/invoke' && request.method === 'POST') {
        return this.handleInvoke(request);
      }

      if (path === '/memoria' && request.method === 'GET') {
        return this.handleGetMemoria();
      }

      if (path === '/estado' && request.method === 'GET') {
        return this.handleGetEstado();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Erro no Agent:', error);
      return new Response(JSON.stringify({ error: 'Erro interno' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleInvoke(request: Request): Promise<Response> {
    const { mensagem, contexto, especialista_id } = await request.json() as {
      mensagem: string;
      contexto?: Record<string, unknown>;
      especialista_id: string;
    };

    this.especialistaId = especialista_id;
    const especialista = ESPECIALISTAS_MAP[especialista_id];

    if (!especialista) {
      return new Response(JSON.stringify({ error: 'Especialista não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Carregar estado
    await this.carregarEstado();

    // Buscar memória relevante
    const memoriaRelevante = await this.getMemoriaRelevante(mensagem);

    // Construir prompt
    const prompt = `${especialista.systemPrompt}

${CULTURA_EQUIPE}

${memoriaRelevante.length > 0 ? `
MEMÓRIA RELEVANTE:
${memoriaRelevante.map(m => `- ${m.conteudo}`).join('\n')}
` : ''}

${contexto ? `CONTEXTO: ${JSON.stringify(contexto)}` : ''}

DEMANDA: ${mensagem}

Responda como ${especialista.nome}. Seja prático e objetivo.`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500
      }) as { response: string };

      // Extrair aprendizados para memória
      await this.extrairAprendizados(mensagem, response.response);

      return new Response(JSON.stringify({
        especialista: especialista.nome,
        resposta: response.response,
        memoria_usada: memoriaRelevante.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Erro na invocação:', error);
      return new Response(JSON.stringify({ error: 'Erro ao processar' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async carregarEstado(): Promise<void> {
    if (this.state) return;

    const stored = await this.ctx.storage.get<AgentState>('state');
    this.state = stored || {
      especialista_id: this.especialistaId,
      memoria: []
    };
  }

  private async salvarEstado(): Promise<void> {
    if (this.state) {
      await this.ctx.storage.put('state', this.state);
    }
  }

  private async getMemoriaRelevante(mensagem: string): Promise<AgentState['memoria']> {
    if (!this.state) return [];

    const palavrasChave = mensagem.toLowerCase().split(/\s+/);
    
    return this.state.memoria
      .filter(m => {
        const conteudoLower = m.conteudo.toLowerCase();
        return palavrasChave.some(p => conteudoLower.includes(p));
      })
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 5);
  }

  private async extrairAprendizados(mensagem: string, resposta: string): Promise<void> {
    if (!this.state) return;

    // Adicionar à memória se for uma decisão ou contexto importante
    const ehDecisao = resposta.toLowerCase().includes('decid') || 
                      resposta.toLowerCase().includes('defin') ||
                      resposta.toLowerCase().includes('aprova');

    if (ehDecisao) {
      this.state.memoria.push({
        tipo: 'decisao',
        conteudo: `Demanda: ${mensagem.slice(0, 100)}... Decisão: ${resposta.slice(0, 200)}...`,
        relevancia: 0.8,
        criado_em: new Date().toISOString()
      });

      // Manter apenas últimas 50 memórias
      if (this.state.memoria.length > 50) {
        this.state.memoria = this.state.memoria
          .sort((a, b) => b.relevancia - a.relevancia)
          .slice(0, 40);
      }

      await this.salvarEstado();
    }
  }

  private async handleGetMemoria(): Promise<Response> {
    await this.carregarEstado();
    
    return new Response(JSON.stringify({
      total: this.state?.memoria.length || 0,
      memoria: this.state?.memoria || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetEstado(): Promise<Response> {
    await this.carregarEstado();
    
    return new Response(JSON.stringify(this.state), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
