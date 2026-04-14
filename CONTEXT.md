# AxiomAnare — Living Project Context
Last updated: April 2026
Latest commit: 6c7c847

---

## Repository
- Repo: https://github.com/esimconnect/AxiomAnare
- Live: https://esimconnect.github.io/AxiomAnare
- Local: E:\Kairos\AxiomAnare\axiomanare\AxiomAnare
- Branch: main

## Supabase
- URL: https://zjfhxutcvjxootoekade.supabase.co
- Existing tables: organisations, assets, nvr_records
- New tables (created this sprint): profiles, asset_twins, case_library,
  knowledge_chunks, usage_log, subscription_events
- RLS: hardened and tested on all tables
- pgvector: confirmed already enabled

---

## Completed Work
- [x] Single-channel diagnostic pipeline
- [x] Multi-channel diagnostic pipeline
- [x] PDF export
- [x] Fleet Dashboard (auth, RLS, baseline + batch upload)
- [x] Fleet detail panel
- [x] Agnostic file parser (CSV, MAT, XLSX, JSON, TSV)
- [x] SVG logo integrated into nav (index.html)
- [x] Nav: Free to Try, Subscribe, Login, Fleet Dashboard buttons
- [x] Hero subtitle single line
- [x] Register renamed to Subscribe
- [x] Nav height and logo sizing finalised
- [x] ML label maps: cwru_label_map.json, nasa_ims_label_map.json, epson_label_map.json
- [x] CWRU .mat dataset download — 109 files, 0 failed (drive_end + fan_end + normal)
- [x] KB/Standards: ISO_10816_Chart_colour.pdf
- [x] KB/Reports: Cooling_Tower_Fan-K394-11.pdf + Reports 001–006 (anonymised)
- [x] KB/Reports: Reports 007–009 (anonymised .md, Apr 2023 quarter)
- [x] KB/Reference: Nagahama_2025_Phase_Fault_Diagnosis.pdf
- [x] KB/Reference: CWRU Bearing Data Centre README.pdf
- [x] KB/Reference: Vibration_Reference.md (derived from Vibration_Basic.pdf —
      copyright-safe rewrite, RAG-ready, 718 lines)
- [x] NASA IMS 1st_test (2,156 files) + 2nd_test (984 files)
- [x] Field data: Epson trimmed (96 files)
- [x] Supabase schema — all new tables + nvr_records updates (commit pending)
- [x] auth.js shared module — signUp, signIn, signOut, getSession, getTier,
      getProfile, incrementAnalysesUsed, tierAnalysisLimit
- [x] Auth + Subscribe modal — Login tab + Subscribe tab with tier cards
- [x] Nav wired — nav-login-btn, nav-subscribe-btn, nav-user-btn (sign out)

## In Progress
- [ ] Stripe + PayPal integration
- [ ] Tier gating (index.html + fleet.html)

## Not Started
- [ ] Landing page
- [ ] Digital twin Phase 1
- [ ] ML feature extraction (CWRU/NASA)
- [ ] Case library population
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Annual pricing / discount logic
- [ ] Supabase Storage buckets (ml-raw-signals, knowledge-base)
- [ ] NASA IMS 3rd_test — ZIP corrupt on extraction, Kaggle needed, deferred indefinitely
- [ ] KB/Reports: Q1, Q3, Q4 2023 quarterly reports (1 month per quarter, pending upload)
- [ ] KB/Manuals: CAT 1 manual (pending)

---

## Tier Structure
| Tier          | Price      | Analyses  | Assets | AI Report | Fleet |
|---------------|------------|-----------|--------|-----------|-------|
| Free          | $0         | 2         | —      | ✗         | ✗     |
| Pro           | $49/month  | Unlimited | —      | ✓         | ✗     |
| Fleet Starter | $99/month  | Unlimited | 10     | ✓         | ✓     |
| Fleet Pro     | $299/month | Unlimited | 30     | ✓         | ✓     |
| Asset add-on  | $25/asset  | —         | +1     | ✓         | ✓     |

- No upload caps on any paid tier
- Annual: 2 months free (pay 10, get 12)
- AI report is the primary freemium gate
- Pricing philosophy: below expense claim threshold —
  engineer pays own card, no PO or finance approval needed

---

