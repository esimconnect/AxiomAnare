# Vibration Spectrum FFT Analysis Report
## Report_008 — Pharmaceutical Plant, Tank Farm Rotating Equipment (15 units), Apr 2023

**Anonymised for AxiomAnare Knowledge Base**
Anonymisation key: [CLIENT] = client organisation | [SITE-B] = plant site | [SERVICE PROVIDER] = vibration analysis contractor | [REPORT-REF] = report reference number

---

## Overview

- **Asset type:** Mixed rotating equipment — transfer pumps, circulation pumps, chillers, blowers, storm water pumps
- **Asset count:** 15 units
- **Site:** [SITE-B] — pharmaceutical manufacturing facility, Tank Farm area
- **Date of measurement:** Apr 2023
- **Measurement frequency:** Quarterly
- **Standard applied:** ISO 10816-3, Class II (pumps)
- **Instrumentation:** Commtest Vb5, ICP Accelerometer 100mV/g, 4x Permanent Mounted IEPC Vibration Sensors
- **Channels measured per asset:** Motor NDE, Motor DE, Pump DE, Pump NDE (horizontal, vertical, axial as applicable)
- **Prepared by:** [SERVICE PROVIDER], Certified CAT II Vibration Analyst

---

## Vibration Acceptance Criteria

| Zone | Overall Vibration (mm/s RMS) | Bearing Condition (g RMS) |
|------|------------------------------|---------------------------|
| Good (Green) | < 3.15 | < 0.99 |
| Warning (Yellow) | 3.16 – 7.00 | — |
| Alert (Orange) | 7.01 – 12.00 | > 1.0 |
| Danger (Red) | > 12.01 | > 4.0 |

---

## Fleet Summary — Condition by Asset

| No. | Asset Tag | Asset Description | Overall Vib (mm/s RMS) | Bearing Cond (g RMS) | Zone | Fault Indication |
|-----|-----------|-------------------|------------------------|----------------------|------|------------------|
| 1 | SG00214912P03 | Methanol Storage Transfer Pump P-03 | 1.03 | 0.29 | Good | None |
| 2 | SG00214913P03 | Acetone Storage Transfer Pump P-03 | 0.60 | 0.19 | Good | None |
| 3 | SG00214914P03 | Ethyl Acetate Storage Transfer Pump | 1.41 | 0.68 | Good | None |
| 4 | SG00214915P03 | Heptane Storage Transfer Pump P-03 | 0.55 | 0.07 | Good | None |
| 5 | SG00215011P02 | Glycol Storage Tank Circulation P02 | 1.25 | 0.18 | Good | None |
| 6 | SG00215011P03 | Glycol Storage Tank Circulation P03 | 1.14 | 0.38 | Good | None |
| 7 | SG00220815K02 | Air Cooled Chiller K02 | 1.24 | 0.34 | Good | None |
| 8 | SG00220815P01 | Chilled Water Pump 01 | 1.80 | 1.26 | **Alert** (bearing) | Bearing fault frequencies detected on motor |
| 9 | SG00220815P02 | Chilled Water Pump 02 | 1.42 | 0.68 | Good | None |
| 10 | SG00270011BL03 | Scrubber System Blower BL-03 | 0.98 | 0.19 | Good | None |
| 11 | SG00270011BL04 | Scrubber System Blower BL-04 | 2.08 | 1.08 | **Alert** (bearing) | Bearing fault frequencies detected on motor |
| 12 | SG00270011P01A | Scrubber System Pump P-01A | 1.14 | 0.03 | Good | None |
| 13 | SG00270011P01B | Scrubber System Pump P-01B | 1.35 | 0.02 | Good | None |
| 14 | SG00233915P01 | Storm Water Pump P01 | 2.15 | 0.39 | Good | Trend decreasing |
| 15 | SG00233915P02 | Storm Water Pump P02 | 2.11 | 0.13 | Good | Trend decreasing |

---

## Detailed Findings — Alert Assets

**SG00220815P01 Chilled Water Pump 01** — BC: 1.26 g RMS (Alert)
- Fault: Bearing fault frequencies detected on motor
- Measurement data (Motor NDE Horizontal): Demod 0.6601 g RMS; Velocity 1.129 mm/s RMS
- Measurement data (Motor DE Vertical): Demod 1.264 g RMS; Velocity 1.304 mm/s RMS
- Measurement data (Motor DE Axial): Demod 1.217 g RMS; Velocity 1.209 mm/s RMS
- Bearing trend: Increasing (previous readings 0.415 → 0.468 → 0.660 g on Motor NDE; 0.490 → 0.517 → 1.264 g on Motor DE Vertical)
- Overall vibration: Good zone (1.80 mm/s RMS)
- Recommendation: Grease motor bearings. Continue close periodic monitoring.

**SG00270011BL04 Scrubber System Blower BL-04** — BC: 1.08 g RMS (Alert)
- Fault: Bearing fault frequencies detected on motor DE
- Measurement data (Motor DE Vertical): Demod 1.083 g RMS; Velocity 2.076 mm/s RMS
- Bearing trend: Increasing on Motor DE (previous 0.396 → 0.445 → 1.083 g)
- Note: Motor NDE and fan end readings have historical gaps — most recent data points from prior period only on some channels
- Overall vibration: Good zone (2.08 mm/s RMS)
- Recommendation: Grease motor bearings. Continue close periodic monitoring.

---

## Good Condition Assets — Summary Notes

All 13 remaining assets in Good condition. No fault indications. Vibration and bearing trends consistent with historical baseline or trending favourably (Storm Water Pumps P01 and P02 trending down). Continue quarterly monitoring cycle.

---

## Key Diagnostic Notes for RAG

- Asset class: Centrifugal pumps (chemical transfer, chilled water, scrubber, storm water), centrifugal blower, air-cooled chiller compressors
- Primary fault types observed this survey: Bearing fault frequencies (BPFI/BPFO pattern) on motor bearings of Chilled Water Pump 01 and Scrubber Blower BL-04
- Both Alert assets show elevated bearing condition (demod/envelope) with normal overall velocity — classic early-stage bearing defect pattern: bearing damage present but not yet generating elevated vibration energy
- This pattern (high g, low mm/s) is diagnostically important: indicates bearing fault before it progresses to structural vibration
- ISO 10816-3 Class II thresholds applied (pumps on flexible mounts)
- Measurement axes: Horizontal, Vertical, Axial at motor NDE and DE; Horizontal, Vertical, Axial at pump DE and NDE where accessible
- Trend data: 3 readings available for most assets (Prev 2, Prev 1, Latest)

---

*Report anonymised for AxiomAnare KB ingestion. All client, site, and personnel identifiers removed. Asset tags and process area descriptors retained as diagnostically relevant context.*
