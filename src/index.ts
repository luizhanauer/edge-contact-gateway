import { EmailMessage } from "cloudflare:email";

export interface Env {
  EMAIL: any;
  DESTINATION_EMAIL: string;
  SENDER_EMAIL: string;
}

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://hanauerlabs.com.br', // Mantenha o seu domínio real aqui
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const handleOptions = (): Response => {
  return new Response(null, { headers: CORS_HEADERS });
};

// Função de codificação segura para UTF-8 (Evita o crash do btoa)
const encodeSubject = (text: string): string => {
  const utf8Bytes = new TextEncoder().encode(text);
  const binaryString = String.fromCharCode(...utf8Bytes);
  return `=?utf-8?B?${btoa(binaryString)}?=`;
};

const buildRawEmail = (env: Env, payload: ContactPayload): string => {
  return `From: ${env.SENDER_EMAIL}
To: ${env.DESTINATION_EMAIL}
Subject: ${encodeSubject(`[Diagnóstico Hanauer Labs] ${payload.subject}`)}
Content-Type: text/plain; charset="utf-8"

Nova solicitação de diagnóstico técnico:

Nome: ${payload.name}
E-mail (Contato): ${payload.email}
Natureza do Desafio: ${payload.subject}

Mensagem / Cenário:
${payload.message}
`;
};

const dispatchEmail = async (env: Env, payload: ContactPayload): Promise<Response> => {
  const rawEmail = buildRawEmail(env, payload);
  const message = new EmailMessage(env.SENDER_EMAIL, env.DESTINATION_EMAIL, rawEmail);

  await env.EMAIL.send(message);

  return new Response(JSON.stringify({ success: true, message: 'Payload processado.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: CORS_HEADERS 
      });
    }

    try {
      const body = await request.json<ContactPayload>();

      if (!body.name || !body.email || !body.message) {
        return new Response(JSON.stringify({ error: 'Malformed Payload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }

      return await dispatchEmail(env, body);

    } catch (error) {
      // O log de erro ficará visível no painel da Cloudflare para debug
      console.error('Worker Processing Error:', error);
      
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  },
};