## Payments
- Stripe: primary (account exists, keys TBC)
- PayPal: secondary (client ID TBC)
- Currency: USD primary, local currency via Stripe/PayPal auto
- Billing: monthly auto-renew, cancel anytime
- Stripe Price IDs: to be created in Stripe Dashboard
- Products to create in Stripe:
    1. AxiomAnare Pro — $49/month recurring
    2. AxiomAnare Fleet Starter — $99/month recurring
    3. AxiomAnare Fleet Pro — $299/month recurring
    4. Asset Add-on — $25/month recurring

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
| Source               | Type     | Fault Coverage              | Status      |
|----------------------|----------|-----------------------------|-------------|
| CWRU dataset         | MAT      | BPFO, BPFI, BSF             | ✓ Complete  |
| NASA IMS 1st_test    | MAT      | RUL / run-to-failure        | ✓ Complete  |
| NASA IMS 2nd_test    | MAT      | RUL / run-to-failure        | ✓ Complete  |
| NASA IMS 3rd_test    | MAT      | RUL / run-to-failure        | ✗ Deferred  |
| Epson field data     | CSV      | Mixed field faults          | ✓ Complete  |
| K394-11 field report | PDF      | Imbalance (confirmed)       | ✓ Uploaded  |
| Reports 001–006      | PDF      | Anonymised field cases      | ✓ Uploaded  |
| Reports 007–009      | MD       | Pharma plant, Apr 2023      | ✓ Complete  |
| ISO 10816 CMVA guide | PDF      | Zone thresholds             | ✓ Uploaded  |
| Nagahama 2025        | PDF      | Phase fault diagnosis       | ✓ Uploaded  |
| CWRU README          | PDF      | Bearing dataset ref         | ✓ Uploaded  |
| Vibration_Reference  | MD       | Terminology + fault patterns| ✓ Complete  |
| Reports Q1/Q3/Q4     | MD       | Pharma plant, 2023          | Pending     |
| CAT 1 manual         | PDF      | All fault types             | Pending     |

### KB Reports — Content Summary
| Report | Assets | Key Faults |
|--------|--------|------------|
| 001–006 | Various | Mixed field cases |
| 007 | 24 AHUs — pharma plant | Misalignment/beat (Danger), bearing fault freq (Alert), unbalance/misalignment (Warning) |
| 008 | 15 Tank Farm units — pharma plant | Early bearing fault (demod elevated, velocity normal) — chilled water pump + scrubber blower |
| 009 | 2 Booster pumps — pharma plant | Clean baseline — healthy motor-pump reference readings |

### Vibration_Reference.md — Content Summary
| Section | Content |
|---------|---------|
| Part 1 | A–Z vibration terminology — all terms relevant to rotating machinery diagnostics |
| Part 2 | 15 fault pattern entries: Ski Slope, Raised Noise Floor, Static/Couple/Dynamic/Overhung/Vertical Imbalance, Eccentric Rotor/Sheave, Angular/Parallel Misalignment, Bent Shaft, Cocked Bearing, Rotating/Structural/Pedestal Looseness, Rotor Rub, Journal Bearing Clearance, Oil Whirl, Resonance, Rolling Element Bearing (6-stage + BPI/BPO/BS/FT formulas), Blade/Vane Pass |
| Part 3 | Units and conversion reference table |
| Part 4 | 12 diagnostic reasoning rules for AI hallucination ringfencing |

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

### ML Pipeline (planned)
1. Enable pgvector in Supabase
2. Create Supabase Storage buckets
3. Bulk upload CWRU/NASA MAT files via script
4. Feature extraction script → ml_features table
5. Label features by fault type
6. Train classifier (target: 12 months post-launch)
7. PDF/MD chunking + embedding → knowledge_chunks table
8. RAG query injected into Claude prompt at analysis time

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

### RAG Flow (planned)
```
PDF/MD uploaded → chunk text → embed via Anthropic API
→ store in knowledge_chunks (pgvector)
→ at analysis time: query top-3 relevant chunks
→ inject into Claude system prompt
→ Claude narrative grounded in domain knowledge
```

---

## Key Decisions Log
| Date     | Decision                                        | Rationale                            |
|----------|-------------------------------------------------|--------------------------------------|
| Apr 2026 | Stripe primary, PayPal secondary                | Existing account, best docs          |
| Apr 2026 | No upload caps on paid tiers                    | Reduce friction, gate on assets only |
| Apr 2026 | $49/$99/$299 pricing                            | Below expense claim threshold        |
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
| Apr 2026 | auth.js as IIFE, window.Auth public API         | Matches window.Freemium pattern in app.js |
| Apr 2026 | Modal built dynamically in auth.js, not in HTML | Self-contained; works on fleet.html too |
| Apr 2026 | Signup creates Supabase account only (no Stripe yet) | Stripe checkout wired in Payments session |
| Apr 2026 | Default tier selection = Pro in Subscribe modal | Lowest-friction primary conversion target |
| Apr 2026 | Vibration_Basic.pdf — local only, do not commit | Copyright (Mobius Software P/L 2005) |
| Apr 2026 | Vibration_Reference.md — rewritten, repo-safe   | All content original language, RAG-ready |

