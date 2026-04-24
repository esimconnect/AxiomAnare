# AxiomAnare — Living Project Context
Last updated: April 2026
Latest commit: 76f681a

---

## Repository
- Repo: https://github.com/esimconnect/AxiomAnare
- Live: https://esimconnect.github.io/AxiomAnare
- Local: D:\Kairos\AxiomAnare\axiomanare\AxiomAnare (drive letter may vary D: or E:)
- Branch: main

## Supabase
- URL: https://zjfhxutcvjxootoekade.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZmh4dXRjdmp4b290b2VrYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjgzODAsImV4cCI6MjA5MDcwNDM4MH0.5yGgSjALJhTQm5Ud3W-fU2Bgo-3PkziaS0oLrGMYQ9o
- Existing tables: organisations, assets, nvr_records
- New tables (created this sprint): profiles, asset_twins, case_library,
  knowledge_chunks, usage_log, subscription_events
- RLS: hardened and tested on all tables (organisations still UNRESTRICTED — pending)
- pgvector: confirmed already enabled

---

## Completed Work
- [x] Single-channel diagnostic pipeline
- [x] Multi-channel diagnostic pipeline
- [x] PDF export
- [x] Fleet Dashboard (auth, RLS, baseline + batch upload)
- [x] Fleet detail panel
- [x] Agnostic file parser (CSV, MAT, XLSX, JSON, TSV)
- [x] Nav: Free to Try, Subscribe, Login, Fleet Dashboard buttons
- [x] Hero subtitle single line
- [x] Register renamed to Subscribe
- [x] Nav height and logo sizing finalised
- [x] Animated canvas logo in nav (replaces static SVG) — gears + green wave
- [x] Responsive layout — tablet (≤900px) + mobile (≤600px)
- [x] ML label maps: cwru_label_map.json, nasa_ims_label_map.json, epson_label_map.json
- [x] CWRU .mat dataset download — 109 files, 0 failed (drive_end + fan_end + normal)
- [x] KB/Standards: ISO_10816_Chart_colour.pdf
- [x] KB/Reports: Cooling_Tower_Fan-K394-11.pdf + Reports 001–006 (anonymised)
- [x] KB/Reports: Reports 007–009 (anonymised .md, Apr 2023 quarter)
- [x] KB/Reports: CM_SiteA_AHU, CM_SiteA_UTY, CM_SiteA_WWTP,
      CM_SiteB_AHU, CM_SiteB_UTY, CM_SiteB_MFG, CM_SiteB_TankFarm, CM_SiteC_AHU
- [x] KB/Reference: Nagahama_2025_Phase_Fault_Diagnosis.pdf
- [x] KB/Reference: CWRU Bearing Data Centre README.pdf
- [x] KB/Reference: CWRU_Dataset_Overview.md (dataset structure + AxiomAnare validation)
- [x] KB/Reference: VCAT_Reference_Material.md (fault spectra, ISO zones, FFT formulas, transducer guide)
- [x] KB/Manuals: SKF_Bearing_Installation_Guide.md (symptom/cause matrix, damage modes, lubrication, fits)
- [x] KB/Manuals: SKF_Bearing_Maintenance_Handbook.md (failure statistics, vibration monitoring, inspection, RCA)
- [x] NASA IMS 1st_test (2,156 files) + 2nd_test (984 files)
- [x] Field data: Epson trimmed (96 files)
- [x] Supabase schema — all new tables + nvr_records updates
- [x] auth.js shared module — signUp, signIn, signOut, getSession, getTier,
      getProfile, incrementAnalysesUsed, tierAnalysisLimit
- [x] Auth + Subscribe modal — Login tab + Subscribe tab with tier cards
- [x] Nav wired — nav-login-btn, nav-subscribe-btn, nav-user-btn (sign out)
- [x] RAG pipeline — Cloudflare Worker /embed + /rag routes
- [x] app.js — ragQuery(), buildRagContext(), streamClaude() with KB injection
- [x] Supabase match_knowledge_chunks — SECURITY DEFINER, pgvector tested
- [x] Total KB: 109 chunks embedded (voyage-3)
- [x] Stripe Checkout integration — Worker /create-checkout-session route
- [x] Stripe webhook — Worker /stripe-webhook route (HMAC-SHA256, no external lib)
      - checkout.session.completed → profiles.tier update + subscription_events insert
      - customer.subscription.deleted → downgrade tier to free
