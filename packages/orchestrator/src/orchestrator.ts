// ============================================================================
// DEV.com Orchestrator Durable Object
// O "CEO/Moderador" que coordena todos os agentes
// ============================================================================

import { DurableObject } from 'cloudflare:workers';
import type { Env, Mesa, EspecialistaId, OrchestratorOutput, ContribuicaoEspecialista } from '@dev.com/shared/types';
import { ESPECIALISTAS_MAP, MESAS_TEMPLATES, getMesaTemplate } from '@dev.com/shared/especialistas';

interface OrchestratorState {
  conversas: Map<string, any[]>;
  mesasAtivas: Map<string, Mesa>;
  projetoAtual?: string;
}

export class OrchestratorDO extends DurableObject {
  private state: OrchestratorState = {
    conversas: new Map(),
    mesasAtivas: new Map()
  };
  
  private env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }
    
    // API routes
    switch (url.pathname) {
      case '/chat':
        return this.handleChat(request);
      case '/mesa':
        return this.handleMesa(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // ============================================================================
  // Main Chat Handler
  // ============================================================================
  private async handleChat(request: Request): Promise<Response> {
    const { mensagem, projeto_id, mesa_id } = await request.json() as any;
    
    try {
      // Step 1: Analyze the demand and decide which specialists to invoke
      const analise = await this.analisarDemanda(mensagem);
      
      // Step 2: Get or create mesa based on analysis
      const mesa = mesa_id 
        ? this.state.mesasAtivas.get(mesa_id)
        : this.criarMesa(analise.especialistasRecomendados, analise.tipoDemanda);
      
      if (!mesa) {
        return Response.json({ error: 'Mesa não encontrada' }, { status: 404 });
      }
      
      // Step 3: Invoke specialists in parallel
      const contribuicoes = await this.invocarEspecialistas(mesa.especialistas, mensagem, projeto_id);
      
      // Step 4: Synthesize responses
      const respostaFinal = await this.sintetizarRespostas(mensagem, contribuicoes);
      
      // Step 5: Build output
      const output: OrchestratorOutput = {
        resposta: respostaFinal,
        mesa_utilizada: mesa,
        contribuicoes,
        ferramentas_usadas: [],
        proximos_passos: this.extrairProximosPassos(respostaFinal)
      };
      
      return Response.json(output);
      
    } catch (error) {
      console.error('Orchestrator error:', error);
      return Response.json({ 
        error: 'Erro ao processar mensagem',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // ============================================================================
  // Demand Analysis - Decides which specialists to invoke
  // ============================================================================
  private async analisarDemanda(mensagem: string): Promise<{
    tipoDemanda: string;
    especialistasRecomendados: EspecialistaId[];
    complexidade: 'baixa' | 'media' | 'alta';
  }> {
    const prompt = `Você é o CEO da DEV.com, uma fábrica de software com 44 especialistas.

Analise a seguinte demanda e decida:
1. Qual o tipo de demanda (ex: "módulo de vendas", "integração", "arquitetura")
2. Quais especialistas devem ser consultados (máximo 6)
3. Qual a complexidade (baixa, média, alta)

DEMANDA: "${mensagem}"

ESPECIALISTAS DISPONÍVEIS:
- ceo, cpo, guardiao, scrum-master (Estratégia)
- vendas, marketplaces, omnichannel, ecommerce, crm-cs (Comercial)
- cfo, tributario, economista, pricing (Financeiro)
- logistica, compras, estoque (Operações)
- bi, ga4, gtm, ia-automacoes, data-engineer (Dados)
- cto, frontend, backend, devops, github-cloudflare, seguranca, infra, dba, mobile (Técnica)
- seo, copywriter, email-marketing, social-media, video (Marketing)
- ux-ui, ux-writer, branding, suporte-cx, onboarding, tech-writer (Experiência)
- advogado (Jurídico)
- rh-people (People)
- qa-processos (Qualidade)

Responda APENAS em JSON válido:
{
  "tipoDemanda": "string",
  "especialistasRecomendados": ["id1", "id2", ...],
  "complexidade": "baixa" | "media" | "alta"
}`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });

    try {
      const text = (response as any).response || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing analysis:', e);
    }

    // Fallback: basic analysis based on keywords
    return this.analiseBasica(mensagem);
  }

  private analiseBasica(mensagem: string): {
    tipoDemanda: string;
    especialistasRecomendados: EspecialistaId[];
    complexidade: 'baixa' | 'media' | 'alta';
  } {
    const msg = mensagem.toLowerCase();
    
    // Check for template matches
    for (const template of MESAS_TEMPLATES) {
      if (msg.includes(template.caso.toLowerCase()) || 
          template.descricao.toLowerCase().split(' ').some(word => msg.includes(word))) {
        return {
          tipoDemanda: template.caso,
          especialistasRecomendados: template.especialistas,
          complexidade: template.especialistas.length > 4 ? 'alta' : 'media'
        };
      }
    }
    
    // Default: CEO + CPO + CTO
    return {
      tipoDemanda: 'Consulta geral',
      especialistasRecomendados: ['ceo', 'cpo', 'cto'],
      complexidade: 'baixa'
    };
  }

  // ============================================================================
  // Create Mesa
  // ============================================================================
  private criarMesa(especialistas: EspecialistaId[], tipoDemanda: string): Mesa {
    const mesa: Mesa = {
      id: crypto.randomUUID(),
      nome: `Mesa: ${tipoDemanda}`,
      descricao: `Mesa criada automaticamente para: ${tipoDemanda}`,
      especialistas,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };
    
    this.state.mesasAtivas.set(mesa.id, mesa);
    return mesa;
  }

  // ============================================================================
  // Handle Mesa Creation
  // ============================================================================
  private async handleMesa(request: Request): Promise<Response> {
    const { demanda, especialistas } = await request.json() as any;
    
    let especialistasFinais: EspecialistaId[];
    
    if (especialistas && especialistas.length > 0) {
      especialistasFinais = especialistas;
    } else {
      const analise = await this.analisarDemanda(demanda);
      especialistasFinais = analise.especialistasRecomendados;
    }
    
    const mesa = this.criarMesa(especialistasFinais, demanda);
    
    return Response.json({
      mesa,
      especialistas: especialistasFinais.map(id => ({
        id,
        ...ESPECIALISTAS_MAP[id] ? {
          nome: ESPECIALISTAS_MAP[id].nome,
          emoji: ESPECIALISTAS_MAP[id].emoji,
          foco: ESPECIALISTAS_MAP[id].foco
        } : {}
      }))
    });
  }

  // ============================================================================
  // Invoke Specialists in Parallel
  // ============================================================================
  private async invocarEspecialistas(
    especialistas: EspecialistaId[],
    mensagem: string,
    projetoId?: string
  ): Promise<ContribuicaoEspecialista[]> {
    const contribuicoes = await Promise.all(
      especialistas.map(async (especialistaId) => {
        try {
          // Get specialist info
          const especialista = ESPECIALISTAS_MAP[especialistaId];
          if (!especialista) {
            return {
              especialista: especialistaId,
              contribuicao: `[Especialista ${especialistaId} não configurado]`,
              ferramentas_usadas: [],
              confianca: 0
            };
          }
          
          // Call AI with specialist's system prompt
          const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: [
              { role: 'system', content: especialista.systemPrompt },
              { role: 'user', content: mensagem }
            ],
            max_tokens: 1000
          });
          
          return {
            especialista: especialistaId,
            contribuicao: (response as any).response || '[Sem resposta]',
            ferramentas_usadas: [],
            confianca: 0.85
          };
          
        } catch (error) {
          console.error(`Error invoking ${especialistaId}:`, error);
          return {
            especialista: especialistaId,
            contribuicao: `[Erro ao consultar especialista]`,
            ferramentas_usadas: [],
            confianca: 0
          };
        }
      })
    );
    
    return contribuicoes;
  }

  // ============================================================================
  // Synthesize Responses
  // ============================================================================
  private async sintetizarRespostas(
    mensagemOriginal: string,
    contribuicoes: ContribuicaoEspecialista[]
  ): Promise<string> {
    const contribuicoesTexto = contribuicoes
      .map(c => {
        const esp = ESPECIALISTAS_MAP[c.especialista];
        return `**${esp?.emoji || '👤'} ${esp?.nome || c.especialista}:**\n${c.contribuicao}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Você é o Moderador de Mesa da DEV.com.

Sua tarefa é sintetizar as contribuições dos especialistas em uma resposta unificada e coerente.

DEMANDA ORIGINAL: "${mensagemOriginal}"

CONTRIBUIÇÕES DOS ESPECIALISTAS:
${contribuicoesTexto}

INSTRUÇÕES:
1. Sintetize as contribuições em uma resposta clara e organizada
2. Destaque pontos de consenso e divergência (se houver)
3. Organize por temas/áreas quando fizer sentido
4. Inclua próximos passos sugeridos
5. Mantenha a personalidade e emojis dos especialistas quando relevante

Formate a resposta de forma profissional mas acessível.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });

    return (response as any).response || contribuicoesTexto;
  }

  // ============================================================================
  // Extract Next Steps
  // ============================================================================
  private extrairProximosPassos(resposta: string): string[] {
    const linhas = resposta.split('\n');
    const passos: string[] = [];
    
    let emSecaoPassos = false;
    for (const linha of linhas) {
      if (linha.toLowerCase().includes('próximo') || linha.toLowerCase().includes('passo')) {
        emSecaoPassos = true;
      }
      if (emSecaoPassos && (linha.startsWith('-') || linha.startsWith('•') || linha.match(/^\d+\./))) {
        passos.push(linha.replace(/^[-•\d.]\s*/, '').trim());
      }
    }
    
    return passos.slice(0, 5); // Max 5 steps
  }

  // ============================================================================
  // WebSocket Handler for Real-time Chat
  // ============================================================================
  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.ctx.acceptWebSocket(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      
      if (data.type === 'chat') {
        // Process message through orchestrator
        const response = await this.handleChat(new Request('http://internal/chat', {
          method: 'POST',
          body: JSON.stringify(data.payload)
        }));
        
        const result = await response.json();
        ws.send(JSON.stringify({ type: 'response', payload: result }));
      }
      
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: 'Error processing message' }
      }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    console.log(`WebSocket closed: ${code} - ${reason}`);
  }
}
