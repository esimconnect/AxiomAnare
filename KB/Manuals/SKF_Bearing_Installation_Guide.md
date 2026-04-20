# SKF Bearing Installation and Maintenance Guide — Knowledge Base Summary
## KB/Manuals/SKF_Bearing_Installation_Guide.md

Source: SKF Bearing Installation and Maintenance Guide (SKF USA Inc.)
Prepared for: AxiomAnare Knowledge Base

---

## 1. Overview and Purpose

This document distils the diagnostic and maintenance content from the SKF Bearing Installation and Maintenance Guide relevant to vibration analysis and condition monitoring. It covers bearing symptom diagnosis, trouble conditions, damage modes and their causes, lubrication guidelines, and mounting practices — all of which provide context for interpreting vibration signals and recommending corrective actions.

---

## 2. Common Bearing Symptoms and Causes

### Excessive Heat
**Lubrication causes:**
- Wrong lubricant type (incorrect NLGI grade or oil viscosity)
- Wrong lubrication system (static oil when circulating oil is required)
- Insufficient lubrication — low oil level, too little grease, excessive leakage
- Excessive lubrication — too much grease without opportunity to purge

**Fit and clearance causes:**
- Wrong internal clearance selection for the application
- Excessive shaft interference fit or oversized shaft diameter
- Excessive housing interference fit or undersized housing bore
- Bearing pinched due to out-of-round shaft or warped housing
- Excessive drive-up on tapered seat
- Large temperature difference between shaft and housing
- Stainless steel shaft expanding more than bearing steel

**Loading causes:**
- Rolling element skidding from insufficient load
- Excessive preload from bearing adjustment
- Bearings cross-located — shaft cannot expand thermally, inducing thrust loads
- Unbalanced rotor creating increased bearing load
- Overloaded bearings from changed application (e.g. coupling replaced with belt drive)
- Linear misalignment generating multiple load zones
- Angular misalignment generating rotating misalignment condition
- Bearing installed backwards

**Sealing causes:**
- Housing seals too tight or rubbing on components other than shaft
- Multiple seals in housing creating drag
- Misaligned housing seals
- Operating speed too high for contact seals
- Seals not properly lubricated (felt seals not oiled)
- Seals oriented to prevent grease purge

### Excessive Noise
**Metal-to-metal contact:**
- Oil film too thin (temperature too high, speed too slow)
- Insufficient lubrication (never lubricated, leakage from worn seals, grease incompatibility)
- Rolling elements skidding (inadequate load, lubricant too stiff)

**Contamination:**
- Solid particle contamination denting rolling surfaces
- Solids remaining in housing from manufacturing or previous bearing failure
- Liquid contamination reducing lubricant viscosity

**Looseness:**
- Inner ring turning on shaft (undersized or worn shaft)
- Outer ring turning in housing (oversized or worn housing bore)
- Locknut loose on shaft or tapered sleeve
- Bearing not clamped securely against mating components
- Excessive radial or axial internal clearance

**Surface damage:**
- Rolling surfaces dented from impact or shock loading
- False brinelling from static vibration
- Spalling from fatigue
- Spalling from surface-initiated damage
- Static etching from chemical or liquid contamination
- Particle denting from solid contamination
- Fluting from electric arc discharge
- Pitting from moisture or electric current

**Rubbing:**
- Misaligned housing seals rubbing
- Bent locknut tabs rubbing against seals or cage
- Adapter sleeve not properly clamped, turning on shaft
- Spacer rings not properly clamped, turning relative to bearing face

### Excessive Vibration
- Rolling elements skidding (inadequate load, lubricant too stiff)
- Solid particle contamination denting rolling surfaces
- Inner ring loose on shaft
- Outer ring loose in housing
- All surface damage modes listed above
- Wear from ineffective lubrication
- Smearing damage from rolling element skidding

### Excessive Shaft Movement
- Inner ring loose on shaft (undersized or worn)
- Outer ring excessively loose in housing (oversized or worn bore)
- Bearing not properly clamped
- Rolling surface spalling from fatigue or surface damage
- Wear from ineffective lubrication
- Wrong clearance selected for application