- [x] auth.js — _doSignup() redirects to Stripe after account creation
- [x] auth.js — _handlePaymentReturn() handles ?payment=success/cancelled
- [x] auth.js — _showPaymentToast() green success banner, auto-dismisses 6s
- [x] Landing page (landing.html) — copy fixed (5 analyses, no prices)
- [x] Baseline prompt toast — Zone A/B post-analysis
- [x] DC detrend + linear detrend on raw signal (ISO 13373-2:2016 §7.2)
- [x] Spectral velocity RMS via Parseval integration (ISO 10816-3 §4.2)
- [x] BSF 4-path detection — race band + roll + rollHigh + direct FFT
- [x] CWRU benchmark 5/5 confirmed on .mat files
- [x] FREE_ANALYSIS_LIMIT = 5 (confirmed in app.js — CONTEXT was stale at 2)
- [x] Tier gating — index.html (Freemium.syncTier() wired to Auth.getTier())

## In Progress
- [ ] Tier gating — fleet.html (same syncTier pattern, pending)

## Pending (pre-go-live, before Stripe is live)
- [ ] Supabase: ADD COLUMN stripe_customer_id + stripe_subscription_id to profiles
- [ ] Cloudflare Worker: add 5 secrets (see Payments section below)
- [ ] Stripe Dashboard: create products + prices, register webhook endpoint
- [ ] Test full Stripe flow with sk_test_ keys + card 4242 4242 4242 4242
- [ ] Verify auth.js Auth.getTier() returns tier string matching isPro() check
      (must return 'pro' / 'fleet_starter' / 'fleet_pro' / 'free' / null)

## Not Started
- [ ] Digital twin Phase 1
- [ ] ML feature extraction (CWRU/NASA)
- [ ] Case library population
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Annual pricing / discount logic
- [ ] PayPal integration (deferred — after Stripe is live)
- [ ] Supabase Storage buckets (ml-raw-signals, knowledge-base)
- [ ] NASA IMS 3rd_test — ZIP corrupt on extraction, Kaggle needed, deferred indefinitely
- [ ] KB/Reports: Q1, Q3, Q4 2023 quarterly reports (1 month per quarter, pending upload)
- [ ] KB/Manuals: CAT 1 manual (pending)
- [ ] CWRU 48 kHz drive end files (early-stage fault detection, deferred)
- [ ] RLS re-hardening — organisations table currently UNRESTRICTED
- [ ] 6205-2RS bearing → add to Supabase bearing_library

---

## Tier Structure
| Tier          | Price      | Analyses  | Assets | AI Report | Fleet |
|---------------|------------|-----------|--------|-----------|-------|
| Free          | $0         | 5         | —      | ✗         | ✗     |
| Pro           | TBD        | Unlimited | —      | ✓         | ✗     |
| Fleet Starter | TBD        | Unlimited | 10     | ✓         | ✓     |
| Fleet Pro     | TBD        | Unlimited | 30     | ✓         | ✓     |
| Asset add-on  | TBD        | —         | +1     | ✓         | ✓     |

- No upload caps on any paid tier
- Annual: 2 months free (pay 10, get 12)
- AI report is the primary freemium gate
- Pricing philosophy: below expense claim threshold —
  engineer pays own card, no PO or finance approval needed
- Prices deferred — Stripe products to be created without prices for now

---

## Payments
- Stripe: primary (account exists, keys TBC)
- PayPal: secondary (deferred — after Stripe live)
- Currency: USD primary, local currency via Stripe/PayPal auto
- Billing: monthly auto-renew, cancel anytime
- Stripe Price IDs: to be created in Stripe Dashboard (prices TBD)
- Products to create in Stripe (no prices yet):
    1. AxiomAnare Pro
    2. AxiomAnare Fleet Starter
    3. AxiomAnare Fleet Pro
    4. Asset Add-on

### Cloudflare Worker secrets required (add via Worker → Settings → Variables → Secrets)
| Secret name               | Value                                      |
|---------------------------|--------------------------------------------|
| STRIPE_SECRET_KEY         | sk_live_… (or sk_test_… for testing)       |
| STRIPE_WEBHOOK_SECRET     | whsec_… from Stripe Dashboard              |
| STRIPE_PRICE_PRO          | price_… (Pro monthly price ID)             |
| STRIPE_PRICE_FLEET_STARTER| price_… (Fleet Starter monthly price ID)   |
| STRIPE_PRICE_FLEET_PRO    | price_… (Fleet Pro monthly price ID)       |

### Stripe webhook endpoint
- URL: https://restless-tree-eac8.kairosventure-io.workers.dev/stripe-webhook
- Events: checkout.session.completed, customer.subscription.deleted

