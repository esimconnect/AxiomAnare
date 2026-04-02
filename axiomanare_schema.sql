-- ══════════════════════════════════════════════════════════════
-- AXIOMANARE SUPABASE SCHEMA
-- Two-silo architecture: Customer Silo + Cumulative Silo
-- ══════════════════════════════════════════════════════════════

-- ── CUSTOMER SILO ─────────────────────────────────────────────

-- Organisations (companies or individual accounts)
CREATE TABLE IF NOT EXISTS organisations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  industry      TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  contribute_to_silo  BOOLEAN DEFAULT TRUE,
  store_raw_files     BOOLEAN DEFAULT TRUE
);

-- Assets (named machines per organisation)
CREATE TABLE IF NOT EXISTS assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organisations(id),
  asset_name      TEXT NOT NULL,
  equipment_type  TEXT,
  machine_class   TEXT,
  nameplate_rpm   FLOAT,
  nameplate_kw    FLOAT,
  bearing_model   TEXT,
  bpfo_mult       FLOAT,
  bpfi_mult       FLOAT,
  bsf_mult        FLOAT,
  ftf_mult        FLOAT,
  meas_point      TEXT,
  meas_axis       TEXT,
  location        TEXT,
  criticality     TEXT DEFAULT 'general',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_reading_at TIMESTAMPTZ
);

-- Baselines (healthy reference per asset)
CREATE TABLE IF NOT EXISTS baselines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID REFERENCES assets(id),
  rms_mean        FLOAT NOT NULL,
  rms_sd          FLOAT NOT NULL,
  cf_mean         FLOAT,
  kurt_mean       FLOAT,
  sample_count    INTEGER DEFAULT 1,
  established_at  TIMESTAMPTZ DEFAULT NOW(),
  source_file     TEXT,
  notes           TEXT
);

-- NVR Records (every analysis run)
CREATE TABLE IF NOT EXISTS nvr_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID REFERENCES assets(id),
  baseline_id     UUID REFERENCES baselines(id),
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  filename        TEXT,
  file_format     TEXT,
  sample_count    INTEGER,
  sample_rate_hz  FLOAT,
  rms_mms         FLOAT,
  peak_mms        FLOAT,
  crest_factor    FLOAT,
  kurtosis        FLOAT,
  deviation_sigma FLOAT,
  iso_zone        TEXT,
  trend_code      TEXT,
  rul_days        INTEGER,
  rul_ci_days     INTEGER,
  shaft_hz        FLOAT,
  top_fault       TEXT,
  top_fault_pct   FLOAT,
  machine_class   TEXT,
  load_pct        FLOAT,
  last_maint_date DATE,
  raw_file_key    TEXT,
  raw_file_hash   TEXT,
  storage_consent BOOLEAN DEFAULT FALSE,
  contributed_to_silo BOOLEAN DEFAULT FALSE
);

-- Fault Detections (individual fault findings per NVR)
CREATE TABLE IF NOT EXISTS fault_detections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nvr_id          UUID REFERENCES nvr_records(id),
  fault_type      TEXT NOT NULL,
  fault_category  TEXT,
  confidence_pct  FLOAT,
  freq_hz         FLOAT,
  harmonics_used  INTEGER,
  iso_reference   TEXT,
  locked          BOOLEAN DEFAULT FALSE
);

-- ── CUMULATIVE SILO ───────────────────────────────────────────

-- Fault Signatures (anonymised spectral features)
CREATE TABLE IF NOT EXISTS fault_signatures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  machine_class   TEXT,
  equipment_type  TEXT,
  fault_type      TEXT,
  fault_category  TEXT,
  confidence_pct  FLOAT,
  iso_zone        TEXT,
  shaft_hz        FLOAT,
  rms_mms         FLOAT,
  kurtosis        FLOAT,
  crest_factor    FLOAT,
  freq_hz         FLOAT,
  harmonics_used  INTEGER,
  bearing_model   TEXT,
  load_pct        FLOAT,
  region          TEXT
);

-- Zone Progressions (anonymised zone change timelines)
CREATE TABLE IF NOT EXISTS zone_progressions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_class   TEXT,
  equipment_type  TEXT,
  from_zone       TEXT,
  to_zone         TEXT,
  days_between    INTEGER,
  fault_type      TEXT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHARED REFERENCE ──────────────────────────────────────────

