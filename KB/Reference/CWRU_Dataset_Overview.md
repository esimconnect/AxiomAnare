# CWRU Bearing Dataset — Reference and Implementation Validation
## KB/Reference/CWRU_Dataset_Overview.md

Source: Case Western Reserve University Bearing Data Center
Video reference: "Fantastic Datasets and Where to Find Them — CWRU Bearing Dataset" (Amir Resza, YouTube)
Prepared for: AxiomAnare Knowledge Base
Date: Apr 2026

---

## 1. Dataset Origin and Purpose

The CWRU Bearing Dataset was collected around the year 2000 at Case Western Reserve University. It was created specifically to enable predictive maintenance research — the ability to detect bearing faults from vibration signals before failure occurs, rather than replacing components on fixed schedules.

It has become the community standard benchmark for rolling element bearing fault diagnosis. It is widely used in academic and industrial research to train and validate machine learning classifiers for bearing health monitoring.

---

## 2. Test Rig Configuration

| Parameter | Detail |
|-----------|--------|
| Motor | 2 HP Reliance Electric induction motor |
| Drive end bearing | SKF 6205-2RS JEM |
| Fan end bearing | SKF 6203-2RS JEM |
| Load simulation | Dynamometer (0, 1, 2, 3 HP) |
| Speed measurement | Encoder (avg RPM per file) |
| Accelerometer locations | Drive end housing, fan end housing, base plate |
| Fault induction method | Electro-discharge machining (EDM) — artificial defects on healthy bearings |

---

## 3. Fault Structure

### Fault Locations
- Inner race (IR) → maps to **BPFI** (Ball Pass Frequency Inner race)
- Ball (B) → maps to **BSF** (Ball Spin Frequency)
- Outer race (OR) → maps to **BPFO** (Ball Pass Frequency Outer race)

### Outer Race Positions
| Position | Description | Training Use |
|----------|-------------|--------------|
| @6:00 | Centred at load zone (primary) | Primary training set |
| @3:00 | Orthogonal to load | Augmentation |
| @12:00 | Opposite load zone | Augmentation |

### Fault Diameters
0.007", 0.014", 0.021", 0.028" (drive end)
0.007", 0.014", 0.021" (fan end — 0.028" not available)

### Load Conditions
| Load (HP) | Approx RPM |
|-----------|-----------|
| 0 | 1797 |
| 1 | 1772 |
| 2 | 1750 |
| 3 | 1730 |

---

## 4. File Contents and Naming

### What Each File Contains
- DE_time — drive end accelerometer time series
- FE_time — fan end accelerometer time series
- BA_time — base accelerometer time series (fault files only)
- RPM — single average value for the run

### Data Volume
- Normal baseline files: ~500,000 data points (48 kHz)
- Fault files: ~120,000 data points (12 kHz typical)

### Naming Convention
Format: `[fault_type][diameter]_[load]`

Example: `IR007_0` = Inner Race fault, 0.007" diameter, 0 HP load

Important limitation: the filename alone does not indicate sampling rate (12 kHz vs 48 kHz). Sampling rate must be inferred from folder structure or file size.

### AxiomAnare Descriptive Filenames
AxiomAnare solved this limitation by mapping CWRU numeric file IDs to descriptive filenames at download time. Example: CWRU file `105.mat` is saved as `IR007_0.mat` in `Data_Sets/cwru/drive_end/`. The `cwru_label_map.json` is the authoritative reference linking filename to fault type, diameter, load, RPM, and computed fault frequencies.

---

## 5. Sampling Rates

| Rate | Purpose |
|------|---------|
| 12 kHz | General vibration — mechanical looseness, structural response |
| 48 kHz | High-frequency fault detection — early-stage bearing defects (ringing/impacting) |

AxiomAnare's current download covers the 12 kHz drive end and fan end fault files. The 48 kHz drive end series (which captures early-stage fault signatures at higher resolution) is available on the CWRU site and can be added in a future data session if early-fault detection sensitivity needs to be improved.