### Excessive Torque to Rotate Shaft
- Preloaded bearing from excessive shaft/housing fits
- Bearing pinched in out-of-round or warped housing
- Excessive drive-up on tapered seat
- Temperature differential causing housing to be cooler than shaft
- Sealing drag (seals too tight, misaligned, multiple seals)
- Rolling surface spalling
- Fluting from electric arcing
- Shaft/housing shoulders out of square
- Shaft shoulder too large, rubbing against seals or shields

---

## 3. Bearing Damage Modes and Causes

### Pre-Operational Damage (occurs before machine runs)
These are caused by improper handling, storage, or installation:

| Damage Mode | Typical Cause | Vibration Signature |
|---|---|---|
| False brinelling | Static vibration during transport or storage | Elevated 1X, sub-harmonics; visible wear marks at ball spacing |
| Indentation / denting | Impact during handling, incorrect mounting tools | Elevated bearing fault frequencies; noise |
| Misassembly | Incorrect fitting, bearing installed backward | Incorrect load distribution; premature BPFI/BPFO |
| Contamination (installation) | Dirty workspace, damaged packaging | Elevated broadband noise; early particle-induced spalling |
| Corrosion (storage) | Improper packaging, moisture ingress | Pitting signature in envelope spectrum |

### Operational Damage (occurs during service)
| Damage Mode | Root Cause | Vibration Signature |
|---|---|---|
| Rolling contact fatigue / spalling | Overload, inadequate lubrication, contamination, incorrect fit | Classic BPFO/BPFI/BS progression through stages 1–4 |
| Abrasive wear | Contaminated lubricant, solid particles | Broadband noise floor raised; gradual loss of bearing fault frequency clarity |
| Adhesive wear / smearing | Lubricant film breakdown, roller skidding | Elevated temperatures; smeared surfaces; broadband noise |
| Fretting | Micro-motion at interference fit surfaces | 1X sidebands around bearing fault frequencies; reddish-brown debris |
| Corrosion (operational) | Water ingress, acid contamination | Pitting in demodulated spectrum; irregular BPFO spacing |
| Electric fluting | Stray electrical current through bearing | Regular ridges on raceway; BPFO at very high frequency (100,000–180,000 CPM) |
| Thermal damage / overheating | Lubricant failure, excessive speed, insufficient clearance | Discolouration; eventually loss of preload; elevated temperatures |

---

## 4. Loading Patterns and Their Diagnostic Significance

**Point load (stationary ring):** Load concentrated in one zone — wear pattern is localised. Outer race with fixed housing = point load on outer race. Produces clear BPFO harmonics.

**Circumferential load (rotating ring):** Load rotates around the ring — wear is distributed. Rotating inner ring under radial load = circumferential load on inner ring. Produces BPFI with 1X sidebands.

**Diagnostic implication:** BPFI sidebands at 1X are expected and normal for a rotating inner ring under radial load. Their absence when BPFI is elevated can indicate the inner ring is not rotating freely.

---

## 5. Lubrication — Key Points for Condition Monitoring

### Grease Selection
- Standard industrial recommendation: lithium-base NLGI Grade 2, oil viscosity 150–220 cSt at 40°C
- For high temperature (>93°C / 200°F): consult manufacturer
- For low temperature (<0°C / 32°F): lower viscosity grade required
- Grease incompatibility between different base types can cause lubrication failure — always verify compatibility before adding grease

### Relubrication Intervals
Intervals depend on: bearing size, speed, temperature, orientation, and environment. Key adjustment factors:
- Vertical shaft: halve the interval
- High contamination environment: halve the interval
- Temperature 70–80°C: halve the interval
- Temperature >80°C: quarter the interval
- Speed >50% of speed rating: reduce interval

