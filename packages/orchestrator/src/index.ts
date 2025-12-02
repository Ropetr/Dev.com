// ============================================================================
// DEV.com Orchestrator - Entry Point
// ============================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from '@dev.com/shared';
import { OrchestratorDO } from './orchestrator';
import { AgentDO } from './agent';

// Export Durable Objects
export { OrchestratorDO, AgentDO };

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'DEV.com Orchestrator',
    version: '3.0.0',
    status: 'online',
    especialistas: 44,
    diretorias: 11,
    endpoints: {
      chat: 'POST /api/chat',
      mesa: 'POST /api/mesa',
      especialistas: 'GET /api/especialistas',
      projeto: 'GET /api/projeto/:id',
      templates: 'GET /api/mesas/templates',
      agent: 'POST /api/agent/:especialista',
      ws: 'GET /ws'
    }
  });
});

// ============================================================================
// API Routes
// ============================================================================

// Chat principal - envia mensagem e recebe resposta orquestrada
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { mensagem, projeto_id, mesa_id, contexto } = body;

    if (!mensagem) {
      return c.json({ error: 'Mensagem é obrigatória' }, 400);
    }

    // Get or create Orchestrator DO instance
    const id = c.env.ORCHESTRATOR.idFromName(projeto_id || 'default');
    const orchestrator = c.env.ORCHESTRATOR.get(id);

    // Forward request to Orchestrator
    const response = await orchestrator.fetch(new Request('http://internal/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem, projeto_id, mesa_id, contexto })
    }));

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    return c.json({ error: 'Erro interno no processamento' }, 500);
  }
});

// Criar mesa de especialistas
app.post('/api/mesa', async (c) => {
  try {
    const body = await c.req.json();
    const { nome, especialistas, projeto_id } = body;

    if (!nome || !especialistas || !Array.isArray(especialistas)) {
      return c.json({ error: 'Nome e lista de especialistas são obrigatórios' }, 400);
    }

    const id = c.env.ORCHESTRATOR.idFromName(projeto_id || 'default');
    const orchestrator = c.env.ORCHESTRATOR.get(id);

    const response = await orchestrator.fetch(new Request('http://internal/mesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, especialistas })
    }));

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    return c.json({ error: 'Erro ao criar mesa' }, 500);
  }
});

// Listar especialistas
app.get('/api/especialistas', async (c) => {
  const { ESPECIALISTAS } = await import('@dev.com/shared');
  return c.json({
    total: ESPECIALISTAS.length,
    especialistas: ESPECIALISTAS
  });
});

// Obter projeto
app.get('/api/projeto/:id', async (c) => {
  const projetoId = c.req.param('id');
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM projetos WHERE id = ?'
    ).bind(projetoId).first();

    if (!result) {
      return c.json({ error: 'Projeto não encontrado' }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return c.json({ error: 'Erro ao buscar projeto' }, 500);
  }
});

// Templates de mesas pré-configuradas
app.get('/api/mesas/templates', async (c) => {
  const { MESAS_TEMPLATES } = await import('@dev.com/shared');
  return c.json({
    total: MESAS_TEMPLATES.length,
    templates: MESAS_TEMPLATES
  });
});

// Invocar agente específico
app.post('/api/agent/:especialista', async (c) => {
  try {
    const especialistaId = c.req.param('especialista');
    const body = await c.req.json();

    const id = c.env.AGENT.idFromName(especialistaId);
    const agent = c.env.AGENT.get(id);

    const response = await agent.fetch(new Request('http://internal/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('Erro ao invocar agente:', error);
    return c.json({ error: 'Erro ao invocar agente' }, 500);
  }
});

// WebSocket para chat em tempo real
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket', 426);
  }

  const id = c.env.ORCHESTRATOR.idFromName('ws-default');
  const orchestrator = c.env.ORCHESTRATOR.get(id);

  return orchestrator.fetch(c.req.raw);
});

export default app;