---

## Build Sequence
```
PHASE 1 — Foundation (build now)
├── Supabase schema (all new tables + nvr_records updates)  ✓ DONE
├── auth.js shared module (login, signup, getTier)          ✓ DONE
├── Auth + Subscribe modal on index.html                    ✓ DONE
├── Stripe + PayPal integration                             ← NEXT
├── Tier gating (index.html + fleet.html)
└── Landing page

PHASE 2 — Intelligence (pre-launch)
├── Digital twin Phase 1 (Fleet — baseline + deviation)
├── Supabase Storage buckets setup
├── PDF chunking + RAG pipeline
└── CWRU/NASA feature extraction

PHASE 3 — Growth (post-launch, 1-6 months)
├── Confirmed diagnosis feedback loop
├── Email notifications (anomaly alerts, readings due)
├── Statistical anomaly detection across dataset
└── Fleet Pro tier unlock

PHASE 4 — ML (12-24 months)
├── ML classifier (enough labelled data by now)
├── Full digital twin with degradation curve
├── API access for Fleet Pro
└── White-label option
```

---

## Files In This Project
| File                       | Purpose                                     |
|----------------------------|---------------------------------------------|
| CONTEXT.md                 | This file — update after every chat         |
| index.html                 | Main diagnostic app                         |
| app.js                     | Diagnostic engine, Freemium object          |
| auth.js                    | Shared auth module — Auth object            |
| fleet.html                 | Fleet dashboard                             |
| agnosticParser2.js         | Agnostic file parser                        |
| multiChannel.js            | Multi-channel analysis                      |
| agnosticParser.css         | Parser styles                               |
| ISO_10816_Chart_colour.pdf | ISO zone reference + CMVA interpretation    |
| Balancing_Report_K394.pdf  | Confirmed imbalance case study (K394-11)    |

---

## Data Folder Structure (local)
```
E:\Kairos\AxiomAnare\axiomanare\AxiomAnare\
├── ML\
│   └── Labels\
│       ├── cwru_label_map.json       ✓
│       ├── nasa_ims_label_map.json   ✓
│       └── epson_label_map.json      ✓
├── KB\
│   ├── Standards\   ISO_10816_Chart_colour.pdf          ✓
│   ├── Reports\     K394-11 + Reports 001–009           ✓
│   ├── Reference\   Nagahama_2025 + CWRU README
│   │                + Vibration_Reference.md             ✓
│   │                (Vibration_Basic.pdf — local only,
│   │                 do not commit)
│   └── Manuals\     (empty — CAT 1 pending)
└── Data_Sets\
    ├── cwru\        109 .mat files across 3 subfolders  ✓
    ├── nasa_ims\    1st_test (2156) + 2nd_test (984)    ✓
    │                3rd_test deferred
    └── field\
        └── epson\trimmed\  96 files                     ✓
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
  - download_cwru.py (created, run, complete — not committed, utility script)
  - KB/Reports/Report_007.md
  - KB/Reports/Report_008.md
  - KB/Reports/Report_009.md
  - CONTEXT.md (this update)

Latest commit: 20ca27f
```

## Session Log — 13 Apr 2026 (Schema — profiles + twins + case_library)
```
Completed this session:
  - Full Supabase schema migration run successfully
  - New tables created: profiles, asset_twins, case_library, knowledge_chunks,
    usage_log, subscription_events
  - Enum types created: tier_name, subscription_status, fault_class, iso_zone
  - Triggers created: handle_new_user (auto-profile on signup), handle_updated_at
  - Functions created: get_user_tier, get_asset_allowance, increment_analyses_used
  - RLS enabled on all new tables
  - nvr_records updated: feature_vector, user_confirmed, confirmed_fault, twin_deviation
  - pgvector confirmed already enabled
  - Note: organisations table flagged UNRESTRICTED — RLS to be addressed later

Files changed:
  - schema.sql (run in Supabase — not committed to repo, utility script)
  - schema_notes.md (saved locally for reference)
  - CONTEXT.md (this update)

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
  - Signup creates Supabase account only — Stripe checkout deferred to Payments session
  - Nav wired: nav-login-btn, nav-subscribe-btn, nav-user-btn (sign out)
  - index.html nav patched — IDs added to Login + Subscribe anchors,
    nav-user-btn div inserted (hidden by default, shown when signed in)

Files changed:
  - auth.js (new)
  - index.html (nav block only — 4 lines replaced with 8)
  - CONTEXT.md (this update)

Latest commit: a0411f4
```