### Supabase profiles columns required (not yet run)
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text;
```

---

## Current State (stable — commit 76f681a)
- CWRU benchmark: 5/5 (97_Normal ✓, 105_IR ✓, 118_Ball ✓, 130_OR ✓, 234_OR ✓)
- Single + multi-channel diagnostic pipeline ✅
- Multi-channel tab selector — All / per-channel tabs filter Radar + FFT simultaneously ✅
- Radar — small severity-coded dots (red/orange/amber/blue by tier), no white border clutter ✅
- AI streaming — single-channel (app.js) + multi-channel (multiChannel.js) both working ✅
- Freemium gate — 5 free analyses, watermark on results, PDF locked, nav badge counting down ✅
- Freemium.syncTier() — reads Supabase profiles.tier via Auth.getTier(), caches to localStorage ✅
- Fleet dashboard at /fleet.html — Supabase auth, RLS, asset-first upload ✅
- Landing page at /landing.html ✅
- Cloudflare Worker proxy: restless-tree-eac8.kairosventure-io.workers.dev ✅
- Supabase baseline engine: assets, baselines, nvr_records, fault_signatures, bearing_library ✅
- Keep-alive ping: every 4 days prevents Supabase free tier pause ✅

---

## Freemium Gate — Implementation Detail
```
FREE_ANALYSIS_LIMIT = 5  (app.js line 6)

Freemium.isPro()
  → reads localStorage.ax_tier (written by syncTier())
  → any value other than 'free' returns true
  → falls back to ax_pro flag (legacy) if ax_tier absent

Freemium.syncTier()  [async]
  → called 200ms after auth.js loads (index.html inline script)
  → calls window.Auth.getTier() → Supabase profiles.tier
  → writes ax_tier to localStorage
  → refreshes nav badge
  → if paid: removes watermark, trial banner, upgrade modal, PDF lock
  → non-blocking — failure logged to console only

Auth.getTier() must return:
  'pro' | 'fleet_starter' | 'fleet_pro' | 'free' | null
```

---

## Planned Supabase Schema

### New Tables Needed
```sql
profiles              -- tier, org_id, linked to auth.users
asset_twins           -- digital twin state per asset
case_library          -- confirmed fault cases for ML training
knowledge_chunks      -- RAG text chunks + pgvector embeddings
usage_log             -- anonymised analysis events for ML
subscription_events   -- Stripe/PayPal webhook audit trail
```

### Updates To Existing Tables
```sql
-- nvr_records: add these columns
feature_vector    jsonb     -- full computed signal features
user_confirmed    boolean   -- engineer confirmed diagnosis?
confirmed_fault   text      -- actual fault if corrected
twin_deviation    float     -- delta from digital twin expected
```

---

## ML + Knowledge Base Strategy

### Data Sources
| Source                  | Type | Fault Coverage                 | Status      |
|-------------------------|------|--------------------------------|-------------|
| CWRU dataset            | MAT  | BPFO, BPFI, BSF                | ✓ Complete  |
| NASA IMS 1st_test       | MAT  | RUL / run-to-failure           | ✓ Complete  |
| NASA IMS 2nd_test       | MAT  | RUL / run-to-failure           | ✓ Complete  |
| NASA IMS 3rd_test       | MAT  | RUL / run-to-failure           | ✗ Deferred  |
| Epson field data        | CSV  | Mixed field faults             | ✓ Complete  |
| K394-11 field report    | PDF  | Imbalance (confirmed)          | ✓ Uploaded  |
| Reports 001–006         | PDF  | Anonymised field cases         | ✓ Uploaded  |
| Reports 007–009         | MD   | Pharma plant, Apr 2023         | ✓ Complete  |
| CM Site summaries (8)   | MD   | AHU/UTY/MFG/TankFarm/WWTP      | ✓ Complete  |
| ISO 10816 CMVA guide    | PDF  | Zone thresholds                | ✓ Uploaded  |
| Nagahama 2025           | PDF  | Phase fault diagnosis          | ✓ Uploaded  |
| CWRU README             | PDF  | Bearing dataset ref            | ✓ Uploaded  |
| CWRU_Dataset_Overview   | MD   | Dataset structure + validation | ✓ Complete  |
| VCAT_Reference_Material | MD   | Fault spectra, ISO zones, FFT  | ✓ Complete  |
| SKF_Bearing_Install     | MD   | Symptom/cause, damage modes    | ✓ Complete  |
| SKF_Bearing_Handbook    | MD   | Failure stats, inspection, RCA | ✓ Complete  |
| Reports Q1/Q3/Q4        | MD   | Pharma plant, 2023             | Pending     |
| CAT 1 manual            | PDF  | All fault types                | Pending     |

### KB Reports — Content Summary
| Report | Assets | Key Faults |
|--------|--------|------------|
| 001–006 | Various | Mixed field cases |
| 007 | 24 AHUs — pharma plant | Misalignment/beat (Danger), bearing fault freq (Alert), unbalance/misalignment (Warning) |
| 008 | 15 Tank Farm units — pharma plant | Early bearing fault (demod elevated, velocity normal) — chilled water pump + scrubber blower |
| 009 | 2 Booster pumps — pharma plant | Clean baseline — healthy motor-pump reference readings |

### KB Reference Documents — Content Summary
| Document | Key Content |
|----------|------------|
| VCAT_Reference_Material.md | FFT formulas, unit conversions, ISO 20816-3 zone values, transducer guide, fault pattern spectra library (imbalance/misalignment/looseness/gears/electrical/bearing stages), trial weight formula |
| SKF_Bearing_Installation_Guide.md | Symptom-to-cause matrix (heat/noise/vibration/torque), pre-operational and operational damage modes mapped to vibration signatures, lubrication guidelines, fit impact on vibration |
| SKF_Bearing_Maintenance_Handbook.md | Failure statistics (1/3 fatigue, 1/3 lubrication, 1/6 contamination), vibration monitoring principles, frequency ranges, detection sensitivity (velocity vs envelope), inspection procedure, root cause matrix, diagnostic decision tree |
| CWRU_Dataset_Overview.md | Dataset structure, file contents, naming convention, fault taxonomy, FAIR assessment, AxiomAnare validation table |

### KB Report Anonymisation Rules
| Original | Replace with |
|----------|-------------|
| Client name | [CLIENT] |
| Plant/site name | [SITE-A/B/C] |
| Site address | [SITE ADDRESS] |
| Client contact name | [CLIENT CONTACT] |
| Service provider name | [SERVICE PROVIDER] |
| Report reference number | [REPORT-REF] |
| Asset tag numbers | Keep (diagnostically relevant) |
| Process area descriptions | Keep (diagnostically relevant) |

### Report Upload Strategy
- Q2 2023 complete (Reports 007–009)
- Upload 1 month per quarter for Q1, Q3, Q4 2023
- Total target: ~12 anonymised report files in KB/Reports
- Reports saved as .md (RAG-ready) not .docx

### CWRU Dataset — Folder Structure (complete)
```
Data_Sets/cwru/
├── normal/
│   └── normal_0hp.mat  normal_1hp.mat  normal_2hp.mat  normal_3hp.mat
├── drive_end/
│   ├── IR007_0.mat … IR028_3.mat   (inner race, all sizes + loads)
│   ├── B007_0.mat  … B028_3.mat   (ball, all sizes + loads)
│   └── OR007@6_0.mat … OR021@12_3.mat  (outer race, 3 positions)
└── fan_end/
    ├── IR007_0.mat … IR021_3.mat
    ├── B007_0.mat  … B021_3.mat
    └── OR007@6_0.mat … OR021@3_3.mat
