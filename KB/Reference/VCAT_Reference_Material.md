# Vibration Analysis Certification Reference Material
## KB/Reference/VCAT_Reference_Material.md

Source: Mobius Institute Board of Certification — CRMVA Certification Exam Reference Material (2024)
Document ID: CRMVA-2-ENG
Prepared for: AxiomAnare Knowledge Base

---

## 1. FFT Data Collection Formulas

### Waveform Collection Time
```
T = Ts × N = N / Fs = N / (2.56 × Fmax) = lines / Fmax
```
- T = Time required to collect the waveform (seconds)
- Ts = Time between each sample
- Fs = Sampling rate = Samples per second
- N = Number of samples (1024, 2048, 4096, etc.)
- Fmax = Maximum frequency of interest
- lines = Number of spectral lines

### Spectral Resolution
```
Resolution = Fmax / lines
```

### Bandwidth
```
Bandwidth = Resolution × Window factor
```
- Window factor = 1.0 (no window / uniform / rectangular)
- Window factor = 1.5 (Hanning window — most common in vibration analysis)

### Frequency Separation Requirements
- Separating frequency ≥ 2 × Bandwidth ≥ 2 × Resolution × Window factor
- Required spectral lines ≥ 2 × Window factor × Fmax / Separating frequency
- Accuracy of frequency (at peak) = ± ½ × Resolution

### Practical Notes
- Prime numbers for N: 1, 2, 3, 5, 7, 11, 13, 17, 19…
- More lines = better resolution but longer collection time
- Hanning window is standard for continuous vibration signals

---

## 2. Unit Conversions

### Imperial Units (D in mils pk-pk, V in in/sec pk, A in g rms, F in CPM)

| Convert from | Convert to | Formula |
|---|---|---|
| Vpk | Dpk-pk | Dpk-pk = 19098 × Vpk / fcpm |
| Arms | Vpk | Vpk = 5217 × Arms / fcpm |
| Arms | Dpk-pk | Dpk-pk = 9.958×10⁷ × Arms / fcpm² |
| Dpk-pk | Vpk | Vpk = fcpm × Dpk-pk / 19098 |
| Vpk | Arms | Arms = fcpm × Vpk / 5217 |
| Dpk-pk | Arms | Arms = fcpm² × Dpk-pk / 9.958×10⁷ |

### Metric Units (D in micron pk-pk, V in mm/sec rms, A in g rms, F in CPM)

| Convert from | Convert to | Formula |
|---|---|---|
| Vrms | Dpk-pk | Dpk-pk = 27009 × Vrms / fcpm |
| Arms | Vrms | Vrms = 93712 × Arms / fcpm |
| Arms | Dpk-pk | Dpk-pk = 2.53×10⁹ × Arms / fcpm² |
| Dpk-pk | Vrms | Vrms = fcpm × Dpk-pk / 27009 |
| Vrms | Arms | Arms = fcpm × Vrms / 93712 |
| Dpk-pk | Arms | Arms = fcpm² × Dpk-pk / 2.53×10⁹ |

**Key constants:** 1 inch = 25.4 mm | 1 mm = 0.039 inches | 1g rms = 9.8 m/sec²

---

## 3. ISO 20816-3 Vibration Severity Chart

### Machine Classification
- **Group 1:** Large machines, 300 kW < P < 50 MW, motors with shaft height ≥ 315 mm
- **Group 2:** Medium-sized machines, 15 kW < P ≤ 300 kW, motors with 160 mm ≤ H < 315 mm

### Foundation Classification
- **Rigid:** Lowest natural frequency of machine + support system exceeds main excitation frequency by ≥ 25%
- **Flexible:** All other support systems

### Velocity Zones (mm/s rms) — ISO 20816-3

| Zone | Description | Group 1 Rigid | Group 1 Flexible | Group 2 Rigid | Group 2 Flexible |
|------|-------------|---------------|------------------|---------------|------------------|
| A | New machine condition | ≤ 2.3 | ≤ 3.5 | ≤ 1.4 | ≤ 2.3 |
| B | Unlimited long-term operation | ≤ 4.5 | ≤ 7.1 | ≤ 2.8 | ≤ 4.5 |
| C | Short-term operation allowable | ≤ 11.0 | ≤ 11.0 | ≤ 7.1 | ≤ 7.1 |
| D | Vibration causes damage | > 11.0 | > 11.0 | > 7.1 | > 7.1 |

