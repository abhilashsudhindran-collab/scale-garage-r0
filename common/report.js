// Result recorder for each spike.
// Automatic measurements are recorded by the page; the PASS/FAIL verdict is
// always set by the person running the test on the phone, never automatically.
// Reports live only in this browser's localStorage until copied by the user.

import { KIT_VERSION, deviceInfo, el, $ } from './util.js';

const KEY = (id) => `sgr0.report.${id}`;

export class Report {
  constructor(spikeId, title, criteria) {
    this.key = KEY(spikeId);
    const saved = safeParse(localStorage.getItem(this.key));
    this.data = saved && saved.kitVersion === KIT_VERSION ? saved : {
      spike: spikeId, title, kitVersion: KIT_VERSION,
      startedAt: new Date().toISOString(), device: deviceInfo(),
      criteria: criteria.map(c => ({ ...c, verdict: null, note: '' })),
      measurements: {}, log: [],
    };
    // Refresh device snapshot (standalone/online can change between runs).
    this.data.deviceLatest = deviceInfo();
    this.save();
  }

  save() {
    this.data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { console.warn(e); }
  }

  measure(key, value) { this.data.measurements[key] = value; this.save(); }

  push(key, value) {
    (this.data.measurements[key] ||= []).push(value);
    this.save();
  }

  log(msg, extra) {
    const line = { t: new Date().toISOString(), msg, ...(extra !== undefined ? { extra } : {}) };
    this.data.log.push(line);
    if (this.data.log.length > 300) this.data.log.shift();
    this.save();
    const box = $('#log');
    if (box) box.textContent = this.data.log.slice(-40).map(l => `${l.t.slice(11, 19)}  ${l.msg}` +
      (l.extra !== undefined ? `  ${JSON.stringify(l.extra)}` : '')).join('\n');
  }

  reset() { localStorage.removeItem(this.key); location.reload(); }

  json() { return JSON.stringify(this.data, null, 2); }

  // Renders the verdict panel + export buttons into `container`.
  renderPanel(container) {
    container.innerHTML = '';
    container.append(el('h2', {}, 'Your verdict'));
    container.append(el('p', { class: 'muted' },
      'Mark each check yourself after trying it on the phone. Leave it blank if you have not tested it.'));
    this.data.criteria.forEach((c) => {
      const wrap = el('div', { class: 'card' });
      wrap.append(el('div', {}, el('strong', {}, c.label)));
      if (c.how) wrap.append(el('div', { class: 'muted' }, c.how));
      const row = el('div', { class: 'verdict' });
      for (const v of ['pass', 'fail', 'na']) {
        const b = el('button', { class: `secondary ${c.verdict === v ? 'sel-' + v : ''}`, type: 'button' },
          v === 'na' ? 'Not tested' : v.toUpperCase());
        b.addEventListener('click', () => { c.verdict = v; this.save(); this.renderPanel(container); });
        row.append(b);
      }
      wrap.append(row);
      const note = el('textarea', { rows: '2', placeholder: 'Notes (what you saw, problems)' });
      note.value = c.note;
      note.addEventListener('input', () => { c.note = note.value; this.save(); });
      wrap.append(note);
      container.append(wrap);
    });
    const out = el('div', { class: 'row' });
    out.append(el('button', { type: 'button', onclick: () => copyText(this.json()) }, 'Copy results'));
    out.append(el('button', { type: 'button', class: 'secondary', onclick: () => download(`${this.data.spike}.json`, this.json()) }, 'Download'));
    out.append(el('button', { type: 'button', class: 'secondary', onclick: () => {
      if (confirm('Clear this spike\'s results on this phone?')) this.reset();
    } }, 'Reset'));
    container.append(out);
  }
}

export function allReports() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('sgr0.report.')) out.push(safeParse(localStorage.getItem(k)));
  }
  return out.filter(Boolean).sort((a, b) => a.spike.localeCompare(b.spike));
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied. Paste it into the chat with Claude.');
  } catch {
    download('results.json', text);
  }
}

export function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