```

### CWRU Label Map — Key Facts
- File: ML/Labels/cwru_label_map.json
- Filenames in download match label map exactly (no ID translation needed)
- Fault taxonomy: inner_race→BPFI, ball→BSF, outer_race→BPFO
- Bearing specs + fault frequencies at all 4 RPM points included
- OR position note: @6:00 is primary training set, @3:00 and @12:00 are augmentation

### RAG Pipeline (live)
```
PDF/MD → chunk text → embed via Voyage AI (voyage-3, 1024-dim)
→ store in knowledge_chunks (pgvector, Supabase)
→ at analysis time: build semantic query from NVR context
→ Cloudflare Worker /embed → /rag → top-5 chunks (0.30 similarity floor)
→ inject into Claude system prompt as === KNOWLEDGE BASE CONTEXT ===
→ Claude narrative grounded in domain knowledge
```

### Cloudflare Worker Routes (axiomanare-proxy.js)
- POST /v1/messages              — proxies Claude API (ANTHROPIC_API_KEY)
- POST /embed                    — proxies Voyage AI embeddings (VOYAGE_API_KEY)
- POST /rag                      — proxies Supabase match_knowledge_chunks RPC (SUPABASE_SERVICE_KEY)
- POST /create-checkout-session  — creates Stripe Checkout Session (STRIPE_SECRET_KEY + STRIPE_PRICE_*)
- POST /stripe-webhook           — Stripe event receiver (STRIPE_WEBHOOK_SECRET)
- Worker version: 1ffa12d1-6960-4c3b-8a78-8c49e17c7437 (redeploy needed after adding Stripe secrets)

### ML Pipeline (planned)
1. Supabase Storage buckets setup
2. Bulk upload CWRU/NASA MAT files via script
3. Feature extraction script → ml_features table
4. Label features by fault type
5. Train classifier (target: 12 months post-launch)

### Supabase Storage Structure (planned)
```
ml-raw-signals/          (private bucket)
├── cwru/
│   ├── normal/
│   ├── drive_end/
│   └── fan_end/
└── nasa/
    ├── 1st_test/
    └── 2nd_test/