---

## 6. FAIR Principles Assessment

Assessed against the FAIR data principles (Findable, Accessible, Interoperable, Reusable):

| Principle | Rating | Notes |
|-----------|--------|-------|
| Findable | Poor | No DOI; lives on a university web page; metadata not machine-readable |
| Accessible | Good | Free HTTP download; no login, no fees |
| Interoperable | Poor | Proprietary .mat format; naming loses context without folder structure |
| Reusable | Ambiguous | No explicit licence; well-documented experimental setup |

**Verdict:** Practically FAIR, technically unfair. Used universally because it became the community standard through historical precedent, not because of formatting quality.

---

## 7. Known Limitations and Risks

**Overfitting risk:** Models trained exclusively on CWRU can memorise the specific noise signature of that test rig rather than learning generalisable fault patterns. High reported accuracy (often >99%) on CWRU does not guarantee real-world performance on different machinery.

**Lab vs field gap:** CWRU faults are EDM-induced at controlled diameters under steady-state conditions. Real-world bearings degrade progressively under variable load, contamination, and misalignment — conditions not represented in CWRU.

**Mitigation in AxiomAnare:** The multi-source data strategy (CWRU + NASA IMS run-to-failure + Epson field data) directly addresses both risks. CWRU provides clean fault classification training. NASA IMS provides degradation trajectories. Epson provides real-world signal variation. Together they reduce the risk of the model overfitting to any single rig.

---

## 8. AxiomAnare Implementation Validation

The following table compares what the CWRU dataset actually contains (confirmed by the video and the CWRU website) against what AxiomAnare has implemented:

| Element | CWRU Dataset | AxiomAnare Implementation | Status |
|---------|-------------|--------------------------|--------|
| Fault types | IR, Ball, OR | BPFI, BSF, BPFO (mapped) | ✅ Correct |
| Fault diameters | 0.007–0.028" | All four sizes downloaded | ✅ Correct |
| Load conditions | 0–3 HP | All four loads, RPM per load in label map | ✅ Correct |
| OR positions | @6, @3, @12 | All three downloaded, @6 flagged as primary | ✅ Correct |
| Channels per file | DE, FE, BA, RPM | DE + FE documented; BA present in files | ✅ Correct |
| Fault frequencies | Not in files | Computed and added to cwru_label_map.json | ✅ Exceeds dataset |
| Naming clarity | Ambiguous (numeric IDs) | Descriptive filenames at download | ✅ Exceeds dataset |
| Sampling rate clarity | Requires folder check | 12 kHz series complete; 48 kHz deferred | ⚠️ Partial |
| Overfitting risk | Known issue | Multi-source data + engineer sign-off | ✅ Mitigated |
| Autonomous AI classification | Flagged as risk | Not done — engineer reviews all outputs | ✅ Mitigated |

**Summary:** AxiomAnare's CWRU implementation is structurally correct and in two areas (fault frequencies, descriptive naming) exceeds what the raw dataset provides. The engineer sign-off requirement and multi-source data strategy directly address the two primary limitations the academic community has identified with CWRU-based models.

---

## 9. Usage in AxiomAnare Pipeline

- **Label map:** `ML/Labels/cwru_label_map.json`
- **Raw signals:** `Data_Sets/cwru/normal/`, `drive_end/`, `fan_end/`
- **Pipeline role:** Phase 4 ML classifier training — bearing fault type and severity classification
- **RAG role:** Fault frequency values from the label map are used to seed FFT peak search in the diagnostic pipeline at runtime
- **KB role:** This document grounds Claude's explanations when CWRU-format files are uploaded or when bearing fault frequencies are discussed

---

*Prepared for AxiomAnare Knowledge Base. Content derived from CWRU Bearing Data Center documentation and independent academic review. Not for external distribution.*
