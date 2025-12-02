// ============================================================================
// DEV.com - Orchestrator Durable Object
// ============================================================================

import { DurableObject } from 'cloudflare:workers';
import { Env, Mesa, Mensagem, ESPECIALISTAS_MAP, CULTURA_EQUIPE, CHECKPOINTS } from '@dev.com/shared';

interface ConversaState {
  mensagens: Mensagem[];
  mesa?: Mesa;
  projeto_id?: string;
}

export class OrchestratorDO extends DurableObject<Env> {
  private conversas: Map<string, ConversaState> = new Map();
  private mesasAtivas: Map<string, Mesa> = new Map();
  private projetoAtual?: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/chat' && request.method === 'POST') {
        return this.handleChat(request);
      }

      if (path === '/mesa' && request.method === 'POST') {
        return this.handleCriarMesa(request);
      }

      // WebSocket upgrade
      if (request.headers.get('Upgrade') === 'websocket') {
        return this.handleWebSocket(request);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Erro no Orchestrator:', error);
      return new Response(JSON.stringify({ error: 'Erro interno' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleChat(request: Request): Promise<Response> {
    const { mensagem, projeto_id, mesa_id, contexto } = await request.json() as {
      mensagem: string;
      projeto_id?: string;
      mesa_id?: string;
      contexto?: Record<string, unknown>;
    };

    // 1. Analisar demanda e identificar especialistas necessários
    const analise = await this.analisarDemanda(mensagem, contexto);

    // 2. Criar ou recuperar mesa
    const mesa = mesa_id 
      ? this.mesasAtivas.get(mesa_id) || await this.criarMesa(analise.especialistas)
      : await this.criarMesa(analise.especialistas);

    // 3. Invocar especialistas em paralelo
    const contribuicoes = await this.invocarEspecialistas(mesa, mensagem, contexto);

    // 4. Sintetizar respostas
    const resposta = await this.sintetizarRespostas(mensagem, contribuicoes, analise);

    // 5. Extrair próximos passos
    const proximosPassos = await this.extrairProximosPassos(resposta, contribuicoes);

    // 6. Salvar no banco
    if (projeto_id) {
      await this.salvarConversa(projeto_id, mensagem, resposta, mesa);
    }

    return new Response(JSON.stringify({
      resposta,
      mesa_utilizada: mesa,
      contribuicoes,
      ferramentas_usadas: analise.ferramentas || [],
      proximos_passos: proximosPassos
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async analisarDemanda(mensagem: string, contexto?: Record<string, unknown>): Promise<{
    especialistas: string[];
    ferramentas?: string[];
    complexidade: 'baixa' | 'media' | 'alta';
  }> {
    const prompt = `Analise esta demanda e identifique os especialistas necessários da DEV.com.

Demanda: "${mensagem}"
${contexto ? `Contexto: ${JSON.stringify(contexto)}` : ''}

Especialistas disponíveis:
${Object.values(ESPECIALISTAS_MAP).map(e => `- ${e.id}: ${e.nome} (${e.foco})`).join('\n')}

Responda em JSON:
{
  "especialistas": ["id1", "id2", ...], // máximo 6
  "ferramentas": ["ferramenta1", ...], // se aplicável
  "complexidade": "baixa" | "media" | "alta"
}`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      }) as { response: string };

      const parsed = JSON.parse(response.response);
      return {
        especialistas: parsed.especialistas?.slice(0, 6) || ['ceo', 'cpo'],
        ferramentas: parsed.ferramentas || [],
        complexidade: parsed.complexidade || 'media'
      };
    } catch {
      return { especialistas: ['ceo', 'cpo'], complexidade: 'media' };
    }
  }

  private async criarMesa(especialistasIds: string[]): Promise<Mesa> {
    const id = crypto.randomUUID();
    const mesa: Mesa = {
      id,
      nome: `Mesa ${new Date().toISOString().slice(0, 10)}`,
      especialistas: especialistasIds,
      contexto: ''
    };
    this.mesasAtivas.set(id, mesa);
    return mesa;
  }

  private async invocarEspecialistas(
    mesa: Mesa, 
    mensagem: string, 
    contexto?: Record<string, unknown>
  ): Promise<{ especialista: string; contribuicao: string }[]> {
    const contribuicoes: { especialista: string; contribuicao: string }[] = [];

    for (const espId of mesa.especialistas) {
      const especialista = ESPECIALISTAS_MAP[espId];
      if (!especialista) continue;

      try {
        const prompt = `${especialista.systemPrompt}

${CULTURA_EQUIPE}

${CHECKPOINTS}

---
DEMANDA DO CLIENTE: ${mensagem}
${contexto ? `CONTEXTO: ${JSON.stringify(contexto)}` : ''}

Responda como ${especialista.nome}, focando em ${especialista.foco}.
Seja objetivo e prático.`;

        const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        }) as { response: string };

        contribuicoes.push({
          especialista: especialista.nome,
          contribuicao: response.response
        });
      } catch (error) {
        console.error(`Erro ao invocar ${espId}:`, error);
      }
    }

    return contribuicoes;
  }

  private async sintetizarRespostas(
    mensagemOriginal: string,
    contribuicoes: { especialista: string; contribuicao: string }[],
    analise: { complexidade: string }
  ): Promise<string> {
    const prompt = `Você é o CEO da DEV.com, sintetizando as contribuições dos especialistas.

DEMANDA ORIGINAL: ${mensagemOriginal}

CONTRIBUIÇÕES DOS ESPECIALISTAS:
${contribuicoes.map(c => `### ${c.especialista}\n${c.contribuicao}`).join('\n\n')}

Sintetize em uma resposta unificada e coerente para o cliente.
- Use linguagem clara e objetiva
- Destaque decisões importantes
- Indique próximos passos se aplicável
- Mantenha tom profissional mas acessível`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      }) as { response: string };

      return response.response;
    } catch {
      return contribuicoes.map(c => `**${c.especialista}:** ${c.contribuicao}`).join('\n\n');
    }
  }

  private async extrairProximosPassos(
    resposta: string,
    contribuicoes: { especialista: string; contribuicao: string }[]
  ): Promise<string[]> {
    const prompt = `Baseado nesta resposta e contribuições, liste os próximos passos práticos:

${resposta}

Retorne um array JSON de strings com os próximos passos (máximo 5):
["passo 1", "passo 2", ...]`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      }) as { response: string };

      return JSON.parse(response.response);
    } catch {
      return ['Aguardar aprovação do cliente', 'Detalhar próxima fase'];
    }
  }

  private async salvarConversa(
    projetoId: string,
    mensagem: string,
    resposta: string,
    mesa: Mesa
  ): Promise<void> {
    const conversaId = crypto.randomUUID();
    const mensagemId = crypto.randomUUID();
    const respostaId = crypto.randomUUID();

    try {
      await this.env.DB.batch([
        this.env.DB.prepare(
          'INSERT INTO conversas (id, projeto_id, mesa_id, titulo) VALUES (?, ?, ?, ?)'
        ).bind(conversaId, projetoId, mesa.id, mensagem.slice(0, 100)),
        this.env.DB.prepare(
          'INSERT INTO mensagens (id, conversa_id, role, content) VALUES (?, ?, ?, ?)'
        ).bind(mensagemId, conversaId, 'user', mensagem),
        this.env.DB.prepare(
          'INSERT INTO mensagens (id, conversa_id, role, content) VALUES (?, ?, ?, ?)'
        ).bind(respostaId, conversaId, 'assistant', resposta)
      ]);
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
    }
  }

  private async handleCriarMesa(request: Request): Promise<Response> {
    const { nome, especialistas } = await request.json() as {
      nome: string;
      especialistas: string[];
    };

    const mesa = await this.criarMesa(especialistas);
    mesa.nome = nome;

    return new Response(JSON.stringify(mesa), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      
      if (data.type === 'chat') {
        const response = await this.handleChat(new Request('http://internal/chat', {
          method: 'POST',
          body: JSON.stringify(data.payload)
        }));
        
        const result = await response.json();
        ws.send(JSON.stringify({ type: 'response', payload: result }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Erro ao processar mensagem' }));
    }
  }

  async webSocketClose(): Promise<void> {
    // Cleanup se necessário
  }
}