knowledge-base/          (private bucket)
├── manuals/
├── reports/
└── standards/
```

---

## Key Decisions Log
| Date     | Decision                                        | Rationale                            |
|----------|-------------------------------------------------|--------------------------------------|
| Apr 2026 | Stripe primary, PayPal secondary                | Existing account, best docs          |
| Apr 2026 | PayPal deferred until Stripe is live            | Reduce scope, ship faster            |
| Apr 2026 | No upload caps on paid tiers                    | Reduce friction, gate on assets only |
| Apr 2026 | Pricing deferred — products created without price | Not finalised yet                  |
| Apr 2026 | pgvector in Supabase (not separate vector DB)   | Single platform, already running     |
| Apr 2026 | Claude Project + Supabase RAG (both)            | Dev workflow vs runtime production   |
| Apr 2026 | CONTEXT.md as cross-chat bridge                 | Projects don't share chat history    |
| Apr 2026 | Digital twin Phase 1 for Fleet on launch        | Justifies Fleet price point          |
| Apr 2026 | ML pipeline: collect now, train at 12 months    | Need labelled data volume first      |
| Apr 2026 | Site visit still required (not replaced)        | AI drafts report, engineer signs off |
| Apr 2026 | Launch full product (not phased feature launch) | Architecture ready, all layers in    |
| Apr 2026 | CWRU filenames = descriptive not numeric IDs    | Matches label map, no translation needed |
| Apr 2026 | CWRU folder structure: drive_end / fan_end flat | Matches label map local_folder paths |
| Apr 2026 | NASA IMS 3rd_test deferred indefinitely         | ZIP corrupt, no Kaggle account       |
| Apr 2026 | KB reports: 1 per quarter not all 12 months     | Diminishing returns beyond 4 reports |
| Apr 2026 | KB reports anonymised as .md not .docx          | RAG-ready, no binary parsing needed  |
| Apr 2026 | Kaggle CWRU mirror — skipped                    | Repackaged data we already have      |
| Apr 2026 | CWRU 48 kHz files deferred                      | 12 kHz sufficient for current pipeline |
| Apr 2026 | Scale-Fractal DFA paper excluded                | Too academic, wrong asset scope      |
| Apr 2026 | SKF guides included in KB/Manuals               | Symptom/cause/damage directly relevant to CM |
| Apr 2026 | VCAT included in KB/Reference                   | Fault spectra library + ISO zones + FFT formulas |
| Apr 2026 | auth.js as IIFE, window.Auth public API         | Matches window.Freemium pattern in app.js |
| Apr 2026 | Modal built dynamically in auth.js, not in HTML | Self-contained; works on fleet.html too |
| Apr 2026 | Signup creates Supabase account then → Stripe   | Clean separation: auth vs payment    |
| Apr 2026 | Stripe client_reference_id = Supabase user UUID | Links payment back to profile in webhook |
| Apr 2026 | Webhook HMAC-SHA256 via SubtleCrypto            | No external lib needed in CF Worker  |
| Apr 2026 | ?payment=success/cancelled param on return URL  | Simple, no session storage needed    |
| Apr 2026 | Default tier selection = Pro in Subscribe modal | Lowest-friction primary conversion target |
| Apr 2026 | Animated canvas logo replacing static SVG       | More compelling, technically on-brand |
| Apr 2026 | Logo animation: window.addEventListener('load') | Ensures canvas ready before rAF starts |
| Apr 2026 | Responsive breakpoints: 900px tablet, 600px mobile | Covers iPad + phone without over-engineering |
| Apr 2026 | Fleet Dashboard link hidden on mobile           | Too wide; accessible via desktop     |
| Apr 2026 | FREE_ANALYSIS_LIMIT = 5                         | Changed from 2; confirmed in app.js  |
| Apr 2026 | Freemium.isPro() reads ax_tier (not ax_pro)     | ax_tier written by syncTier() from Supabase |
| Apr 2026 | syncTier() called 200ms after auth.js loads     | Allows Supabase session restore before tier read |
| Apr 2026 | ax_pro flag retained as legacy fallback         | Existing sessions not broken         |

---

## Build Sequence
```
PHASE 1 — Foundation (build now)
├── Supabase schema (all new tables + nvr_records updates)  ✓ DONE
├── auth.js shared module (login, signup, getTier)          ✓ DONE
├── Auth + Subscribe modal on index.html                    ✓ DONE
├── RAG pipeline (Cloudflare Worker + pgvector)             ✓ DONE
├── Animated logo + responsive layout                       ✓ DONE
├── Stripe integration                                      ✓ DONE (PayPal deferred)
├── Tier gating — index.html                                ✓ DONE
├── Tier gating — fleet.html                                ← NEXT
└── Landing page                                            ✓ DONE (copy only)

