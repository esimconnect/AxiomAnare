# Vibration Spectrum FFT Analysis Report
## Report_007 — Pharmaceutical Plant, Air Handling Units (24 units), Apr 2023

**Anonymised for AxiomAnare Knowledge Base**
Anonymisation key: [CLIENT] = client organisation | [SITE-A] = plant site | [SITE ADDRESS] = site address | [CLIENT CONTACT] = client representative | [SERVICE PROVIDER] = vibration analysis contractor | [REPORT-REF] = report reference number

---

## Overview

- **Asset type:** Air Handling Units (plug fan configuration)
- **Asset count:** 24 units
- **Site:** [SITE-A] — pharmaceutical manufacturing facility
- **Date of measurement:** Apr 2023
- **Measurement frequency:** Monthly
- **Standard applied:** ISO 10816-3, Class II
- **Instrumentation:** Commtest Vb5, ICP Accelerometer 100mV/g, 4x Permanent Mounted IEPC Vibration Sensors
- **Channels measured per asset:** Motor NDE, Motor DE, Fan DE, Fan NDE (radial, horizontal, vertical, axial as applicable)
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
| 1 | SG00134501AHU01 | Weighing/Dispensing | 0.91 | 0.52 | Good | None |
| 2 | SG00134502AHU02 | CCIP | 3.9 | 0.82 | Warning | Abnormal FFT and waveform detected on motor NDE |
| 3 | SG00134503AHU03 | Initial Purification | 2.43 | 2.3 | Alert (bearing) | Motor bearing fault frequencies detected |
| 4 | SG00134504AHU04 | Final Purification | 5.65 | 0.84 | Warning | Unbalance and misalignment signals detected |
| 5 | SG00134505AHU05 | General Corridor | 2.84 | 0.32 | Good | None |
| 6 | SG00134506AHU06 (Supply) | Logistics Corridor Supply | 3.4 | 0.68 | Warning | Unbalance and misalignment detected |
| 7 | SG00134506AHU06 (Return) | Logistics Corridor Return | 3.82 | 0.33 | Warning | Misalignment detected |
| 8 | SG00134507AHU07A | Pre-cooler AHU A | 3.87 | 0.50 | Warning | Unbalance and misalignment detected |
| 9 | SG00134507AHU07B | Pre-cooler AHU B | 6.42 | 0.61 | Warning | Unbalance and misalignment, trend increasing |
| 10 | SG00134508AHU08 | QC Lab / Raw Material Testing | 4.8 | 0.38 | Warning | Misalignment detected, trend decreasing |
| 11 | SG00134509AHU09 | Office Area and Cafeteria | 3.31 | 0.22 | Warning | Misalignment detected, trend increasing |
| 12 | SG00134510AHU10 | Sampling Area | 0.80 | 0.53 | Good | None |
| 13 | SG00134511AHU11 | Warehouse | 4.56 | 0.46 | Warning | Unbalance and misalignment, trend increasing |
| 14 | SG00134512AHU12 | Microbiology Lab | 3.86 | 0.44 | Warning | Misalignment and motor unbalance detected |
| 15 | SG00134513AHU13 | Non-GMP Warehouse / Workshop | 5.4 | 0.50 | Warning | Misalignment detected |
| 16 | SG00134521AHU21 | Solution Prep | 2.48 | 0.60 | Good | None |
| 17 | SG00134521 CCF02 | Cooling Coil Fan 02 | 14.22 | 0.71 | **Danger** | Misalignment and beat frequencies |
| 18 | SG00134521 CCF03 | Cooling Coil Fan 03 | 7.28 | 0.62 | Alert | Misalignment and beat frequencies |
| 19 | SG00134521 CCF04 | Cooling Coil Fan 04 | 17.86 | 0.45 | **Danger** | Misalignment and beat frequencies |
| 20 | SG00134521 CCF05 | Cooling Coil Fan 05 | 5.95 | 0.32 | Warning | Misalignment and beat frequencies |
| 21 | SG00134522AHU22 | Inoculation Lab | 1.13 | 0.28 | Good | None |
| 22 | SG00177011H01 | Solution Prep DFB | 1.24 | 0.05 | Good | None |
| 23 | SG00177012H01 | Solution Prep DFB | 0.88 | 0.06 | Good | None |
| 24 | SG00177014H01 | Warehouse DFB | 1.86 | 0.06 | Good | None |

