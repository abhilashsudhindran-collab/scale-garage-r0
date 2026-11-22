// Shared helpers for the R0 spikes. No network calls, no secrets.

export const KIT_VERSION = 'r0-1.0.0';

export const $ = (sel, root = document) => root.querySelector(sel);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const now = () => performance.now();
export const ms = (t0) => Math.round(performance.now() - t0);

export function deviceInfo() {
  const nav = navigator;
  return {
    userAgent: nav.userAgent,
    uaBrands: nav.userAgentData ? nav.userAgentData.brands.map(b => `${b.brand} ${b.version}`) : null,
    mobile: nav.userAgentData ? nav.userAgentData.mobile : null,
    platform: nav.userAgentData ? nav.userAgentData.platform : nav.platform,
    screen: `${screen.width}x${screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    deviceMemoryGB: nav.deviceMemory ?? null,
    cpuCores: nav.hardwareConcurrency ?? null,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    online: nav.onLine,
    secureContext: window.isSecureContext,
    origin: location.origin,
  };
}

export async function sha256Hex(blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function fmtBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

// Decode an image File/Blob to an ImageBitmap, honouring EXIF orientation where supported.
export async function decodeImage(blob) {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    return await createImageBitmap(blob);
  }
}

export function bitmapToCanvas(bitmap, maxSide = Infinity) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bitmap.width * scale);
  c.height = Math.round(bitmap.height * scale);
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  return c;
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), type, quality));
}

export function rotateCanvas(src, quarterTurns) {
  const q = ((quarterTurns % 4) + 4) % 4;
  if (q === 0) return src;
  const c = document.createElement('canvas');
  c.width = q % 2 ? src.height : src.width;
  c.height = q % 2 ? src.width : src.height;
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((q * Math.PI) / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

export function pickFile({ capture = false, multiple = false } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.setAttribute('capture', 'environment');
    if (multiple) input.multiple = true;
    input.addEventListener('change', () => resolve([...input.files]));
    input.click();
  });
}

export async function startRearCamera(videoEl, { width = 1920, height = 1080 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: width }, height: { ideal: height } },
    audio: false,
  });
  videoEl.srcObject = stream;
  videoEl.setAttribute('playsinline', '');
  videoEl.muted = true;
  await videoEl.play();
  return stream;
}

export function stopStream(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const base = new URL('../', import.meta.url);
    navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname }).catch(() => {});
  }
}
