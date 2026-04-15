# Fault Signature Reference — Rotating Machinery
## AxiomAnare Internal Knowledge Base
### Source: AI Fault Content Reference (49 slides)

---

## Part 1 — Signature Analysis Principles

Vibration signature analysis examines which frequencies exist and their relationships to fundamental exciting frequencies. Key questions: what are the amplitudes of each peak, how do the peaks relate to each other, and if significant peaks are present, what is their source.

---

## Part 2 — Unbalance Fault Signatures

### Static / Force Unbalance
- Vibration frequency equals rotor speed (1X RPM dominant)
- Vibration predominantly radial in direction
- Stable vibration phase measurement
- Vibration increases as square of speed
- Vibration phase shifts in direct proportion to measurement direction
- Phase lag of approximately 90° at critical speed

### Couple Unbalance
- 180° out of phase on the same shaft
- 1X RPM always present and normally dominates
- Amplitude varies with square of increasing speed
- Can cause high axial as well as radial amplitudes
- Balancing requires correction in two planes at 180°

### Overhung Rotor Unbalance
- 1X RPM present in radial and axial directions
- Axial readings tend to be in-phase but radial readings might be unsteady
- Overhung rotors often have both force and couple unbalance, each of which may require correction

### Eccentric Rotor
- Largest vibration at 1X RPM in the direction of the centreline of the rotors
- Comparative phase readings differ by 0° or 180°
- Attempts to balance will cause a decrease in amplitude in one direction but an increase may occur in the other direction

---

## Part 3 — Misalignment Fault Signatures

### Angular Misalignment
- Characterised by high axial vibration
- 180° phase change across the coupling
- Typically high 1X and 2X axial vibration
- Not unusual for 1X, 2X or 3X RPM to dominate
- Symptoms could indicate coupling problems
- Frequency spectrum: 1X, 2X, 3X axial dominant

### Parallel (Offset) Misalignment
- High radial vibration 180° out of phase
- Severe conditions give higher harmonics
- 2X RPM often larger than 1X RPM
- Similar symptoms to angular misalignment
- Coupling design can influence spectrum shape and amplitude
- Frequency spectrum: 1X, 2X, 4X radial dominant

### Misaligned Bearing (Cocked Bearing)
- Vibration symptoms similar to angular misalignment
- Attempts to realign coupling or balance the rotor will not alleviate the problem
- Will cause a twisting motion with approximately 180° phase shift side to side or top to bottom
- Frequency spectrum: 1X, 2X, 3X axial dominant

---

## Part 4 — Shaft Faults

### Bent Shaft
- Bent shaft problems cause high axial vibration
- 1X RPM dominant if bend is near shaft centre
- 2X RPM dominant if bend is near shaft ends
- Phase difference in the axial direction will tend towards 180°
- Frequency spectrum: 1X and 2X axial dominant

---

## Part 5 — Mechanical Looseness Fault Signatures

### Mechanical Looseness Type A — Structural / Soft Foot
- Caused by structural looseness of machine feet
- Distortion of the base will cause soft foot problems
- Phase analysis will reveal approximately 180° phase shift in the vertical direction between the baseplate components of the machine
- Frequency spectrum: 1X RPM radial dominant

### Mechanical Looseness Type B — Pillow Block / Bearing Housing
- Caused by loose pillow block bolts
- Can cause 0.5X, 1X, 2X and 3X RPM
- Sometimes caused by cracked frame structure or bearing block
- Frequency spectrum: 0.5X (½), 1X, 2X, 3X radial

### Mechanical Looseness Type C — Rotating Looseness
- Phase is often unstable
- Will have many harmonics
- Can be caused by a loose bearing liner, excessive bearing clearance or a loose impeller on a shaft
- Frequency spectrum: 0.5X, 1X, 2X, 3X and multiple harmonics

---

## Part 6 — Rotor Rub

- Similar spectrum to mechanical looseness
- Usually generates a series of frequencies which may excite natural frequencies
- Subharmonic frequencies may be present
- Rub may be partial or through a complete revolution
- Truncated waveform visible in time domain
- Frequency spectrum: 0.5X, 1X, 2X, 3X, 4X with subharmonics

---

## Part 7 — Resonance

- Resonance occurs when the forcing frequency coincides with a natural frequency
- 180° phase change occurs when shaft speed passes through resonance
- High amplitudes of vibration will be present when a system is in resonance
- Amplitude peaks sharply at natural frequency; phase shifts 90° at resonance and approaches 180° above it

---

## Part 8 — Belt Drive Fault Signatures

### Belt Resonance (Type D)
- High amplitudes can be present if the belt natural frequency coincides with driver or driven RPM
- Belt natural frequency can be changed by altering the belt tension
- Frequency spectrum: 1X RPM with belt resonance frequency present