### Grease Relubrication Procedure
1. Clean grease nipple before greasing
2. Add grease slowly while bearing is running (if safe to do so)
3. Allow grease to purge from drain plug for 1–2 hours before resealing
4. Temperature will rise temporarily during relubrication then return to normal — this is expected
5. If temperature does not return to normal, bearing may be over-greased or have another fault

### Lubrication-Related Vibration Signatures
| Condition | Vibration Indicator |
|---|---|
| Under-lubrication | High broadband noise floor; elevated bearing temperatures; rapid progression through fault stages |
| Over-greasing | Temperature spike; possible seal damage; bearing churning |
| Grease degradation | Gradual increase in bearing fault frequency amplitude over weeks/months |
| Contaminated grease | Elevated broadband noise; rapid onset of particle denting (BPFO/BPFI at irregular amplitudes) |
| Wrong viscosity | Metal-to-metal contact noise; elevated temperatures at low speed (too thin) or high torque (too thick) |

---

## 6. Mounting — Key Points Affecting Vibration

### Fit Selection Impact
- **Too loose (shaft undersize):** Inner ring creep — generates 1X sidebands, fretting debris, unpredictable fault frequency amplitudes
- **Too tight (shaft oversize):** Reduced internal clearance — higher contact stress, elevated temperatures, premature fatigue spalling
- **Housing too tight:** Outer ring squeezed — reduced clearance, higher loads, noise and heat
- **Housing too loose:** Outer ring rotation — 1X modulation of all bearing frequencies, fretting at interface

### Critical Mounting Rules
- Never apply force through rolling elements — always press on the ring being fitted
- Cold mounting acceptable for small bearings (< 50mm bore) with light interference fits
- Heat mounting: maximum 110°C / 230°F for general bearings; never exceed 125°C / 260°F
- Induction heaters preferred — avoid open flame (risk of localised overheating and metallurgical damage)
- After mounting, verify bearing runs freely and smoothly — any roughness suggests contamination or damage

### Misalignment Limits
- Most spherical roller bearings and CARB bearings accommodate up to 0.5°–1.5° misalignment
- Angular contact bearings are sensitive to misalignment — exceeding limits generates BPFI/BPFO with strong 1X sidebands
- Seal misalignment limits are typically more restrictive than bearing misalignment limits (0.1°–0.5° depending on seal type)

---

## 7. Troubleshooting Decision Guide

| Observed Symptom | First Check | Second Check | Third Check |
|---|---|---|---|
| High temperature + good vibration | Lubrication | Seal friction | Clearance/fit |
| High vibration + normal temperature | Balance/alignment | Looseness | Bearing fault frequencies |
| High vibration + high temperature | Bearing fault | Lubrication failure | Fit/clearance |
| Noise without vibration alarm | Early bearing fault (Stage 1–2) | Looseness | Contamination |
| Rapid fault progression | Contamination | Lubrication failure | Overload |
| Irregular fault frequency spacing | Contamination damage | False brinelling | Manufacturing defect |

---

## 8. Diagnostic Connection to Vibration Analysis

The SKF damage taxonomy directly maps to vibration analysis findings:

| SKF Damage Category | Vibration Analysis Indicator | AxiomAnare Action |
|---|---|---|
| Rolling contact fatigue | BPFO/BPFI/BS stage progression | Track trend; escalate zone as stage advances |
| Abrasive contamination | Broadband noise + irregular fault peaks | Investigate sealing and lubricant contamination |
| Electric fluting | BPFO at very high frequency (100k–180k CPM) | Check earthing; install shaft grounding |
| Fretting (inner ring creep) | 1X sidebands on all bearing frequencies | Check shaft fit; inspect for fretting debris |
| False brinelling | Ball-spacing indentations; elevated fault frequencies | Identify static vibration source; improve isolation |
| Overloading | Rapid fault progression | Review application loads; check for misalignment/imbalance contribution |

---

*Prepared for AxiomAnare Knowledge Base from SKF Bearing Installation and Maintenance Guide. Content selected for diagnostic relevance to vibration analysis and condition monitoring. Detailed fit tables, mounting torque values, and dimensional data are in the source document.*