PHASE 2 — Intelligence (pre-launch)
├── Digital twin Phase 1 (Fleet — baseline + deviation)
├── Supabase Storage buckets setup
├── PDF chunking + RAG pipeline (already live for MD)
└── CWRU/NASA feature extraction

PHASE 3 — Growth (post-launch, 1-6 months)
├── Confirmed diagnosis feedback loop
├── Email notifications (anomaly alerts, readings due)
├── Statistical anomaly detection across dataset
├── PayPal integration
└── Fleet Pro tier unlock

PHASE 4 — ML (12-24 months)
├── ML classifier (enough labelled data by now)
├── Full digital twin with degradation curve
├── API access for Fleet Pro
└── White-label option
```

---

## Files In This Project
| File                       | Purpose                                          |
|----------------------------|--------------------------------------------------|
| CONTEXT.md                 | This file — update after every chat              |
| index.html                 | Main diagnostic app                              |
| app.js                     | Diagnostic engine, Freemium object               |
| auth.js                    | Shared auth module — Auth object                 |
| fleet.html                 | Fleet dashboard                                  |
| landing.html               | Landing page                                     |
| agnosticParser2.js         | Agnostic file parser                             |
| multiChannel.js            | Multi-channel analysis                           |
| agnosticParser.css         | Parser styles                                    |
| axiomanare-proxy.js        | Cloudflare Worker — Claude + embed + RAG + Stripe|
| ISO_10816_Chart_colour.pdf | ISO zone reference + CMVA interpretation         |
| Balancing_Report_K394.pdf  | Confirmed imbalance case study (K394-11)         |

---

## Data Folder Structure (local)
```
D:\Kairos\AxiomAnare\axiomanare\AxiomAnare\
├── ML\
│   └── Labels\
│       ├── cwru_label_map.json       ✓
│       ├── nasa_ims_label_map.json   ✓
│       └── epson_label_map.json      ✓
├── KB\
│   ├── Standards\   ISO_10816_Chart_colour.pdf                    ✓
│   ├── Reports\     K394-11 + Reports 001–009
│   │                + CM_SiteA/B/C (8 files)                      ✓
│   ├── Reference\   Nagahama_2025 + CWRU README
│   │                + CWRU_Dataset_Overview.md                    ✓
│   │                + VCAT_Reference_Material.md                  ✓
│   │                (Vibration_Basic.pdf — local only,
│   │                 do not commit — copyright Mobius 2005)
│   └── Manuals\     SKF_Bearing_Installation_Guide.md             ✓
│                    SKF_Bearing_Maintenance_Handbook.md           ✓
│                    (CAT 1 manual pending)
└── Data_Sets\
    ├── cwru\        109 .mat files across 3 subfolders            ✓
    ├── nasa_ims\    1st_test (2156) + 2nd_test (984)              ✓
    │                3rd_test deferred
    └── field\
        └── epson\trimmed\  96 files                               ✓
```

---

## How To Use This Project

### Rules
1. Always read CONTEXT.md first before writing any code
2. Open a new chat per work stream (see naming below)
3. Update CONTEXT.md at the end of each chat session
4. Re-upload updated CONTEXT.md to Project Knowledge
5. Commit CONTEXT.md to repo after each session

### Chat Naming Convention
- "Schema — profiles + twins + case_library"
- "Auth — shared auth.js module"
- "Payments — Stripe + PayPal integration"
- "Gating — tier logic index + fleet"
- "Landing — landing page build"
- "ML — feature extraction CWRU/NASA"
- "RAG — knowledge base pipeline"
- "Twin — digital twin Phase 1"
- "UI — [specific component name]"
- "Data — KB field reports [quarter]"

### Session Handoff Template
At the end of each chat, note:
```
Completed this session: [what was done]
Files changed: [list of files]
Latest commit: [hash]
Next session should: [what comes next]
```
Then update this file and re-upload to Project Knowledge.

---

## Session Log — 13 Apr 2026 (Data — KB + ML population)
```
Completed this session:
  - CWRU .mat dataset downloaded — 109 files, 0 failed
  - Confirmed cwru_label_map.json matches download filenames exactly
  - Confirmed folder structure: Data_Sets/cwru/normal + drive_end + fan_end
  - NASA IMS 3rd_test deferred — ZIP corrupt, no Kaggle account
  - CWRU README.pdf placed in KB/Reference
  - Field reports anonymised and saved as .md:
      Report_007: 24 AHUs, pharma plant, Apr 2023
      Report_008: 15 Tank Farm assets, pharma plant, Apr 2023
      Report_009: 2 Booster pumps, pharma plant, Apr 2023
  - Decision: 1 report per quarter for Q1, Q3, Q4 2023 (pending)

