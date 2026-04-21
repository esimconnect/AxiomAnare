# AxiomAnare — Session Context File
**Company:** Kairos Ventures Pte Ltd
**Live:** https://esimconnect.github.io/AxiomAnare
**Repo:** https://github.com/esimconnect/AxiomAnare (org: esimconnect)
**Working dir:** `D:\Kairos\AxiomAnare\axiomanare\AxiomAnare` (drive letter may vary D: or E:)
**Git:** `cd /d/Kairos/AxiomAnare/axiomanare/AxiomAnare` then standard git add/commit/push
**Stable tag:** `v1.0-stable` — commit `4ef5762`

---

## WHAT AXIOMANARE DOES
Single and multi-channel vibration diagnostic engine. User uploads a vibration data file (CSV, XLSX, JSON, MAT), selects machine class, enters nameplate RPM and bearing model. The engine runs a 6-stage diagnostic pipeline: Ingest → Baseline Comparison → Trend Assessment → ISO Zone → Fault Classification → RUL. Output is a full diagnostic report with fault indicators, health index, trend chart, and Claude AI recommendations — all ISO 13373/13379/13381/10816 referenced.

---

## CURRENT STATE (stable v1.0 — commit 4ef5762)
- CWRU benchmark: 4/5 (97_Normal ✓, 105_IR ✓, 118_Ball ✗, 130_OR ✓, 234_OR ✓)
- Single + multi-channel diagnostic pipeline ✅
- Multi-channel tab selector — All / per-channel tabs filter Radar + FFT simultaneously ✅
- Radar — small severity-coded dots (red/orange/amber/blue by tier), no white border clutter ✅
- AI streaming — single-channel (app.js) + multi-channel (multiChannel.js) both working ✅
- Freemium gate — 5 free analyses, watermark on results, PDF locked, nav badge counting down ✅
- Fleet dashboard at /fleet.html — Supabase auth, RLS, asset-first upload ✅
- Landing page at /landing.html ✅
- Cloudflare Worker proxy: restless-tree-eac8.kairosventure-io.workers.dev (Kairos account: kairosventure.io@gmail.com) ✅
- Supabase baseline engine: assets, baselines, nvr_records, fault_signatures, bearing_library (32 bearings) ✅
- Keep-alive ping: every 4 days prevents Supabase free tier pause ✅

---

## SUPABASE
- URL: `https://zjfhxutcvjxootoekade.supabase.co`
- Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZmh4dXRjdmp4b290b2VrYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjgzODAsImV4cCI6MjA5MDcwNDM4MH0.5yGgSjALJhTQm5Ud3W-fU2Bgo-3PkziaS0oLrGMYQ9o`
- Tables: assets, baselines, nvr_records, fault_signatures, bearing_library

---

## FREEMIUM MODEL (locked)

| Feature | Free | Professional |
|---|---|---|
| Single analysis (full incl. AI) | 5 runs, watermarked | Unlimited, clean |
| PDF export | ❌ locked | ✅ |
| Fleet dashboard | ❌ locked | ✅ |
| Baseline tracking | ❌ locked | ✅ |
| Trend history | ❌ locked | ✅ |

---

## CLOUDFLARE WORKER — restless-tree-eac8
- Account: kairosventure.io@gmail.com
- URL: `restless-tree-eac8.kairosventure-io.workers.dev`
- Routes: `/v1/messages` → Anthropic API proxy (streaming)
- Routes: `/embed` → Voyage AI embeddings
- Routes: `/rag` → Supabase vector search (match_knowledge_chunks)
- Secrets bound: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `VOYAGE_API_KEY`

---

## COMMIT LOG (latest first)
- `4ef5762` — fix: radar/FFT resize loop, tripled AI report, remove scroll-on-stream ← **v1.0-stable**
- `7258d21` — fix: MC AI missing /v1/messages path
- `03e9ced` — fix: remove CSS scaling from radar (infinite resize loop)
- `82ff943` — ui: radar+FFT tab selector per channel, side-by-side layout
- `3606afd` — ui: radar small severity-coded dots
- `ea0a5a5` — fix: orphan JS fragment in index.html badge block
- `bb9a0b7` — fix: freemium counter wired to multi-channel pipeline
- `580b5c3` — feat: freemium gate — 5-run limit, watermark, PDF locked

---

## NEXT SESSION CANDIDATES
1. Commercial model / pricing page on landing.html
2. Baseline prompt after first clean analysis ("Set as baseline?")
3. RLS re-hardening on Supabase (currently open)
4. 118_Ball CWRU fix — get to 5/5 benchmark
5. Fleet dashboard polish