### Displacement Zones (μm rms) — ISO 20816-3

| Zone | Group 1 | Group 2 |
|------|---------|---------|
| A | ≤ 29 | ≤ 18 |
| B | ≤ 57 | ≤ 37 |
| C | ≤ 90 | ≤ 71 |
| D | > 90 | > 71 |

**Frequency range applies:** 10–1000 Hz (2–1000 Hz for Group 1, 600–120,000 rpm)

---

## 4. Transducer Selection Guide

### Transducer Types and Effective Frequency Ranges

| Transducer Type | Best For | Frequency Range |
|---|---|---|
| Piezo-electric accelerometer | High-frequency fault detection, bearing analysis | 0.5 Hz to 10,000 Hz (stud mounted) |
| Eddy-current proximity probe | Shaft relative displacement, journal bearings, low speed | DC to ~1,000 Hz |
| Electro-mechanical velocity transducer | Mid-frequency vibration, legacy systems | 10 Hz to ~1,000 Hz |

### Accelerometer Mounting — Effect on Frequency Response

| Mounting Method | Upper Frequency Limit (approx.) |
|---|---|
| Stud mount | ~10,000 Hz (best) |
| Adhesive pad | ~3,000 Hz |
| Flat surface magnet | ~6,200 Hz (372,000 cpm) |
| Curved surface magnet | ~5,600 Hz (336,000 cpm) |
| Hand-held probe / stinger | ~1,100 Hz (66,000 cpm) |

**Key principle:** The higher the frequency of interest, the more rigid the mounting required. Bearing fault frequencies typically require flat or stud mounting for reliable results.

### Transducer Operational Region Notes
- **Below electronic noise floor:** Signal too small to measure — increase sensitivity or proximity
- **Operational range:** Valid measurement region
- **Beyond amplifier voltage range:** Signal clipping — reduce sensitivity or increase range

---

## 5. Fault Pattern Spectra Library

### Imbalance
| Type | Dominant Frequencies | Direction | Phase |
|---|---|---|---|
| Static imbalance | 1X | Radial | 90° ± 30° between V and H |
| Couple imbalance | 1X | Radial | 90° ± 30° between V and H |
| Dynamic imbalance | 1X | Radial | 90° ± 30° between V and H |
| Overhung imbalance | 1X | Radial and Axial | — |
| Vertical machine imbalance | 1X | Radial | In-phase ± 30° |

### Misalignment
| Type | Dominant Frequencies | Direction |
|---|---|---|
| Angular misalignment | 1X, 2X, 3X | Axial |
| Parallel misalignment | 1X, 2X, 3X | Radial |
| Severe misalignment | 1X through 8X | Axial and Radial |
| Belt misalignment | 1X fan/motor | Axial |

### Looseness
| Type | Dominant Frequencies | Direction |
|---|---|---|
| Structural looseness | 1X | Radial |
| Pedestal looseness | 1X, 2X, 3X | Radial |
| Rotating looseness | 1X through 9X (many harmonics) | Radial |

### Other Mechanical Faults
| Fault | Dominant Frequencies | Notes |
|---|---|---|
| Bent shaft | 1X, 2X | Axial |
| Eccentricity | 1X fan + 1X motor | Radial |
| Resonance (at 1X) | 1X with sidebands | Resonance amplifies 1X |
| Belt wear | BR, 2BR, 3BR (belt rate) | Radial |
| Cavitation | 1X + broadband noise up to VP | Radial, high frequency |
| Flow turbulence | 1X + random noise around 1X | Radial |

### Gear Faults
| Fault | Dominant Frequencies | Notes |
|---|---|---|
| Tooth wear | GM (gear mesh), 2GM, 3GM + sidebands | Radial |
| Eccentricity / backlash | GM, 2GM, 3GM + 1X, Gnf sidebands | Radial |
| Gear misalignment | 2GM dominant + sidebands | Radial |
| Cracked/broken tooth | 1X with GM sidebands, Gnf | Radial, waveform impacting |
| Tooth load variations | GM, 2GM, 3GM + 1X, 2X sidebands | Radial |

