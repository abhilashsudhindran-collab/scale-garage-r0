# Scale Model Garage — R0 technical spike kit

**This is not the app.** It is six small test pages that prove (or disprove) that the planned architecture works **on your Android phone, with your Google account, at ₹0**.

| # | Spike | Needs Google sign-in? | Needs internet? |
|---|---|---|---|
| 1 | Camera | No | Only to load the page |
| 2 | Google sign-in, Sheets & Drive | **Yes** | Yes |
| 3 | OCR on 5 real boxes | No | Only to load the page (first time) |
| 4 | Barcode | No | Only to load the page |
| 5 | Box edges, corners & straightening | No | Only to load the page (first time) |
| 6 | Offline capture & safe sync | **Yes** (for the sync part) | **No** for capture |

---

## Privacy and security rules (built in)

- **No personal data in this repository.** It contains only code and open-source libraries.
- **No credentials in this repository.** The Google **OAuth Client ID** is typed into the phone and stored in that phone's browser only.
- **Tokens are never saved.** Google access tokens live in memory and vanish when the page closes.
- **Narrowest Google permission.** Only `drive.file` is requested, which means the app can see **only the files it creates** — not the rest of your Drive. Spike 2 checks this.
- **No API keys, no billing, no paid services.** Nothing in this kit can generate a bill.
- **Results stay on the phone** until you press *Copy results* yourself. Results never include the Client ID or tokens.

---

## Part A — Put the kit on GitHub Pages (free)

You need a free GitHub account. **About 10 minutes.**

1. Sign in at **github.com** → top-right **+** → **New repository**.
2. Name: **`scale-garage-r0`** · Visibility: **Public** (required for free Pages) · tick **Add a README** → **Create repository**.
3. In the new repository: **Add file → Upload files**. Unzip the kit on a computer and **drag in everything inside the `scale-garage-r0` folder** (keep the folder structure). Click **Commit changes**.
   - If the browser refuses some folders, upload in two goes: first `vendor/`, then the rest.
4. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
5. Wait 1–3 minutes. The page shows your address, like:
   **`https://YOUR-GITHUB-NAME.github.io/scale-garage-r0/`**
6. Open that address on your phone in **Chrome**. You should see "Scale Model Garage — R0 spikes".

✅ You can already run **Spikes 1, 3, 4 and 5**. Spikes 2 and 6 need Part B.

---

## Part B — Google Cloud project for sign-in (free, **no billing**)

**About 15 minutes, best done on a computer.** Google changes these screens from time to time; if a label differs slightly, look for the nearest match.

> ⚠️ **If Google ever asks you to add a billing account or credit card — stop.** It is not needed for anything in this kit.

1. Go to **console.cloud.google.com** and sign in with the Google account whose Drive you'll use.
2. Project picker (top bar) → **New project** → name **`scale-model-garage`** → **Create**. Make sure it's selected.
3. **APIs & Services → Library** → search and **Enable**:
   - **Google Drive API**
   - **Google Sheets API**
4. Open **Google Auth platform** (search for "OAuth consent" or "Google Auth platform" in the top search bar).
   - **Branding / App information:** App name `Scale Model Garage (test)`, your email as support and developer contact. Leave logo empty.
   - **Audience:** User type **External**. Publishing status stays **Testing**. Under **Test users**, **add your own Gmail address**.
   - **Data access / Scopes:** **Add scope** → tick **`.../auth/drive.file`** only → Save.
5. **Clients** → **Create client** → Application type **Web application** → name `garage-r0-web`.
   - **Authorised JavaScript origins** → **Add URI** → `https://YOUR-GITHUB-NAME.github.io`
     (origin only — **no** `/scale-garage-r0` path, **no** trailing slash).
   - Leave *Authorised redirect URIs* empty → **Create**.
6. Copy the **Client ID** (ends in `.apps.googleusercontent.com`). There is no secret to copy — web apps don't use one.
7. On your phone, open **Spike 2**, paste the Client ID, tap **Save on this phone**.

**Known limitation to watch:** while the project is in **Testing**, Google says test-user authorisations **expire after 7 days**. Spike 2 records whether this affects day-to-day use. Whether to move the project to "In production" is a decision for after R0.

---

## Part C — Run the tests

Follow **`TESTING.md`**. When finished, open **Collect all results** on the kit's home page, tap **Copy all results**, and paste the text back to Claude. The R0 report will be written **only** from those results.

---

## What's inside

```
index.html            home page (links to every spike)
results.html          collects results from all spikes for copy/paste
manifest.webmanifest  lets Chrome install the kit to the home screen
sw.js                 service worker: lets pages open with no signal
common/               shared code (UI, results recorder, Google calls, IndexedDB, MD5)
spikes/1-camera … 6-offline/
vendor/               open-source libraries, served from this site (no outside CDNs)
tests/                local checks run before delivery
```

### Open-source libraries (all free, permissive licences)

| Library | Version | Licence | Used for |
|---|---|---|---|
| Tesseract.js + core | 6.0.1 / 6.1.2 | Apache-2.0 | OCR |
| Tesseract English data | 4.0.0 / 4.0.0_best_int | (Tesseract tessdata, Apache-2.0) via `@tesseract.js-data/eng` MIT | OCR language model |
| OpenCV.js (`@techstark/opencv-js`) | 4.12.0 | Apache-2.0 | Edge detection, perspective correction |
| barcode-detector (ponyfill) | 3.2.4 | MIT | Barcode fallback (ZXing) |
| zxing-wasm | 3.1.7 | MIT | Barcode engine |

Licence files are in each `vendor/` sub-folder.

**Only outside connection:** Google's own sign-in script (`accounts.google.com/gsi/client`) and Google's Drive/Sheets APIs, used only in Spikes 2 and 6 after you sign in.
