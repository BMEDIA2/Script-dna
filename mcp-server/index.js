import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const SB_URL = process.env.SUPABASE_URL || 'https://gtoomkmpovppjjsktedd.supabase.co';
const SB_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b29ta21wb3ZwcGpqc2t0ZWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTY0MjEsImV4cCI6MjA5NDY5MjQyMX0.OTbX5WyJORQTBBMoGrDmRKrxfRApf3sG9OoC6GN6dzQ';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Prefer': 'return=representation',
};

async function sbGet(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}${params}`, { headers });
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const server = new Server(
  { name: 'script-dna', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_personas',
      description: 'Lista todos los clones/personas disponibles en Script DNA.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'add_context',
      description:
        'Sube un bloque de contexto (texto) al DNA de un clon en Script DNA. ' +
        'Úsalo cuando el colaborador quiera añadir información sobre el clon: historia, resultados, oferta, cliente ideal, voz, etc.',
      inputSchema: {
        type: 'object',
        required: ['persona_id', 'content'],
        properties: {
          persona_id: {
            type: 'string',
            description: 'UUID del clon al que pertenece este contexto (obtenlo con list_personas).',
          },
          content: {
            type: 'string',
            description: 'El texto con el contexto a añadir.',
          },
          label: {
            type: 'string',
            description: 'Título corto que describe el contenido (ej: "Historia de origen", "Caso de éxito 1").',
          },
          categoria: {
            type: 'string',
            enum: ['historia', 'resultados', 'cliente', 'oferta', 'voz', 'general'],
            description: 'Categoría del contenido. Por defecto: general.',
          },
        },
      },
    },
    {
      name: 'get_context',
      description:
        'Devuelve todos los items del DNA de un clon. ' +
        'Útil para revisar qué contexto ya existe antes de añadir nuevo.',
      inputSchema: {
        type: 'object',
        required: ['persona_id'],
        properties: {
          persona_id: {
            type: 'string',
            description: 'UUID del clon.',
          },
          categoria: {
            type: 'string',
            description: 'Filtra por categoría (opcional).',
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    if (name === 'list_personas') {
      const personas = await sbGet('personas', '?select=id,nombre,cta,tono,tuteo,created_at&order=created_at.desc');
      if (!personas.length) {
        return { content: [{ type: 'text', text: 'No hay clones creados todavía.' }] };
      }
      const lines = personas.map(
        (p) => `• **${p.nombre}** (id: \`${p.id}\`)\n  CTA: ${p.cta || '—'}  |  Tono: ${(p.tono || []).join(', ') || '—'}`
      );
      return { content: [{ type: 'text', text: `Clones en Script DNA:\n\n${lines.join('\n\n')}` }] };
    }

    if (name === 'add_context') {
      const { persona_id, content, label, categoria = 'general' } = args;
      if (!persona_id || !content) throw new Error('persona_id y content son obligatorios.');

      const item = {
        id: uid(),
        persona_id,
        type: 'texto',
        label: label || `Contexto ${new Date().toLocaleDateString('es-ES')}`,
        text: content,
        chars: content.length,
        categoria,
      };

      await sbPost('library_items', item);

      return {
        content: [
          {
            type: 'text',
            text: `Contexto añadido correctamente.\n\n**Item:** ${item.label}\n**Categoría:** ${categoria}\n**Caracteres:** ${content.length}\n**ID:** \`${item.id}\``,
          },
        ],
      };
    }

    if (name === 'get_context') {
      const { persona_id, categoria } = args;
      if (!persona_id) throw new Error('persona_id es obligatorio.');

      let params = `?persona_id=eq.${persona_id}&order=created_at.desc`;
      if (categoria) params += `&categoria=eq.${categoria}`;

      const items = await sbGet('library_items', params);

      if (!items.length) {
        return { content: [{ type: 'text', text: 'No hay contexto guardado para este clon todavía.' }] };
      }

      const lines = items.map(
        (it) =>
          `• **${it.label}** [${it.categoria}] — ${it.chars} chars\n  ${(it.text || '').slice(0, 120)}${it.text && it.text.length > 120 ? '…' : ''}`
      );
      return {
        content: [{ type: 'text', text: `DNA del clon (${items.length} items):\n\n${lines.join('\n\n')}` }],
      };
    }

    throw new Error(`Herramienta desconocida: ${name}`);
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
