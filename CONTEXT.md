# AxiomAnare — Living Project Context
Last updated: April 2026
Latest commit: c95c2e3

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
- [x] KB/Reference: CWRU_Dataset_Overview.md (dataset structure + AxiomAnare validation)
- [x] KB/Reference: VCAT_Reference_Material.md (Mobius Institute CRMVA reference — fault spectra, ISO zones, FFT formulas, transducer guide)
- [x] KB/Manuals: SKF_Bearing_Installation_Guide.md (symptom/cause matrix, damage modes, lubrication, fits)
- [x] KB/Manuals: SKF_Bearing_Maintenance_Handbook.md (failure statistics, vibration monitoring, inspection procedure, root cause matrix)
- [x] NASA IMS 1st_test (2,156 files) + 2nd_test (984 files)
- [x] Field data: Epson trimmed (96 files)
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
- [ ] CWRU 48 kHz drive end files (early-stage fault detection, deferred)

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

### CWRU Implementation Validation
- Independently validated against academic review (YouTube: Amir Resza, CWRU dataset analysis)
- Fault taxonomy, file structure, load conditions, OR positions all confirmed correct
- AxiomAnare label map adds computed fault frequencies not present in raw dataset
- Descriptive filenames solve naming ambiguity identified as a known dataset weakness
- Multi-source data strategy (CWRU + NASA IMS + Epson) mitigates overfitting risk
- Engineer sign-off requirement mitigates autonomous classification risk
- Full validation documented in KB/Reference/CWRU_Dataset_Overview.md

### ML Pipeline (planned)
1. Enable pgvector in Supabase
2. Create Supabase Storage buckets
3. Bulk upload CWRU/NASA MAT files via script
4. Feature extraction script → ml_features table
5. Label features by fault type
6. Train classifier (target: 12 months post-launch)
7. PDF/MD chunking + embedding → knowledge_chunks table
8. RAG query injected into Claude prompt at analysis time

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
| Apr 2026 | Kaggle CWRU mirror — skipped                    | Repackaged data we already have      |
| Apr 2026 | CWRU 48 kHz files deferred                      | 12 kHz sufficient for current pipeline |
| Apr 2026 | Scale-Fractal DFA paper excluded                | Too academic, wrong asset scope      |
| Apr 2026 | SKF guides included in KB/Manuals               | Symptom/cause/damage directly relevant to CM |
| Apr 2026 | VCAT included in KB/Reference                   | Fault spectra library + ISO zones + FFT formulas |
| Apr 2026 | auth.js as IIFE, window.Auth public API         | Matches window.Freemium pattern in app.js |
| Apr 2026 | Modal built dynamically in auth.js, not in HTML | Self-contained; works on fleet.html too |
| Apr 2026 | Signup creates Supabase account only (no Stripe yet) | Stripe checkout wired in Payments session |
| Apr 2026 | Default tier selection = Pro in Subscribe modal | Lowest-friction primary conversion target |

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
│   ├── Standards\   ISO_10816_Chart_colour.pdf                    ✓
│   ├── Reports\     K394-11 + Reports 001–009                     ✓
│   ├── Reference\   Nagahama_2025 + CWRU README
│   │                + CWRU_Dataset_Overview.md                    ✓
│   │                + VCAT_Reference_Material.md                  ✓
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

---

## Session Log — 20 Apr 2026 (Data — KB documents assessed and processed)
```
Completed this session:
  - 4 documents assessed for KB inclusion:
      Scale-Fractal DFA paper (Medina et al.) — EXCLUDED (too academic, wrong scope)
      SKF Bearing Installation and Maintenance Guide — INCLUDED
      SKF Bearing Maintenance Handbook — INCLUDED
      VCAT-I-III Reference Material (Mobius Institute 2024) — INCLUDED
  - VCAT_Reference_Material.md written → KB/Reference/
      FFT formulas, unit conversions, ISO 20816-3 zone values,
      transducer selection guide, full fault pattern spectra library,
      bearing fault stage progression, trial weight formula
  - SKF_Bearing_Installation_Guide.md written → KB/Manuals/
      Symptom-to-cause matrix, damage mode classification,
      lubrication guidance, fit selection impact on vibration
  - SKF_Bearing_Maintenance_Handbook.md written → KB/Manuals/
      Failure statistics, vibration monitoring principles,
      inspection procedure, root cause matrix, diagnostic decision tree

Files changed:
  - KB/Reference/VCAT_Reference_Material.md (new)
  - KB/Manuals/SKF_Bearing_Installation_Guide.md (new)
  - KB/Manuals/SKF_Bearing_Maintenance_Handbook.md (new)
  - CONTEXT.md (this update)

Latest commit: [fill in after git commit]

Next session should:
  - Open "Payments — Stripe + PayPal integration"
  - Create Stripe products + Price IDs in Stripe Dashboard first
  - Wire _doSignup() in auth.js → Stripe Checkout Session redirect
  - Handle Stripe webhook → update profiles.tier on subscription activation
  - Phase 1 is the critical path — data collection is now sufficient to proceed
```
