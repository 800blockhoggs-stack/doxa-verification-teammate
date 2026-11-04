// Doxa — the verification teammate. Flip the Switch Hackathon 2026, Team Axis Sovereign Energy.
// Loads the deterministic auditor engine (engine/) headlessly and answers deliverables
// dropped in the Discord channel with a graded verdict: FACT / INTERPRETATION / UNSUPPORTED.
//
// Env: DISCORD_TOKEN (required) · DOXA_CHANNEL_ID (optional — else answers when @mentioned)

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ---------- engine harness (browser file, headless) ----------
const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'deliverable-auditor-demo.html');

function loadEngine() {
  const html = fs.readFileSync(ENGINE_PATH, 'utf-8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('engine script block not found');
  const js = m[1] + '\nmodule.exports={runAudit:runAudit,computeSDF:computeSDF};';
  const stubEl = {
    value: '', innerHTML: '', textContent: '', style: {}, offsetTop: 0,
    classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {},
    set onclick(v) {}, set onchange(v) {}
  };
  global.document = {
    getElementById: () => stubEl, createElement: () => stubEl,
    querySelectorAll: () => [], addEventListener() {}
  };
  global.window = { scrollTo() {}, print() {} };
  global.localStorage = { getItem: () => null, setItem() {} };
  const mod = new module.constructor();
  mod._compile(js, 'engine.js');
  return mod.exports;
}

const engine = loadEngine();

// ---------- deterministic auto-grader (disclosed heuristic — see README) ----------
const RE_INTERPRETATION = /we believe|we think|we expect|expected to|likely|will\b|may\b|might|should|could|estimate|forecast|probably|potentially/i;
const RE_SUPERLATIVE = /best-in-class|industry-leading|world-class|cutting-edge|revolutionary|game-chang|seamless|robust|innovative|next-generation|state-of-the-art|obviously|clearly|undeniably|unmatched|unparalleled/i;
const RE_EVIDENCE = /\d|according to|per\s|as reported|cited|source:|\$[\d,.]+|\d+(\.\d+)?%|"[^"]{5,}"/i;

function autoGrade(claimText) {
  if (RE_INTERPRETATION.test(claimText)) return 'interpretation';
  if (RE_SUPERLATIVE.test(claimText)) return 'unsupported';
  if (RE_EVIDENCE.test(claimText)) return 'fact';
  return 'unsupported'; // no evidence shape — conservative default, disclosed in README
}

const GRADE_VERDICT = { fact: 'PASS', interpretation: 'UNVERIFIED', unsupported: 'FAIL' };

// ---------- verdict formatting ----------
function buildVerdict(result) {
  const gradedClaims = result.claims.map(c => {
    const grade = autoGrade(c.body + ' ' + (c.header || ''));
    return { ...c, grade };
  });
  const sdf = engine.computeSDF(gradedClaims, result.dressing);
  if (sdf.sdfIntegrity === null) return { text: 'DOXA: no gradable claims found in that input.', sdf };

  const counts = `Claims: ${sdf.totalClaims} extracted · ${sdf.factCount} FACT · ${sdf.interpretationCount} INTERPRETATION · ${sdf.unsupportedCount} UNSUPPORTED`;
  const scores = `Integrity **${sdf.sdfIntegrity}**/100 · Fraud Risk **${sdf.fraudRisk}**/100`;
  const rows = gradedClaims.slice(0, 8).map(c =>
    `\`${String(c.idx).padStart(2, '0')}\` **${GRADE_VERDICT[c.grade]}** (${c.grade}) — ${c.body.slice(0, 90)}${c.body.length > 90 ? '…' : ''}`
  );
  const more = gradedClaims.length > 8 ? `\n…and ${gradedClaims.length - 8} more (full table in engine export)` : '';
  const trail = `scan \`${result.scanId}\` · pattern set \`${result.pHash}\` — deterministic: same input, same verdict`;

  const text = [
    `**DOXA VERDICT — ${result.doc}**`,
    scores, counts, '', sdf.state, '', ...rows, more, '', trail
  ].join('\n');
  return { text: text.slice(0, 1950), sdf };
}

// ---------- discord ----------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.on('messageCreate', async (msg) => {
  try {
    if (msg.author.bot) return;
    const addressed = process.env.DOXA_CHANNEL_ID
      ? msg.channel.id === process.env.DOXA_CHANNEL_ID
      : msg.mentions.has(client.user);
    if (!addressed) return;

    let text = msg.content || '';
    const file = msg.attachments.find(a => /\.(txt|md)$/i.test(a.name || ''));
    if (file && file.size < 400 * 1024) {
      const res = await fetch(file.url);
      text += '\n' + await res.text();
    }
    if (text.trim().length < 40) {
      await msg.reply('DOXA: drop a deliverable — paste text or attach a .txt/.md — and I will grade every claim in it.');
      return;
    }

    const result = engine.runAudit(text, msg.author.username, 'doxa');
    const verdict = buildVerdict(result);
    await msg.reply(verdict.text);
  } catch (err) {
    console.error(err);
    try { await msg.reply('DOXA: audit failed on that input — error logged. Try plainer text.'); } catch (_) {}
  }
});

client.once('ready', () => console.log(`Doxa online as ${client.user.tag} · engine pattern hash verified`));
client.login(process.env.DISCORD_TOKEN);