---

## Detailed Findings by Condition Zone

### Danger Condition Assets

**SG00134521 Cooling Coil Fan 02** — Overall: 14.22 mm/s RMS
- Fault: Misalignment and beat frequency signals detected
- Trend: Overall vibration decreasing from previous reading (18.17 → 14.22 mm/s) but remains in Danger zone
- Measurement data: Motor DE Radial 14.22 mm/s RMS; Fan DE Radial 12.48 mm/s RMS; Fan NDE Radial 8.22 mm/s RMS
- Bearing condition: Good (< 1g RMS all locations)
- Recommendation: Inspect pulley alignment, belt tension, structural looseness

**SG00134521 Cooling Coil Fan 04** — Overall: 17.86 mm/s RMS
- Fault: Misalignment and beat frequency signals detected
- Trend: Consistent with previous readings (18.37 → 17.86 mm/s), persistent Danger zone
- Measurement data: Motor DE Radial 9.61 mm/s RMS; Fan DE Radial 17.86 mm/s RMS; Fan NDE Radial 8.56 mm/s RMS
- Bearing condition: Good (< 1g RMS all locations)
- Recommendation: Inspect pulley alignment, belt tension, structural looseness

### Alert Condition Assets

**SG00134503AHU03 Initial Purification** — BC: 2.3 g RMS (Alert)
- Fault: Bearing fault frequencies detected on motor
- Bearing readings: Motor NDE Vertical 1.302 g RMS; Motor DE Horizontal 2.304 g RMS
- Overall vibration within acceptable range (2.43 mm/s RMS)
- Trend: Bearing condition consistent with previous readings
- Recommendation: Grease motor bearings. Replace motor bearings at next available shutdown. Continue close monitoring.

**SG00134521 Cooling Coil Fan 03** — Overall: 7.28 mm/s RMS (Alert)
- Fault: Misalignment and beat frequency signals detected
- Trend: Consistent with previous readings
- Measurement data: Motor NDE 3.11 mm/s RMS; Motor DE 3.98 mm/s RMS; Fan DE 6.60 mm/s RMS; Fan NDE 7.28 mm/s RMS
- Recommendation: Inspect pulley alignment, belt tension, structural looseness

### Warning Condition Assets (Summary)

Fourteen assets in Warning zone, all with Overall Vibration 3.16–7.00 mm/s RMS and Good bearing condition. Primary fault indications:
- **Misalignment** (pulley/belt systems): AHU02, AHU06 Return, AHU08, AHU09, AHU12, AHU13
- **Unbalance + Misalignment** (combined): AHU04, AHU06 Supply, AHU07A, AHU07B, AHU11
- **Abnormal FFT/Waveform** (unspecified, monitor): AHU02 Motor NDE
- Consistent recommendation for all: inspect pulley alignment, belt tension, structural looseness; continue periodic monitoring

### Good Condition Assets

Six assets in Good zone: AHU01, AHU05, AHU10, AHU21, CCF05 (trending down), H01×3. All bearing and overall vibration readings stable, consistent with historical baseline.

---

## Key Diagnostic Notes for RAG

- Asset class: Belt-driven plug fans (AHU), direct-drive fan coil units (CCF), dual-fan blower units (H01)
- Primary fault types observed this survey: Misalignment (pulley/belt), Unbalance, Bearing fault frequencies (BPFI/BPFO pattern on AHU03 motor)
- Cooling Coil Fans 02 and 04 at Danger level — beat frequency pattern consistent with resonance between misaligned belt drive harmonics and structural natural frequency
- ISO 10816-3 Class II thresholds applied (equipment on flexible mounts, 15–75 kW range)
- Sensor type: Demod (envelope/bearing) + Velocity spectrum (overall), 4 measurement points per asset
- Sample rate: 12 kHz (standard for AHU fan class)
- Trend data available for 3 readings (Prev 2, Prev 1, Latest)

---

*Report anonymised for AxiomAnare KB ingestion. All client, site, and personnel identifiers removed. Asset tags and process area descriptors retained as diagnostically relevant context.*