*GM = Gear Mesh frequency = RPM/60 × number of teeth; Gnf = gear natural frequency*

### Electrical Faults (Motors)
| Fault | Dominant Frequencies | Notes |
|---|---|---|
| Broken/cracked rotor bars | 1X, 2X, 3X, 4X + PPF sidebands | Radial |
| Loose rotor bar joints | 1X + RBF, 2×LF sidebands | Radial |
| Eccentric rotor | 2×LF + PPF sidebands | Radial |
| Phase loss | 1X, 2X + SCR firing frequency | Radial |
| Shorted stator laminations | 2×LF dominant | Radial |
| Grounding / turning fault | 1X, LF + SCR firing frequency | Radial |
| Bearing fluting (electrical erosion) | BPFO between 100,000–180,000 CPM | Radial |
| Journal bearing looseness | 1X through 9X | Radial |
| Journal bearing oil whirl | 0.38X–0.48X + 1X | Radial |
| Loose stator coils | CPF + 1X sidebands | Radial |

*LF = Line frequency (50 or 60 Hz); PPF = Pole Pass Frequency = LF × slip × number of poles; RBF = Rotor Bar Frequency*

### Bearing Fault Stages
| Stage | Detection Method | Spectral Characteristics |
|---|---|---|
| Stage 1 (incipient) | Airborne ultrasound, Shock Pulse, PeakVue, Spike Energy, Envelope | Stress wave energy at 5 kHz–40 kHz; no velocity peaks yet |
| Stage 2 (minor damage) | Envelope/demodulation, acceleration spectrum | Bearing fault frequencies appear in high-frequency spectrum (1 kHz–5 kHz) |
| Stage 3 (moderate damage) | Velocity spectrum | BPFO/BPFI/BS appear in mid-frequency range with sidebands at 1X |
| Stage 4 (severe damage) | Velocity spectrum (low frequency) | Random broad-spectrum noise; fault frequencies may disappear as bearing disintegrates |

#### Stage 3 Spectral Patterns
- **Outer race fault (inner race rotating):** BPFO, 2×BPFO, 3×BPFO
- **Outer race fault (outer race rotating):** BPFO ± 1X sidebands, 2×BPFO ± 1X sidebands
- **Inner race fault (inner race rotating):** BPFI ± 1X sidebands, 2×BPFI ± 1X sidebands
- **Ball/roller fault:** BS ± FT sidebands, 2×BS ± FT, 3×BS ± FT (FT = fundamental train/cage frequency)

---

## 6. Trial Weight Calculation (Balancing)

```
W = F / (K × R × N²)
```
- W = Trial weight (kg)
- F = 10% of rotor mass divided by the number of bearings (kg)
- K = 0.011 (constant)
- N = RPM / 1000
- R = Radius at which weight is placed (cm)

---

## 7. Key Diagnostic Principles for RAG

- **1X dominant radially** = imbalance (rule out misalignment with phase check)
- **1X, 2X dominant axially** = angular misalignment or bent shaft
- **2X dominant radially** = parallel misalignment
- **Many harmonics (1X through 8X+)** = looseness or severe misalignment
- **Sub-synchronous (0.38X–0.48X)** = journal bearing oil whirl / instability
- **Gear mesh frequency + sidebands** = gear fault (sideband spacing identifies shaft)
- **BPFI/BPFO/BS in high-frequency range** = early bearing fault (Stage 1–2)
- **BPFI/BPFO/BS in velocity spectrum** = advanced bearing fault (Stage 3)
- **Broadband noise floor raised** = cavitation, flow turbulence, or Stage 4 bearing
- **2×LF electrical frequency** = electrical fault (stator, rotor, or eccentricity)
- **Ski-slope pattern** = bad measurement (loose sensor, cable fault) or very high amplitude low-frequency event

---

*Prepared for AxiomAnare Knowledge Base from Mobius Institute CRMVA Certification Exam Reference Material, 2024. Diagrams (fault pattern spectra, ISO severity charts, transducer curves) are image-based in the source document — key values transcribed above.*