-- Bearing Library (grows dynamically)
CREATE TABLE IF NOT EXISTS bearing_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bearing_model   TEXT UNIQUE NOT NULL,
  manufacturer    TEXT,
  bore_mm         FLOAT,
  od_mm           FLOAT,
  ball_count      INTEGER,
  bpfo_mult       FLOAT NOT NULL,
  bpfi_mult       FLOAT NOT NULL,
  bsf_mult        FLOAT NOT NULL,
  ftf_mult        FLOAT NOT NULL,
  contact_angle   FLOAT,
  source          TEXT DEFAULT 'manufacturer',
  verified        BOOLEAN DEFAULT FALSE,
  added_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE baselines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nvr_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_detections ENABLE ROW LEVEL SECURITY;

-- Public read on shared tables (bearing library, cumulative silo)
ALTER TABLE bearing_library   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_signatures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_progressions ENABLE ROW LEVEL SECURITY;

-- Allow anon to read bearing library and insert NVR records (beta mode)
CREATE POLICY "Public read bearing_library" ON bearing_library FOR SELECT USING (true);
CREATE POLICY "Public insert nvr_records"   ON nvr_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert fault_detections" ON fault_detections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert fault_signatures" ON fault_signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read fault_signatures" ON fault_signatures FOR SELECT USING (true);
CREATE POLICY "Public insert baselines" ON baselines FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read baselines" ON baselines FOR SELECT USING (true);
CREATE POLICY "Public insert assets" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Public insert organisations" ON organisations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read organisations" ON organisations FOR SELECT USING (true);
CREATE POLICY "Public insert zone_progressions" ON zone_progressions FOR INSERT WITH CHECK (true);

-- ── SEED BEARING LIBRARY ──────────────────────────────────────
INSERT INTO bearing_library (bearing_model, manufacturer, bpfo_mult, bpfi_mult, bsf_mult, ftf_mult, ball_count, source, verified) VALUES
('SKF 6200', 'SKF', 3.053, 4.947, 1.994, 0.382, 7, 'manufacturer', true),
('SKF 6203', 'SKF', 3.592, 5.408, 2.357, 0.399, 8, 'manufacturer', true),
('SKF 6204', 'SKF', 3.592, 5.408, 2.357, 0.399, 8, 'manufacturer', true),
('SKF 6205', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6206', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6207', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6208', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6209', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6210', 'SKF', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('SKF 6304', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6305', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6306', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6307', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6308', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6309', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('SKF 6310', 'SKF', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('FAG 6205', 'FAG', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('FAG 6206', 'FAG', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('FAG 6207', 'FAG', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('FAG 6208', 'FAG', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('FAG 6305', 'FAG', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('FAG 6306', 'FAG', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('FAG 6307', 'FAG', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('FAG 6308', 'FAG', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('NSK 6205', 'NSK', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('NSK 6206', 'NSK', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('NSK 6305', 'NSK', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('NSK 6308', 'NSK', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('NTN 6205', 'NTN', 3.585, 5.415, 2.357, 0.398, 9, 'manufacturer', true),
('NTN 6308', 'NTN', 3.991, 6.009, 2.616, 0.399, 8, 'manufacturer', true),
('TIMKEN 30205', 'Timken', 3.746, 6.254, 2.841, 0.374, 13, 'manufacturer', true),
('TIMKEN 30208', 'Timken', 3.746, 6.254, 2.841, 0.374, 13, 'manufacturer', true)
ON CONFLICT (bearing_model) DO NOTHING;

-- ── SEED CWRU NORMAL BASELINE ─────────────────────────────────
-- Real CWRU 97.mat values — healthy SKF 6205 at 1797 RPM
-- Used as cumulative silo reference for healthy motor baseline
INSERT INTO fault_signatures (
  machine_class, equipment_type, fault_type, fault_category,
  confidence_pct, iso_zone, shaft_hz, rms_mms, kurtosis,
  crest_factor, bearing_model, region
) VALUES (
  'Class II', 'motor', 'Normal - No Fault', 'baseline',
  0, 'B', 29.95, 2.456, 2.76,
  4.22, 'SKF 6205', 'CWRU_benchmark'
);

