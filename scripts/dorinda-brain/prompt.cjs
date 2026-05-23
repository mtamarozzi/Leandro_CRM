// scripts/dorinda-brain/prompt.cjs
const fs = require('node:fs');
const path = require('node:path');

const START_MARKER = '===== INÍCIO DO PROMPT =====';

function nowPtBr(date = new Date()) {
  // America/Sao_Paulo, formato legível pro modelo
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short',
  }).format(date);
}

function extractPrompt(raw, nowStr) {
  const idx = raw.lastIndexOf(START_MARKER);
  let body = idx >= 0 ? raw.slice(idx + START_MARKER.length) : raw;
  // remove um marcador de fim, se existir
  body = body.replace(/=====\s*FIM DO PROMPT\s*=====[\s\S]*$/i, '');
  return body.replace(/\{\{\s*\$now\s*\}\}/g, nowStr).trim();
}

function loadPrompt(nowStr = nowPtBr()) {
  const file = path.resolve(__dirname, '../../docs/PROMPT-DORINDA.md');
  return extractPrompt(fs.readFileSync(file, 'utf8'), nowStr);
}

module.exports = { extractPrompt, nowPtBr, loadPrompt };