### Worn / Loose / Mismatched Belts (Type A)
- Often 2X RPM is dominant
- Amplitudes are normally unsteady, sometimes pulsing with either driver or driven RPM
- Wear or misalignment in timing belt drives will give high amplitudes at the timing belt frequency
- Belt frequencies are below the RPM of either the driver or the driven
- Frequency spectrum: belt frequency harmonics, 1X driven, 1X driver

### Belt / Pulley Misalignment (Type B)
- Pulley misalignment will produce high axial vibration at 1X RPM
- Often the highest amplitude on the motor will be at the fan RPM
- Frequency spectrum: 1X driver or driven, axial dominant

### Eccentric Pulleys (Type C)
- Eccentric or unbalanced pulleys will give a high 1X RPM of the pulley
- The amplitude will be highest in line with the belts
- Beware of trying to balance eccentric pulleys
- Frequency spectrum: 1X RPM of eccentric pulley, radial

---

## Part 9 — Hydraulic and Aerodynamic Forces

### Blade Pass / Vane Pass
- If gap between vanes and casing is not equal, Blade Pass Frequency (BPF) may have high amplitude
- High BPF may be present if impeller wear ring seizes on shaft
- Eccentric rotor can cause amplitude at BPF to be excessive
- BPF = Number of blades × RPM
- Frequency spectrum: 1X, 2X, BPF, 2×BPF with sidebands

### Flow Turbulence
- Flow turbulence often occurs in blowers due to variations in pressure or velocity of air in ducts
- Random low frequency vibration will be generated, possibly in the 50–2000 CPM range
- Frequency spectrum: random low frequency broadband, 1X, BPF

### Cavitation
- Cavitation will generate random, high frequency broadband energy superimposed with BPF harmonics
- Normally indicates inadequate suction pressure (NPSH)
- Erosion of impeller vanes and pump casings may occur if left unchecked
- Frequency spectrum: 1X, BPF, random high frequency broadband noise floor

---

## Part 10 — Beat Vibration

- A beat is the result of two closely spaced frequencies going into and out of phase
- The wideband spectrum will show one peak pulsating up and down
- The difference between the peaks is the beat frequency, which itself will be present in the wideband spectrum
- Zoom spectrum required to separate F1 and F2

---

## Part 11 — Electrical Fault Signatures

### Stator Eccentricity, Shorted Laminations and Loose Iron
- Stator problems generate high amplitudes at 2FL (2× line frequency)
- Stator eccentricity produces uneven stationary air gap; vibration is very directional
- Soft foot can produce an eccentric stator
- Line frequency FL: 50Hz = 3000 CPM; 60Hz = 3600 CPM

### Synchronous Motor — Loose Stator Coils
- Loose stator coils in synchronous motors generate high amplitude at Coil Pass Frequency
- The coil pass frequency will be surrounded by 1X RPM sidebands

### Power Supply Phase Problems — Loose Connector
- Phasing problems can cause excessive vibration at 2FL with 1/3 FL sidebands
- Levels at 2FL can exceed 25 mm/sec if left uncorrected
- Particular problem if the defective connector is only occasionally making contact

### DC Motor Problems
- DC motor problems can be detected by higher than normal amplitudes at SCR firing rate (6FL)
- These problems include broken field windings
- Fuse and control card problems can cause high amplitude peaks at frequencies of 1X to 5X line frequency

### Eccentric Rotor — Variable Air Gap
- Eccentric rotors produce a rotating variable air gap, inducing pulsating vibration
- Often requires zoom spectrum to separate 2FL and running speed harmonic
- Common values of pole pass frequency (FP) range from 20–120 CPM
- Pole pass frequency FP sidebands appear around 2FL

### Rotor Bar Problems
- 1X, 2X, 3X RPM with pole pass frequency sidebands indicates rotor bar problems
- 2X line frequency sidebands on rotor bar pass frequency (RBPF) indicates loose rotor bars
- Often high levels at 2X and 3X rotor bar pass frequency and only low level at 1X RBPF

### Key Electrical Frequencies
- Electrical line frequency FL = 50Hz (3000 CPM) or 60Hz (3600 CPM)
- Rotor Bar Pass Frequency (RBPF) = Number of rotor bars × Rotor RPM
- Synchronous speed Ns = 2×FL / P (where P = number of poles)
- Slip frequency Fs = Synchronous speed − Rotor RPM
- Pole pass frequency FP = Slip frequency × Number of poles

---

## Part 12 — Gear Fault Signatures

