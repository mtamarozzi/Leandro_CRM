// scripts/dorinda-brain/helpers.js
function mergeConsecutiveRoles(turns) {
  const out = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.text += '\n\n' + t.text;
    else out.push({ role: t.role, text: t.text });
  }
  return out;
}

function buildContents(chatMessages) {
  const turns = chatMessages.map((m) => ({
    role: m.sender_type === 'visitor' ? 'user' : 'model',
    text: m.content || '',
  }));
  const merged = mergeConsecutiveRoles(turns);
  while (merged.length && merged[0].role === 'model') merged.shift(); // Gemini exige começar com user
  return merged.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
}

function parseGeminiParts(resp) {
  const content = resp?.candidates?.[0]?.content || { parts: [] };
  const parts = content.parts || [];
  const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
  const text = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join('');
  return { functionCalls, text, modelContent: content };
}

function rpcNameFor(toolName) {
  return 'dorinda_' + toolName;
}

module.exports = { mergeConsecutiveRoles, buildContents, parseGeminiParts, rpcNameFor };
