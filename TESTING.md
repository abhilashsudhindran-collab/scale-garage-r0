# R0 test protocol — run on your Android phone

**Golden rule:** a test only counts as **PASS** if you ran it **on the target phone** and saw it work. Leave anything you didn't try as **Not tested**.

## Before you start

- Phone: your everyday **Android phone**, **Chrome** browser, up to date.
- Gather **5 different real model boxes**. Mix them up if you can:
  1. A box with a clear printed **product code** (e.g. Mini GT, Tarmac, Kyosho)
  2. A box with **small text** on an end label
  3. A **glossy / reflective** box or blister pack
  4. A box with a **barcode** (most have one on the back or bottom)
  5. A **model underside** with moulded or printed text
- A plain, **contrasting surface** (dark table for light boxes, or the reverse).
- Good, even light. Avoid strong reflections.

For each spike, open it from the kit's home page, do the steps, then **mark each check PASS / FAIL / Not tested** in the "Your verdict" panel and add a short note.

---

## Spike 1 — Camera (≈5 min)

1. **A.** Tap **Start camera** → allow camera. Check it's the **rear** camera and sharp. Tap **Capture frame**. Try **Torch** if offered.
2. **B.** Tap **Take photo with camera app** → take a photo → confirm it appears with a large resolution (e.g. 4000×3000).
3. **C.** Choose **3 or more** photos from your gallery → all are listed.
4. **D.** Chrome menu ⋮ → **Add to Home screen / Install app**. Open the kit **from the new home-screen icon**, go to Spike 1, repeat **A**.
5. Close and reopen once to see whether Chrome remembers the camera permission.

## Spike 2 — Google sign-in, Sheets & Drive (≈10 min, needs README Part B first)

1. Paste the **Client ID** → **Save on this phone**.
2. **Sign in with Google.** Read the consent screen carefully — note **exactly what it says it wants access to**. Expect an "unverified app / testing" warning; that's normal for a personal test project.
3. **Run Sheets test** → every row should say **MATCH**. Tap the link and look at the sheet in Google Sheets too.
4. **Measure 5 appends** (note whether you're on Wi-Fi or mobile data).
5. **Take photo & upload** → checksum and SHA-256 should both be **MATCH**. Open Google Drive → folder **SGR0_SPIKE_…** → the photo is there.
6. **What can the app see?** → should list **only SGR0 items**.
7. Later (after 5+ minutes, or after reopening): **Refresh token quietly**. Note whether it worked without any popup.
8. Optional: **Move test folder to Bin** when done (after copying results).

## Spike 3 — OCR on 5 boxes (≈15 min)

1. Keep **Compact** model → **Load OCR engine**.
2. For each of your 5 boxes: type the **manufacturer, product code and scale exactly as printed**, choose which part you photographed, then **Take photo & read**.
   - Fill the frame with the label area; hold steady.
   - If text is sideways, tap **Rotate 90° & re-read**.
3. Optional: switch to **Full** model, reload engine, retry the two worst boxes.
4. Judge honestly: would editing the OCR text be faster than typing from scratch?

## Spike 4 — Barcode (≈10 min)

1. Note which engines are available (top box).
2. For 3+ boxes: type the **digits printed under the barcode** and the **product code**, then **Start live scan** and point at the barcode.
3. Try **Take photo & scan** on the same boxes (this tries both engines).
4. Optional: switch the engine to **ZXing** and repeat one live scan.

## Spike 5 — Box edges & straightening (≈15 min)

1. **Load image engine** (≈11 MB the first time — Wi-Fi recommended).
2. **B.** For each of your 5 boxes, photograph the **front at an angle** (not straight on) on the contrasting surface. Check where the corners land.
3. **C.** Drag any wrong corner onto the real box corner → **Straighten**. Try **Rotate** too.
4. **D.** Check the straightened image looks flat and readable, and the **original photo is unchanged** below it.
5. **A.** Try **Start live preview**; hold the phone still over a box. Note whether the outline follows smoothly and whether **auto-capture** fires.

## Spike 6 — Offline capture & safe sync (≈20 min, needs Spike 2 working)

1. **Online first:** open Spike 6 once, tap **Ask Chrome to keep this data safe**, then **Sign in** once so you know it works.
2. Turn on **airplane mode**. Close Chrome completely (swipe it away). Reopen the kit → Spike 6. **Does the page open?**
3. Still offline: queue **3 items** (photo + product code like `00567` + a note).
4. **Restart the phone.** Reopen Spike 6 offline → all 3 items still listed?
5. Turn signal back on → **Sign in** → **Sync now** (or let it auto-sync) → all items **synced**.
6. **Interruption test:** queue 2 more items. Tap **Sync now** and **immediately** switch on airplane mode. Wait 10 s, switch signal back on, **Sync now** again.
7. Tap **Check for duplicates** → expect **0 duplicates, nothing missing**.
8. Open the **SGR0_OFFLINE_SHEET** in Google Sheets → product code `00567` still shows its leading zeros.

---

## Send the results back

Kit home page → **Collect all results** → **Copy all results** → paste into the chat.
Please also mention anything the page **couldn't** capture (e.g. "the consent screen said …", "photo looked blurry").

## What I will produce from your results

For each spike: **what was tested · how · actual result · limitations · PASS/FAIL · cost & quota implications** — then the architecture documents (diagram, schema, dependency register, cost register, security & privacy, roadmap, decision log). Nothing will be marked as passed unless your results show it.