### Normal Gear Spectrum
- Normal spectrum shows 1X gear, 2X, 1X pinion and gear mesh frequency (GMF)
- GMF = Number of teeth × RPM
- GMF commonly will have sidebands of running speed
- All peaks are of low amplitude and no natural frequencies are present

### Gear Tooth Load
- Gear mesh frequencies are often sensitive to load
- High GMF amplitudes do not necessarily indicate a problem
- Each analysis should be performed with the system at maximum load

### Gear Tooth Wear
- Wear is indicated by excitation of natural frequencies along with sidebands of 1X RPM of the bad gear
- Sidebands are a better wear indicator than the GMF
- GMF may not change in amplitude when wear occurs

### Gear Eccentricity and Backlash
- Fairly high amplitude sidebands around GMF suggest eccentricity, backlash or non-parallel shafts
- The problem gear will modulate the sidebands
- Incorrect backlash normally excites gear natural frequency

### Gear Misalignment
- Gear misalignment almost always excites second order or higher harmonics with sidebands of running speed
- Small amplitude at 1X GMF but higher levels at 2X and 3X GMF
- Important to set Fmax high enough to capture at least 2X GMF

### Cracked / Broken Tooth
- A cracked or broken tooth will generate a high amplitude at 1X RPM of the gear
- It will excite the gear natural frequency which will be sidebanded by the running speed fundamental
- Best detected using the time waveform
- Time interval between impacts will be the reciprocal of the 1X RPM

### Hunting Tooth Frequency
- Hunting tooth frequency fHT = (GMF × Na) / (T_GEAR × T_PINION)
  where Na = number of assembly phases
- Vibration is at low frequency and can often be missed
- Synonymous with a growling sound
- The effect occurs when the faulty pinion and gear teeth both enter mesh at the same time

---

## Part 13 — Rolling Element Bearing Failure Stages

### Stage 1 — Earliest Detection (Ultrasonic Range)
- Earliest indications in the ultrasonic range (Zone D, above 120k CPM)
- Detected by Spike Energy (gSE), HFD(g) and Shock Pulse methods
- Spike Energy may first appear at approximately 0.25 gSE
- No bearing defect frequencies visible in normal spectrum yet

### Stage 2 — Natural Frequency Excitation
- Slight defects begin to ring bearing component natural frequencies
- These frequencies occur in the range of 30k–120k CPM (Zone C)
- At end of Stage 2, sideband frequencies appear above and below natural frequency
- Spike Energy grows to approximately 0.25–0.50 gSE

### Stage 3 — Bearing Defect Frequencies Appear
- Bearing defect frequencies (BPFO, BPFI, BSF, FTF) and harmonics appear in Zone B
- Many defect frequency harmonics appear; with wear the number of sidebands grows
- Wear is now visible and may extend around the periphery of the bearing
- Spike Energy increases to between 0.5–1.0 gSE

### Stage 4 — Pre-Failure (Imminent Failure)
- Discrete bearing defect frequencies disappear and are replaced by random broadband vibration (noise floor)
- Towards the end, even the amplitude at 1X RPM is affected
- High frequency noise floor amplitudes and Spike Energy may in fact decrease
- Just prior to failure gSE may rise to high levels
- Bearing replacement is urgent

### Rolling Element Bearing Defect Frequency Formulas
(shaft turning, outer race fixed)
- BPFI = (Nb/2) × (1 + (Bd/Pd) × cos θ) × RPM
- BPFO = (Nb/2) × (1 − (Bd/Pd) × cos θ) × RPM
- BSF = (Pd/(2×Bd)) × (1 − ((Bd/Pd) × cos θ)²) × RPM
- FTF = (1/2) × (1 − (Bd/Pd) × cos θ) × RPM

Where: Nb = number of balls, Bd = ball diameter, Pd = pitch diameter, θ = contact angle

---

## Part 14 — Oil Whirl and Oil Whip Instability

### Oil Whirl
- Usually occurs at 42–48% of running speed
- Vibration amplitudes are sometimes severe
- Whirl is inherently unstable, since it increases centrifugal forces therefore increasing whirl forces
- Caused by oil film instability in sleeve/journal bearings

### Oil Whip
- Oil whip may occur if a machine is operated at 2X the rotor critical frequency
- When the rotor drives up to 2X critical, whirl is close to critical and excessive vibration will stop the oil film from supporting the shaft
- Whirl speed will lock onto rotor critical — if the speed is increased the whip frequency will not increase

---

## Part 15 — Other Sources of High Axial Vibration
- Bent shafts
- Shafts in resonant whirl
- Bearings cocked on the shaft
- Resonance of some component in the axial direction
- Worn thrust bearings
- Worn helical or bevel gears
- A sleeve bearing motor hunting for its magnetic centre
- Couple component of a dynamic unbalance

