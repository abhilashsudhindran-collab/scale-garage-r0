// Google sign-in (Google Identity Services token model) + minimal Drive/Sheets REST calls.
//
// Security rules for this kit:
// - The OAuth Client ID is typed in on the phone and kept in this browser's
//   localStorage only. It is never written into the repository.
// - Access tokens are held in memory only and disappear when the page closes.
// - Only the `drive.file` scope is requested: the app can see only files it
//   created (or files you explicitly open with it), not the rest of your Drive.

export const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID_KEY = 'sgr0.clientId';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let token = null;          // { access_token, expires_at, scope }
let tokenClient = null;
let pending = null;

export const getClientId = () => localStorage.getItem(CLIENT_ID_KEY) || '';
export const setClientId = (id) => localStorage.setItem(CLIENT_ID_KEY, id.trim());
export const hasToken = () => !!token && Date.now() < token.expires_at - 60_000;
export const tokenInfo = () => token ? {
  expiresInSec: Math.round((token.expires_at - Date.now()) / 1000),
  scope: token.scope,
} : null;

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in script (offline?)'));
    document.head.append(s);
  });
}

// Must be called from a user gesture (tap) the first time, because it may open a popup.
// prompt: '' = only show UI if needed; 'consent' = always show consent screen.
export async function signIn({ prompt = '' } = {}) {
  const clientId = getClientId();
  if (!clientId) throw new Error('No OAuth Client ID set on this phone yet');
  await loadGis();
  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (!pending) return;
        const { resolve, reject } = pending; pending = null;
        if (resp.error) return reject(new Error(`${resp.error}: ${resp.error_description || ''}`));
        token = {
          access_token: resp.access_token,
          expires_at: Date.now() + Number(resp.expires_in) * 1000,
          scope: resp.scope,
        };
        resolve(tokenInfo());
      },
      error_callback: (err) => {
        if (!pending) return;
        const { reject } = pending; pending = null;
        reject(new Error(`Sign-in window problem: ${err.type || JSON.stringify(err)}`));
      },
    });
  }
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    tokenClient.requestAccessToken({ prompt });
  });
}

export function signOut() {
  if (token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(token.access_token, () => {});
  token = null;
}

async function api(url, { method = 'GET', headers = {}, body, raw = false } = {}) {
  if (!hasToken()) throw new Error('Not signed in (or token expired) — tap Sign in');
  const res = await fetch(url, {
    method, body,
    headers: { Authorization: `Bearer ${token.access_token}`, ...headers },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    const err = new Error(`HTTP ${res.status} ${method} ${url.split('?')[0]} — ${detail.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  if (raw) return res;
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const json = (o) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

// ---------- Drive ----------
export const drive = {
  createFolder: (name, parentId) => api(`${DRIVE}/files?fields=id,name`, {
    method: 'POST', ...json({ name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) }),
  }),

  get: (id, fields = 'id,name,parents,size,md5Checksum,appProperties,trashed') =>
    api(`${DRIVE}/files/${id}?fields=${encodeURIComponent(fields)}`),

  list: (q, fields = 'files(id,name,size,md5Checksum,appProperties,createdTime)') =>
    api(`${DRIVE}/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100&spaces=drive`),

  move: (id, addParent, removeParents) =>
    api(`${DRIVE}/files/${id}?addParents=${addParent}&removeParents=${removeParents}&fields=id,parents`, { method: 'PATCH', ...json({}) }),

  trash: (id) => api(`${DRIVE}/files/${id}?fields=id,trashed`, { method: 'PATCH', ...json({ trashed: true }) }),

  // Multipart upload: metadata + binary in one request.
  upload: async (blob, { name, parents, appProperties, mimeType }) => {
    const boundary = 'sgr0' + Math.random().toString(16).slice(2);
    const meta = { name, ...(parents ? { parents } : {}), ...(appProperties ? { appProperties } : {}) };
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify(meta),
      `\r\n--${boundary}\r\nContent-Type: ${mimeType || blob.type || 'application/octet-stream'}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ]);
    return api(`${UPLOAD}/files?uploadType=multipart&fields=id,name,size,md5Checksum,appProperties`, {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    });
  },

  // Storage quota of the signed-in account (tests whether drive.file scope can read it).
  about: () => api(`${DRIVE}/about?fields=storageQuota`),

  download: async (id) => (await api(`${DRIVE}/files/${id}?alt=media`, { raw: true })).blob(),
};

// ---------- Sheets ----------
const enc = (range) => encodeURIComponent(range);
export const sheets = {
  create: (title, tabTitles) => api(`${SHEETS}?fields=spreadsheetId,spreadsheetUrl,sheets.properties`, {
    method: 'POST', ...json({ properties: { title }, sheets: tabTitles.map(t => ({ properties: { title: t } })) }),
  }),
  addTab: (id, title) => api(`${SHEETS}/${id}:batchUpdate`, {
    method: 'POST', ...json({ requests: [{ addSheet: { properties: { title } } }] }),
  }),
  // RAW = values are stored exactly as sent (no number/date/formula parsing).
  write: (id, range, values) => api(`${SHEETS}/${id}/values/${enc(range)}?valueInputOption=RAW`, {
    method: 'PUT', ...json({ range, majorDimension: 'ROWS', values }),
  }),
  append: (id, range, values) => api(`${SHEETS}/${id}/values/${enc(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST', ...json({ majorDimension: 'ROWS', values }),
  }),
  read: (id, range, render = 'UNFORMATTED_VALUE') =>
    api(`${SHEETS}/${id}/values/${enc(range)}?valueRenderOption=${render}`),
};