Files changed:
  - KB/Reports/Report_007.md
  - KB/Reports/Report_008.md
  - KB/Reports/Report_009.md
  - CONTEXT.md

Latest commit: 20ca27f
```

## Session Log — 13 Apr 2026 (Schema — profiles + twins + case_library)
```
Completed this session:
  - Full Supabase schema migration run successfully
  - New tables: profiles, asset_twins, case_library, knowledge_chunks,
    usage_log, subscription_events
  - Enum types: tier_name, subscription_status, fault_class, iso_zone
  - Triggers: handle_new_user (auto-profile on signup), handle_updated_at
  - Functions: get_user_tier, get_asset_allowance, increment_analyses_used
  - RLS enabled on all new tables
  - nvr_records updated: feature_vector, user_confirmed, confirmed_fault, twin_deviation
  - pgvector confirmed already enabled
  - Note: organisations table flagged UNRESTRICTED — RLS to be addressed later

Files changed:
  - schema.sql (run in Supabase — not committed, utility script)
  - CONTEXT.md

Latest commit: 20ca27f
```

## Session Log — 13 Apr 2026 (Auth — modal)
```
Completed this session:
  - auth.js built: signUp, signIn, signOut, getSession, getTier,
    getProfile, incrementAnalysesUsed, tierAnalysisLimit
  - Auth/Subscribe modal built inside auth.js (dynamic, no body HTML changes)
  - Login tab: email + password + error handling + Enter key submit
  - Subscribe tab: Pro/Fleet Starter/Fleet Pro tier cards + signup flow
  - Signup creates Supabase account only — Stripe checkout deferred
  - Nav wired: nav-login-btn, nav-subscribe-btn, nav-user-btn (sign out)
  - index.html nav patched — IDs added, nav-user-btn div inserted

Files changed:
  - auth.js (new)
  - index.html (nav block only)
  - CONTEXT.md

Latest commit: a0411f4
```

## Session Log — 14 Apr 2026 (RAG — wiring + production test)
```
Completed this session:
  - Cloudflare Worker extended: POST /embed (Voyage AI) + POST /rag (Supabase RPC)
  - Cloudflare env vars added: VOYAGE_API_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL
  - Worker deployed: version 1ffa12d1-6960-4c3b-8a78-8c49e17c7437
  - app.js: ragQuery(), buildRagContext(), streamClaude() updated with KB injection
  - Supabase match_knowledge_chunks recreated as SECURITY DEFINER — RLS fix
  - index.html + fleet.html: SUPABASE_URL_AUTH / SUPABASE_ANON_KEY_AUTH rename fix
  - Production test: /embed 200 OK, /rag 200 OK, /v1/messages 200 OK
  - KB context visible in AI report output

Files changed:
  - axiomanare-proxy.js
  - app.js
  - index.html
  - fleet.html
  - CONTEXT.md

Latest commit: a10b773
```

## Session Log — 15 Apr 2026 (Data — KB CM Summaries)
```
Completed this session:
  - 8 XLSX condition monitoring tables received and anonymised
  - Converted to MD: CM_SiteA_AHU, CM_SiteA_UTY, CM_SiteA_WWTP,
    CM_SiteB_AHU, CM_SiteB_UTY, CM_SiteB_MFG, CM_SiteB_TankFarm, CM_SiteC_AHU
  - 40 new chunks ingested and embedded (voyage-3)
  - Total KB: 109 chunks
  - CMAPSSData.zip (NASA turbofan) — assessed, not relevant, skipped

Files changed:
  - KB/Reports/CM_SiteA_AHU.md (new)
  - KB/Reports/CM_SiteA_UTY.md (new)
  - KB/Reports/CM_SiteA_WWTP.md (new)
  - KB/Reports/CM_SiteB_AHU.md (new)
  - KB/Reports/CM_SiteB_UTY.md (new)
  - KB/Reports/CM_SiteB_MFG.md (new)
  - KB/Reports/CM_SiteB_TankFarm.md (new)
  - KB/Reports/CM_SiteC_AHU.md (new)
  - CONTEXT.md

Latest commit: 1067951
```

## Session Log — 18 Apr 2026 (Data — KB + ML population continued)
```
Completed this session:
  - CWRU YouTube transcript analysed (Amir Resza)
  - AxiomAnare implementation validated against independent academic review
  - CWRU_Dataset_Overview.md written and committed to KB/Reference

Files changed:
  - KB/Reference/CWRU_Dataset_Overview.md (new)
  - CONTEXT.md

