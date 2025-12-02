// ============================================================================
// DEV.com Orchestrator - Entry Point
// ============================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { OrchestratorDO } from './orchestrator';
import { AgentDO } from './agent';
import type { Env } from '@dev.com/shared/types';

// Export Durable Objects
export { OrchestratorDO, AgentDO };

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// ============================================================================
// Health Check
// ============================================================================
app.get('/', (c) => {
  return c.json({
    name: 'DEV.com Multi-Agent System',
    version: '3.0.0',
    status: 'online',
    especialistas: 44,
    diretorias: 11,
    endpoints: {
      chat: 'POST /api/chat',
      mesa: 'POST /api/mesa',
      especialistas: 'GET /api/especialistas',
      projeto: 'GET /api/projeto/:id',
    }
  });
});

// ============================================================================
// API Routes
// ============================================================================

// Chat endpoint - main entry point for conversations
app.post('/api/chat', async (c) => {
  const body = await c.req.json();
  const { mensagem, projeto_id, mesa_id } = body;

  if (!mensagem) {
    return c.json({ error: 'Mensagem é obrigatória' }, 400);
  }

  // Get orchestrator Durable Object
  const id = c.env.ORCHESTRATOR_DO.idFromName('main');
  const stub = c.env.ORCHESTRATOR_DO.get(id);

  // Forward request to orchestrator
  const response = await stub.fetch(new Request('http://internal/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensagem, projeto_id, mesa_id })
  }));

  return response;
});

// Create/get mesa de especialistas
app.post('/api/mesa', async (c) => {
  const body = await c.req.json();
  const { demanda, especialistas } = body;

  const id = c.env.ORCHESTRATOR_DO.idFromName('main');
  const stub = c.env.ORCHESTRATOR_DO.get(id);

  const response = await stub.fetch(new Request('http://internal/mesa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demanda, especialistas })
  }));

  return response;
});

// List especialistas
app.get('/api/especialistas', async (c) => {
  const diretoria = c.req.query('diretoria');
  
  // Import especialistas map
  const { ESPECIALISTAS_MAP, getEspecialistasPorDiretoria } = await import('@dev.com/shared/especialistas');
  
  if (diretoria) {
    const lista = getEspecialistasPorDiretoria(diretoria);
    return c.json({ especialistas: lista });
  }
  
  const lista = Object.values(ESPECIALISTAS_MAP).map(e => ({
    id: e.id,
    nome: e.nome,
    diretoria: e.diretoria,
    emoji: e.emoji,
    foco: e.foco
  }));
  
  return c.json({ especialistas: lista, total: lista.length });
});

// Get projeto
app.get('/api/projeto/:id', async (c) => {
  const projetoId = c.req.param('id');
  
  // Query D1
  const result = await c.env.DB.prepare(
    'SELECT * FROM projetos WHERE id = ?'
  ).bind(projetoId).first();
  
  if (!result) {
    return c.json({ error: 'Projeto não encontrado' }, 404);
  }
  
  return c.json({ projeto: result });
});

// List mesas templates
app.get('/api/mesas/templates', async (c) => {
  const { MESAS_TEMPLATES } = await import('@dev.com/shared/especialistas');
  return c.json({ templates: MESAS_TEMPLATES });
});

// Invoke specific agent directly
app.post('/api/agent/:especialista', async (c) => {
  const especialistaId = c.req.param('especialista');
  const body = await c.req.json();
  const { mensagem, contexto } = body;

  // Get agent Durable Object
  const id = c.env.AGENT_DO.idFromName(especialistaId);
  const stub = c.env.AGENT_DO.get(id);

  const response = await stub.fetch(new Request('http://internal/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensagem, contexto })
  }));

  return response;
});

// ============================================================================
// WebSocket endpoint for real-time chat
// ============================================================================
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket', 400);
  }

  const id = c.env.ORCHESTRATOR_DO.idFromName('main');
  const stub = c.env.ORCHESTRATOR_DO.get(id);
  
  return stub.fetch(c.req.raw);
});

// Export default
export default app;
