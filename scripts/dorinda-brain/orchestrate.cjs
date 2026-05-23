// scripts/dorinda-brain/orchestrate.cjs
// HTTP method decidido na Task 1 (Fase 0). httpFn é injetado pelo chamador:
//   - no n8n: wrapper sobre this.helpers.httpRequest (ou fetch)
//   - nos testes: fake
const { buildContents, parseGeminiParts, rpcNameFor } = require('./helpers.cjs');
const { FUNCTION_DECLARATIONS } = require('./tools.cjs');

const FALLBACK_TEXT = 'Tive um probleminha aqui pra puxar essa informação, mas já vou chamar o Leandro pra te ajudar direto, tá? Um instante 🙏';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function geminiGenerate(cfg, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${cfg.model}:generateContent?key=${cfg.geminiKey}`;
  const body = {
    system_instruction: { parts: [{ text: cfg.systemPrompt }] },
    contents,
    tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
    generationConfig: { temperature: 0.3 },
  };
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await cfg.httpFn({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, body, json: true });
    } catch (e) {
      lastErr = e;
      const code = e.statusCode || e.status || e.httpCode; // n8n usa .httpCode; fetch/testes usam .statusCode
      if (code === 503 || code === 429) { await sleep(1500); continue; }
      throw e;
    }
  }
  throw lastErr;
}

async function callRpc(cfg, toolName, args) {
  const url = `${cfg.supabaseUrl}/rest/v1/rpc/${rpcNameFor(toolName)}`;
  return cfg.httpFn({
    method: 'POST', url, json: true,
    headers: { apikey: cfg.anon, Authorization: `Bearer ${cfg.anon}`, 'Content-Type': 'application/json' },
    body: args || {},
  });
}

async function loadHistory(cfg) {
  const url = `${cfg.supabaseUrl}/rest/v1/chat_messages?conversation_id=eq.${cfg.conversationId}&select=sender_type,content,created_at&order=created_at.asc`;
  return cfg.httpFn({ method: 'GET', url, json: true, headers: { apikey: cfg.anon, Authorization: `Bearer ${cfg.anon}` } });
}

async function handoffFallback(cfg, reason) {
  try {
    await callRpc(cfg, 'notificar_corretor', {
      p_tipo: 'handoff', p_urgencia: 'alta', p_conversation_id: cfg.conversationId,
      p_mensagem: 'Falha técnica no atendimento automático da Dorinda: ' + reason + '. Assumir a conversa.',
    });
  } catch (_) { /* não deixa o fallback quebrar a resposta */ }
  return { output: FALLBACK_TEXT, conversation_id: cfg.conversationId, _fallback: reason };
}

async function runConversation(cfg) {
  let contents;
  try {
    const history = await loadHistory(cfg);
    contents = buildContents(Array.isArray(history) ? history : []);
  } catch (e) {
    return handoffFallback(cfg, 'load_history_falhou:' + (e.statusCode || e.message));
  }
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: 'oi' }] });

  let resp;
  try {
    resp = await geminiGenerate(cfg, contents);
  } catch (e) {
    return handoffFallback(cfg, 'gemini_indisponivel:' + (e.statusCode || e.message));
  }

  for (let iter = 0; iter < cfg.maxIter; iter++) {
    const { functionCalls, text, modelContent } = parseGeminiParts(resp);
    if (!functionCalls.length) {
      return { output: text || FALLBACK_TEXT, conversation_id: cfg.conversationId };
    }
    contents.push(modelContent);
    const responseParts = [];
    for (const fc of functionCalls) {
      let result;
      try { result = await callRpc(cfg, fc.name, fc.args); }
      catch (e) { result = { ok: false, error: 'rpc_http_error', message: String(e.statusCode || e.message) }; }
      responseParts.push({ functionResponse: { name: fc.name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
    try { resp = await geminiGenerate(cfg, contents); }
    catch (e) { return handoffFallback(cfg, 'gemini_indisponivel_no_loop:' + (e.statusCode || e.message)); }
  }
  return handoffFallback(cfg, 'max_iter_excedido');
}

module.exports = { runConversation, FALLBACK_TEXT };