Latest commit: 1547bc4
```

## Session Log — 20 Apr 2026 (Data — KB documents assessed and processed)
```
Completed this session:
  - 4 documents assessed for KB inclusion:
      Scale-Fractal DFA paper — EXCLUDED (too academic, wrong scope)
      SKF Bearing Installation and Maintenance Guide — INCLUDED
      SKF Bearing Maintenance Handbook — INCLUDED
      VCAT-I-III Reference Material (Mobius Institute 2024) — INCLUDED
  - VCAT_Reference_Material.md → KB/Reference/
  - SKF_Bearing_Installation_Guide.md → KB/Manuals/
  - SKF_Bearing_Maintenance_Handbook.md → KB/Manuals/

Files changed:
  - KB/Reference/VCAT_Reference_Material.md (new)
  - KB/Manuals/SKF_Bearing_Installation_Guide.md (new)
  - KB/Manuals/SKF_Bearing_Maintenance_Handbook.md (new)
  - CONTEXT.md

Latest commit: c95c2e3
```

## Session Log — 21 Apr 2026 (UI — animated logo + responsive layout)
```
Completed this session:
  - Animated canvas logo built (3-gear system + green sine wave)
  - Replaced static SVG logo in index.html nav
  - window.addEventListener('load') guard added — fixes animation on GitHub Pages
  - Full responsive CSS added:
      Tablet (<=900px): nav collapses, taglines hidden, grids single-column
      Mobile (<=600px): nav stacks vertically, buttons 2-col grid, hero shrinks
  - Tested on live mobile device — animation and layout confirmed working

Files changed:
  - index.html

Latest commit: 46810ec
```

## Session Log — 21 Apr 2026 (Payments — Stripe integration)
```
Completed this session:
  - axiomanare-proxy.js: POST /create-checkout-session route
      - accepts { tier, userId, email, returnUrl }
      - maps tier → STRIPE_PRICE_* env var → Stripe Checkout Session
      - sets client_reference_id = Supabase user UUID
      - returns { url } — client redirects to Stripe
  - axiomanare-proxy.js: POST /stripe-webhook route
      - HMAC-SHA256 signature verification via SubtleCrypto (no external lib)
      - checkout.session.completed → profiles.tier update + subscription_events insert
      - customer.subscription.deleted → downgrade tier to free + audit log
  - auth.js: _doSignup() — two-step: create Supabase account → redirect to Stripe
  - auth.js: _handlePaymentReturn() — ?payment=success shows toast, ?payment=cancelled reopens modal
  - auth.js: _showPaymentToast() — fixed green banner, auto-dismisses 6s, matches CSS vars
  - PayPal deferred to Phase 3 (post-launch)

Pending before Stripe go-live:
  - Supabase: ALTER TABLE profiles ADD COLUMN stripe_customer_id + stripe_subscription_id
  - Cloudflare Worker: add 5 secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, 3x STRIPE_PRICE_*)
  - Stripe Dashboard: create 4 products, attach prices, register webhook endpoint
  - Redeploy Worker after adding secrets
  - Test with sk_test_ keys + card 4242 4242 4242 4242

Files changed:
  - axiomanare-proxy.js
  - auth.js
  - CONTEXT.md

Latest commit: 286d50d
```

## Session Log — 24 Apr 2026 (Gating — Freemium tier sync)
```
Completed this session:
  - FREE_ANALYSIS_LIMIT confirmed at 5 (CONTEXT.md was stale at 2 — corrected)
  - Tier structure table updated: Free tier now shows 5 analyses
  - Freemium.isPro() rewired — reads ax_tier from localStorage (written by
    syncTier()) instead of ax_pro flag only. Any tier other than 'free' = paid.
  - Freemium.syncTier() added (async):
      - calls window.Auth.getTier() after page load
      - caches result to localStorage as ax_tier
      - refreshes nav badge via updateFreeBadge()
      - if paid: removes watermark, trial banner, upgrade modal, PDF lock
      - non-blocking — failure logged to console only
  - ax_pro flag retained as legacy fallback (existing sessions not broken)
  - index.html: syncTier() called 200ms after auth.js loads (inline script
    added after auth.js <script> tag) to allow Supabase session restore
    before tier read
  - LF/CRLF warnings on commit are cosmetic — Windows Git normalisation only

Files changed:
  - app.js
  - index.html
  - CONTEXT.md

Latest commit: 76f681a

Next session should:
  - Verify auth.js Auth.getTier() returns tier string matching isPro() check
    (must return 'pro' / 'fleet_starter' / 'fleet_pro' / 'free' / null)
  - Apply same syncTier pattern to fleet.html
  - Run Supabase ALTER TABLE profiles ADD COLUMN stripe_customer_id + stripe_subscription_id
  - Stripe go-live checklist: add Worker secrets, create products/prices, register webhook
  - RLS re-hardening on organisations table
```