## Session Log — 14 Apr 2026 (RAG — wiring + production test)
```
Completed this session:
  - Test harnesses built (standalone HTML, not production code):
      axiomanare_test.html — RAG, Supabase, pipeline unit, proxy, stress tests (32 tests)
      axiomanare_dataset_tests.html — 10 synthetic signal datasets through pipeline
      Both files confirmed working; zone colours fixed to reflect ISO severity not pass/fail

  - Cloudflare Worker (axiomanare-proxy.js) extended with two new routes:
      POST /embed — proxies Voyage AI embeddings (VOYAGE_API_KEY secret, server-side)
      POST /rag   — proxies Supabase match_knowledge_chunks RPC (SUPABASE_SERVICE_KEY)
      All secrets remain server-side in Cloudflare env vars — never exposed to client
      Deployed via Wrangler: version 1ffa12d1-6960-4c3b-8a78-8c49e17c7437

  - Cloudflare env vars added:
      VOYAGE_API_KEY (Secret)
      SUPABASE_SERVICE_KEY (Secret)
      SUPABASE_URL (Plaintext)

  - app.js — RAG wired into streamClaude():
      ragQuery() function — calls /embed then /rag, 0.30 similarity floor, silent fallback
      buildRagContext() — formats chunks into === KNOWLEDGE BASE CONTEXT === prompt section
      streamClaude() builds semantic query from NVR context (machine type + zone + top fault
        + kurtosis + CF + trend), retrieves top-5 KB chunks, injects before anti-hallucination rules
      Anti-hallucination rule 6 added when KB context present
      Claude fetch URL fixed: PROXY_BASE + '/v1/messages' (was hitting worker root → 404)

  - Supabase match_knowledge_chunks function:
      Recreated as SECURITY DEFINER (was INVOKER — caused RLS block, returned 0 rows)
      id column type fixed: uuid not text (was causing 42804 type mismatch error)
      GRANT EXECUTE added for service_role and anon
      Function tested directly in SQL editor — returns similarity 1.0, 0.84, 0.61 ✓

  - index.html + fleet.html — variable conflict fixed:
      SUPABASE_URL and SUPABASE_ANON_KEY renamed to SUPABASE_URL_AUTH / SUPABASE_ANON_KEY_AUTH
      supabaseClient = supabase.createClient(...) added to both files (was missing)
      Fixes: 'SUPABASE_URL already declared' + 'supabaseClient not initialised' console errors

  - Production test results (esimconnect.github.io/AxiomAnare):
      /embed → 200 ✓ (Voyage AI, 1024-dim, 797ms)
      /rag   → 200 ✓ (Supabase pgvector, chunks returned, 467ms)
      /v1/messages → 200 ✓ (Claude streaming, 11.84s)
      KB context visible in AI report: Section 2 now references KB guidance on
        crest factor >3.5 and kurtosis as bearing deterioration indicators
      Console clean — No Issues

Chunks retrieved in production test:
  - Vibration Reference (AxiomAnare) | sim=46.7% | gearbox spectrum sidebands
  - Vibration Reference (AxiomAnare) | sim=43.6% | Band-stop filter / FMAX

Files changed:
  - axiomanare-proxy.js (new /embed and /rag routes)
  - app.js (ragQuery, buildRagContext, streamClaude updated)
  - index.html (SUPABASE_URL_AUTH, SUPABASE_ANON_KEY_AUTH, supabaseClient init)
  - fleet.html (same fixes as index.html)
  - CONTEXT.md (this update)

Latest commit: a10b773

Next session should:
  - Open "Payments — Stripe + PayPal integration"
  - Create Stripe products + Price IDs in Stripe Dashboard first:
      1. AxiomAnare Pro — $49/month recurring
      2. AxiomAnare Fleet Starter — $99/month recurring
      3. AxiomAnare Fleet Pro — $299/month recurring
      4. Asset Add-on — $25/month recurring
  - Wire _doSignup() in auth.js → Stripe Checkout Session redirect
  - Handle Stripe webhook → update profiles.tier on subscription activation
  - Wire Stripe publishable key into index.html (env-safe — publishable key is public)
  - Test full subscribe flow: click Subscribe → Stripe Checkout → webhook → tier update
```

