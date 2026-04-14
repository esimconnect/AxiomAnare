# Vibration Analysis Reference
## AxiomAnare Internal Knowledge Base
*KB/Reference — Internal use only. Do not commit to public repository.*

---

## PART 1 — TERMINOLOGY AND CONCEPTS

This section provides working definitions of vibration analysis terms as used in rotating machinery condition monitoring. Definitions are written for use in AI-assisted diagnostic reasoning.

---

### Acceleration
Rate of change of velocity with respect to time. In vibration measurement, acceleration is typically expressed in gravitational units (g) or metres per second squared (m/s²). The standard gravitational constant is 1g = 9.80665 m/s² = 386.089 in/s². Acceleration is the primary measurement domain for high-frequency phenomena such as bearing defect frequencies. Integration of acceleration yields velocity; double integration yields displacement.

### Accelerometer
A transducer whose electrical output is proportional to the acceleration of the surface to which it is mounted. Piezoelectric ICP (Integrated Circuit Piezoelectric) accelerometers are the standard for general rotating machinery vibration measurement. The transducer converts mechanical force on an internal crystal element into an electrical charge, which is amplified and output as a voltage signal. This signal can be displayed as a time waveform or transformed into a frequency spectrum via FFT. High-frequency response is bounded by the accelerometer's internal mechanical resonance frequency. Most industrial accelerometers respond from 1–2 Hz upward. The output can be integrated electronically or mathematically to produce velocity or displacement representations.

### Accuracy
The degree to which a measurement result agrees with the true value of the quantity being measured. Distinct from repeatability — an instrument can be repeatable but inaccurate if it has a systematic bias.

### A/D Converter (Analog-to-Digital Converter)
An electronic device that converts a continuous analog voltage or current signal into a discrete digital representation. Sampling rate and bit depth of the A/D converter govern the quality and frequency range of the digitised vibration signal.

### Aliasing
A signal processing artefact that occurs when a signal is sampled at less than twice the frequency of its highest component (violating the Nyquist criterion). Aliasing causes high-frequency content to appear at incorrectly low frequencies in the spectrum, corrupting diagnostic results. Prevented by applying an anti-aliasing low-pass filter prior to sampling, set at less than half the sampling frequency.

### Alignment
The condition in which the centrelines of coupled rotating shafts are coincident, parallel, or perpendicular as required by design. Misalignment — where this geometric condition is not achieved — is one of the most common fault conditions in rotating machinery and produces elevated 1X and 2X vibration in radial and axial directions. Correcting misalignment reduces vibration levels and extends bearing life.

### Amplification Factor (Synchronous)
A dimensionless measure of a rotor's sensitivity to vibration at a resonant speed. Calculated as the ratio of vibration amplitude at the resonant peak to the amplitude well above resonance on a Bode plot. A high amplification factor indicates low damping and high risk of vibration amplification when the machine passes through critical speed.

### Amplitude
The magnitude of a vibration signal, expressed as displacement (peak-to-peak, in µm or mils), velocity (peak, in mm/s or in/s), or acceleration (RMS, in g or m/s²). The dominant convention in ISO 10816-3 and routine machinery monitoring is velocity RMS for broadband severity assessment. Displacement peak-to-peak is preferred for low-speed machines. Acceleration RMS is preferred for bearing and high-frequency analysis.

- **Peak value:** Maximum excursion from the zero line in one direction
- **Peak-to-peak value:** Total excursion from the maximum positive to maximum negative peak; used as standard for displacement reporting
- **RMS value:** Root Mean Square — the square root of the time-averaged squared signal. For a pure sine wave, RMS = 0.707 × peak. For complex waveforms, RMS must be measured directly. RMS is the accepted convention for acceleration in vibration analysis.

### Angular Frequency (ω)
Torsional vibration frequency expressed in radians per second or hertz. Also called circular frequency. ω = 2πf, where f is frequency in Hz.

### Anti-Aliasing Filter
A low-pass filter applied before the A/D converter to remove frequency content above half the sampling rate, preventing aliasing artefacts in the digitised spectrum.

### Asynchronous
Vibration components whose frequencies are not integer multiples of the shaft rotational frequency. Asynchronous components indicate faults such as rolling element bearing defects, cavitation, or fluid instability. Also referred to as non-synchronous.

### Auto Spectrum (Power Spectrum)
A frequency domain representation of signal power at each frequency, computed from the squared magnitude of the FFT. Phase information is discarded. Produced by RMS averaging. Used as the standard spectrum display in vibration monitoring software.

### Auto Spectral Density (ASD) / Power Spectral Density (PSD)
A measure of vibration power per unit frequency bandwidth (g²/Hz or m²/s³). The area under the ASD curve equals the mean-square (gRMS²) of the measured acceleration. Used in random vibration analysis and broadband energy characterisation.

### Averaging
The process of collecting and combining multiple time records or spectra to improve signal quality. **Linear spectrum averaging** adds successive spectra and divides by the count, smoothing random noise and improving the visibility of discrete frequency components. It does not reduce the noise floor but makes peaks stand out more clearly. **Time domain averaging** (synchronous averaging) requires a tachometer reference and is used to suppress asynchronous components from interfering sources. Critical for low-frequency measurements where long averaging times are required for statistical accuracy.

### Axial
In the direction parallel to the shaft centreline. Axial vibration measurements are essential for diagnosing misalignment, bent shaft, and cocked bearing conditions. Excessive axial vibration relative to radial vibration is a key diagnostic indicator.

---

### Balance
The condition in which the mass centreline and the rotational centreline of a rotor are coincident. A balanced rotor generates minimal centrifugal forces at its bearings during rotation.

### Balancing
The process of redistributing mass on a rotating component to reduce the centrifugal forces acting on bearings. Effective balancing reduces 1X vibration levels, extends bearing life, reduces power consumption, and reduces structural loading.

### Band Alarm (Spectral Band Alarm)
A monitoring strategy in which warning and danger amplitude thresholds are applied to defined frequency bands within a vibration spectrum. Bands are typically set around key forcing frequencies: 1X, 2X, 3X–6X running speed, bearing defect frequencies, blade pass, and gearmesh. Band alarms allow fault-specific alerting.

### Baseline Spectrum
A reference vibration spectrum recorded from a machine in confirmed healthy condition, ideally immediately after commissioning or following a major overhaul. The baseline is used for trend comparison over the machine's service life. Deviation from baseline — particularly the emergence of new spectral peaks or growth in known peaks — is the primary indicator of developing faults.

### Beats / Beat Frequency
A periodic amplitude modulation in the time waveform resulting from the superposition of two signals at slightly different frequencies. The beat frequency equals the absolute difference between the two source frequencies. Commonly observed between machines running at nearly the same speed or between mains electrical frequency and running speed harmonics.

### Blade Pass Frequency (BPF) / Vane Pass Frequency (VPF)
A forcing frequency generated by bladed or vaned rotating components (fans, pumps, compressors, turbines). Calculated as: BPF = number of blades (or vanes) × shaft rotational frequency (Hz). Elevated BPF amplitude indicates hydraulic or aerodynamic instability, unequal blade spacing, or gap problems between rotating and stationary components. See also: Pumps/Fans — Blade/Vane Pass in the Fault Patterns section.

### Broadband (Overall) Level
A single vibration amplitude value representing the total vibration energy across a wide frequency range (typically 10 Hz to 1,000 Hz or similar). Used for ISO 10816-3 zone classification (A/B/C/D). Broadband overall level is the primary parameter for pass/fail severity assessment. It does not identify the source of vibration — frequency analysis is required for fault classification.

### Bump Test (Impact Test)
A test in which a controlled mechanical impact is applied to a structure, exciting its natural frequencies across a broad frequency range. The resulting response spectrum reveals the natural frequencies of the structure. Used to identify resonances that could be excited by machinery forcing frequencies.

---

### Calibration
Verification and adjustment of a measurement instrument against a known reference standard. For vibration transducers, calibration typically involves exciting the sensor with a known sinusoidal motion on a calibration shaker and verifying the electrical output.

### Cavitation
A hydraulic phenomenon occurring in pump suction or impeller regions where localised low pressure causes liquid to vaporise, forming vapour bubbles. Bubble collapse generates broadband high-frequency noise and vibration, causing elevated noise floor in the high-frequency region of the spectrum. In severe cases, it causes structural damage to impeller and casing surfaces. Spectral signature: broadband noise floor elevation biased toward higher frequencies, often accompanied by a vane pass peak.

### Coherence
In dual-channel vibration analysis, the ratio of coherent output power to total output power between two measurement channels. A coherence value close to 1.0 at a given frequency confirms a genuine cause-effect relationship between the two measurement points. Used to confirm structural force transmission paths and identify measurement noise.

### Condition Monitoring
The ongoing measurement, recording, and analysis of machinery parameters (vibration, temperature, lubrication condition, etc.) to track machine health and detect developing faults before failure. Vibration-based condition monitoring compares current spectra with baseline references and trend data to identify deteriorating conditions.

### Crest Factor
The ratio of the peak value to the RMS value of a vibration signal. For a pure sine wave, crest factor = 1.414. As bearing damage develops, impulsive events raise the peak value while the RMS remains relatively low in early stages, producing an elevated crest factor. A crest factor above 3–4 is typically considered indicative of impulsive events such as early bearing defects. Note: In late-stage bearing failure, the noise floor rises and both peak and RMS increase together, which can cause the crest factor to normalise despite severe damage.

### Critical Speed
The rotational speed at which the shaft excitation frequency coincides with a structural or rotor natural frequency, producing resonance. Machines accelerating through or operating at critical speed experience amplified vibration. For flexible rotors, critical speeds occur below maximum operating speed. For rigid rotors, critical speeds are above maximum operating speed.

---

### Damping
The mechanism by which vibrational energy is dissipated, progressively reducing oscillation amplitude. In rotating machinery, damping is provided by bearings, seals, and structural joints. Damping is characterised by the damping ratio (fraction of critical damping). Low damping systems exhibit sharp, high-amplitude resonance peaks. High damping systems have broad, low-amplitude resonance responses. Damping converts mechanical vibration energy into heat.

### Decibel (dB)
A logarithmic ratio used to express vibration level relative to a reference value. In vibration: AdB = 20 log(A/A_ref) for acceleration; VdB = 20 log(V/V_ref) for velocity. A 6 dB increase represents a doubling of amplitude; a 20 dB increase represents a tenfold amplitude increase. Common reference values: acceleration = 3.861 × 10⁻⁴ in/s² RMS; velocity = 5.568 × 10⁻⁷ in/s peak.

### Demodulation (Enveloping)
A signal processing technique used to detect and quantify bearing defect frequencies. The raw vibration signal is passed through a high-pass filter (to remove low-frequency shaft and imbalance content), then rectified, then low-pass filtered. The resulting envelope signal reveals the repetition rate of impulsive events — specifically the bearing defect frequencies (BPFI, BPFO, BSF, FTF). The envelope spectrum displays peaks at bearing defect frequencies and their harmonics. Demodulation is the most sensitive technique for early-stage rolling element bearing fault detection, effective when broadband vibration levels have not yet increased noticeably.

### Degrees of Freedom (DOF)
The number of independent coordinates required to fully describe the motion state of a vibrating system. A simple spring-mass system has one DOF. Real machinery structures have multiple DOF, each associated with a distinct natural frequency and mode shape.

### Differentiation
A mathematical operation that produces the rate of change of a signal with respect to time. In vibration analysis: differentiating velocity produces acceleration; differentiating displacement produces velocity. In a spectrum analyser, differentiation multiplies spectral amplitude by 2πf (angular frequency). Used when converting between measurement domains.

### Discrete Fourier Transform (DFT) / Fast Fourier Transform (FFT)
A mathematical algorithm that transforms a sampled time domain signal into its frequency domain representation, expressing the signal as a sum of sinusoidal components at discrete frequencies. Each line of the resulting spectrum represents the amplitude and phase of a specific frequency component. The FFT is an efficient computational implementation of the DFT. It is the primary tool for machinery vibration spectrum analysis.

### Displacement
The physical distance a vibrating surface moves from its rest position. Expressed in micrometres (µm) or mils (thousandths of an inch) peak-to-peak. Displacement is most relevant for low-speed rotating machinery (below approximately 600 RPM) where ISO 10816 references displacement limits. 1 mil = 25.4 µm.

---

### Eccentricity (Mechanical)
The variation in outer diameter of a shaft surface relative to the true geometric centreline. Also called out-of-roundness. Eccentricity in rotors and sheaves (pulleys) produces strong 1X radial vibration that mimics imbalance but cannot be corrected by balancing alone.

### Enveloping
See Demodulation.

---

### Fast Fourier Transform (FFT)
See Discrete Fourier Transform.

### Filter
An electronic or digital device that passes or rejects specific frequency bands. Types relevant to vibration analysis:
- **Low-pass filter:** Passes frequencies below a cutoff; rejects high frequencies. Used in anti-aliasing and demodulation low-pass stage.
- **High-pass filter:** Passes frequencies above a cutoff; rejects low frequencies. Used in demodulation to isolate bearing-related signal content.
- **Band-pass filter:** Passes a defined frequency band; rejects content outside.
- **Band-stop filter:** Rejects a defined frequency band; passes content outside.

### FMAX
The maximum frequency limit of a vibration spectrum or measurement. Determines the upper bound of the frequency range captured. Must be set high enough to include all relevant forcing frequencies (bearing defect frequencies, blade pass, gearmesh, etc.).

### FMIN
The minimum frequency limit of a vibration spectrum. Typically set at or near 0 Hz for general machinery monitoring.

### Forcing Frequency
The frequency at which a dynamic force is applied to a mechanical structure. In rotating machines, forcing frequencies are determined by machine geometry and speed: running speed (1X), harmonics (2X, 3X...), bearing defect frequencies, gearmesh frequency, blade pass frequency. When a forcing frequency coincides with a structural natural frequency, resonance occurs and vibration amplitude is amplified significantly.

### Frequency
The number of complete oscillation cycles per unit time. SI unit: hertz (Hz) = cycles per second. Also expressed as cycles per minute (cpm), where 1 Hz = 60 cpm. In rotating machinery monitoring, frequency is commonly related to shaft rotational speed: 1X = running speed fundamental; 2X = twice running speed; etc. For a machine running at N RPM, shaft frequency = N/60 Hz.

### Frequency Domain
A representation of a signal in which amplitude is plotted against frequency (X axis = frequency, Y axis = amplitude). Enables identification of discrete frequency components and their amplitudes. The FFT spectrum is a frequency domain representation.

### Frequency Resolution
The minimum spacing between adjacent data points in a spectrum. Calculated as: Resolution = (FMAX − FMIN) / Number of Lines. Higher resolution (more lines) enables better separation of closely spaced frequency components but requires longer measurement time. Typical settings: 400, 800, 1600, or 3200 lines.

### Fundamental Frequency
The lowest frequency in a harmonic series. In rotating machinery, the fundamental is typically the shaft rotational frequency (1X). A harmonic series consists of the fundamental plus integer multiples: 1X, 2X, 3X, etc. The fundamental may be suppressed in some fault patterns while harmonics remain prominent.

---

### Gear Mesh Frequency (GMF)
A forcing frequency produced by meshing gear teeth. GMF = number of teeth on pinion (or gear) × rotational frequency of that gear (Hz). Multiple harmonics of GMF are typically present in a gearbox spectrum. Sidebands spaced at the rotational frequency of the relevant shaft around GMF harmonics indicate gear eccentricity, load variation, or damage.

### G (gravitational unit)
Unit of acceleration. 1g = 9.80665 m/s² = 386.089 in/s² = 980.665 cm/s².

---

### Harmonics
Spectral components at integer multiples of a fundamental frequency: 2X, 3X, 4X, etc. A series of harmonics in a machinery spectrum is the spectral signature of a periodic mechanical event repeating at the fundamental frequency. The pattern and relative amplitudes of harmonics provide diagnostic information: strong 2X relative to 1X suggests misalignment; multiple harmonics of a fundamental suggest looseness or waveform distortion.

### Hanning Window
The most widely used FFT windowing function in vibration data collection. The Hanning window reduces the amplitude at the start and end of each time record to zero, suppressing spectral leakage at the cost of slightly reduced frequency resolution compared to a rectangular window. Provides good frequency resolution and acceptable amplitude accuracy for most machinery monitoring applications.

### Hertz (Hz)
The SI unit of frequency. One hertz equals one complete cycle per second. Named after Heinrich Hertz.

---

### Imbalance
A condition in which the mass centreline of a rotating part does not coincide with its rotational centreline. Imbalance produces a rotating centrifugal force at the running speed frequency (1X), loading the bearings and generating synchronous vibration. Imbalance forces increase with the square of speed — doubling RPM quadruples the imbalance force. Three types are recognised:

- **Static imbalance:** The principal inertia axis is parallel to but offset from the rotational axis. The rotor's heavy spot settles to the bottom when placed on frictionless supports. Corrected with a single balance mass at the heavy spot plane.
- **Couple imbalance:** The principal inertia axis intersects the rotational axis at the centre of gravity. The rotor is statically balanced but dynamically unbalanced. Produces out-of-phase forces at each bearing when rotated. Requires two correction masses in separate planes.
- **Dynamic imbalance:** A combination of static and couple imbalance. The most common type in practice. The principal inertia axis neither intersects nor is parallel to the rotational axis. Requires at least two correction masses in separate planes.

See also: Fault Patterns — Imbalance.

### Integration
A mathematical operation that produces the accumulation of a signal over time. In vibration analysis: integrating acceleration yields velocity; integrating velocity yields displacement. Integration in the frequency domain is performed by dividing spectral amplitude by angular frequency (2πf). Double integration (acceleration to displacement) amplifies low-frequency content and can introduce DC drift — high-pass filtering is applied to manage this.

---

### Journal
The portion of a shaft surface that runs within a plain (sleeve) bearing. The journal rides on a hydrodynamic oil film. Wear, clearance, and oil film instability (oil whirl) are monitored via displacement proximity probes in high-speed turbomachinery.

---

### Key-Phasor
A once-per-revolution timing reference signal generated by a transducer observing a physical marker (notch, bolt, reflective tape) on the shaft. The key-phasor pulse is used as a phase reference for synchronous analysis, orbit plots, balancing, and order tracking. Enables precise determination of phase angle and the position of the vibration vector relative to shaft position.

---

### Leakage
A spectral distortion artefact that occurs in FFT analysis when a signal frequency does not fall exactly on a spectral line. Energy from the true frequency leaks into adjacent frequency bins, broadening and distorting spectral peaks. Leakage is suppressed by applying a window function (Hanning, Hamming, Flat Top) to the time record before FFT computation.

### Lines of Resolution
The number of discrete frequency data points in a spectrum. Common settings are 400, 800, 1600, and 3200 lines. More lines provide finer frequency resolution but require more samples and longer data collection time.

---

### Machine Running Speed
The actual shaft rotational speed during measurement, expressed in RPM or Hz. The nominal speed is the design or programmed operating speed; the actual speed may differ due to load variation, slip, or intentional speed variation. In vibration analysis, all order-based frequency analysis references the actual running speed.

### Measurement Point
The specific location on a machine where vibration is measured. Standard practice for motors and pumps specifies measurement points at each bearing housing in radial-horizontal, radial-vertical, and axial directions. Consistent measurement point location is essential for valid trending and comparison.

### Micrometer (Micron, µm)
One-millionth of a metre (10⁻⁶ m). 1 µm = 0.04 mils. Standard unit for displacement in the SI system.

### Mil
One thousandth of an inch (0.001 inch). Standard unit for displacement in the US customary system. 1 mil = 25.4 µm.

---

### Natural Frequency
The frequency at which a mechanical system will freely oscillate when disturbed from equilibrium and released, without ongoing forcing. Determined by the mass and stiffness properties of the system. Each structure has multiple natural frequencies corresponding to different mode shapes. When a forcing frequency coincides with a natural frequency, resonance occurs.

### Normalization (Order Normalization)
The process of expressing the frequency axis of a vibration spectrum in multiples of running speed (orders) rather than in Hz or cpm. After normalization, the 1X shaft speed component appears at order 1 regardless of actual RPM, enabling direct comparison of spectra from the same machine at different speeds.

### Nyquist Criterion
The requirement that a signal must be sampled at a frequency at least twice the highest frequency of interest in order to avoid aliasing. Practical analysers sample at 2.56 times FMAX to allow for anti-aliasing filter rolloff.

---

### Oil Whirl / Oil Whip
An instability phenomenon occurring in journal (sleeve) bearings under conditions of excessive clearance or light loading. The shaft orbit precesses in the direction of rotation at a frequency between 0.38X and 0.48X of running speed (typically around 0.42X–0.48X). Oil whirl becomes oil whip when the whirl frequency locks onto a rotor natural frequency, producing large and potentially destructive sub-synchronous vibration. Distinctive spectral signature: strong peak at 0.38–0.48X running speed. See also: Fault Patterns — Oil Whirl.

### Orders
Multiples of running speed used as frequency reference units in rotating machinery analysis. First order (1X) = shaft rotational frequency. Second order (2X) = twice rotational frequency. Expressing spectra in orders facilitates comparison across measurements taken at different speeds and aids identification of speed-related vs. non-speed-related vibration.

### Orbit Plot
An X–Y displacement plot showing the path of the shaft centreline within the bearing clearance, derived from two orthogonal proximity probe signals (horizontal and vertical). Orbit shape reveals rotor dynamic behaviour and specific fault conditions. A circular or elliptical orbit is typical for a healthy rotor; figure-eight, banana-shaped, or precessing orbits indicate specific fault conditions.

### Overall Level
See Broadband Level.

---

### Peak Value
The maximum amplitude excursion of a vibration waveform in one direction from the zero baseline. Peak = 1.414 × RMS for a pure sine wave.

### Peak-to-Peak Value
The total amplitude excursion from the maximum positive peak to the maximum negative peak of a waveform. For a pure sine wave, peak-to-peak = 2 × peak. The standard reporting unit for displacement measurements. Also directly measurable from proximity probe (displacement) signals without integration.

### Period
The time required to complete one full cycle of a periodic vibration. The reciprocal of frequency: Period (seconds) = 1 / Frequency (Hz).

### Phase
The timing relationship between two signals of the same frequency, or between a signal and a reference (such as a key-phasor). Expressed in degrees (0–360°) or radians. Phase is a critical diagnostic parameter: phase difference across a coupling indicates misalignment; phase difference across a bearing indicates imbalance type (static vs. couple). Phase cannot be determined from a single-channel auto spectrum — it requires a reference signal.

### Piezoelectric
A material property in which mechanical deformation generates an electrical charge (and vice versa). The operating principle of the most widely used vibration transducer, the piezoelectric accelerometer.

### Power Spectral Density (PSD)
See Auto Spectral Density.

---

### Radial
In the direction perpendicular to and pointing toward the shaft centreline. Radial vibration measurements detect imbalance, misalignment, bearing faults, and other radial forcing conditions. Measured in horizontal and vertical radial directions at each bearing.

### Resonance
The condition in which a mechanical forcing frequency coincides with a structural natural frequency, producing a large amplitude response disproportionate to the exciting force. Identified by a substantial amplitude peak accompanied by a 90° phase shift at the resonant frequency. Resonances that coincide with machine running speed or its harmonics are the most problematic and may require structural modification, damping treatment, or speed change.

### RMS (Root Mean Square)
A statistical measure of the effective amplitude of a vibration signal, computed as the square root of the time-averaged squared signal values. RMS is the accepted convention for velocity and acceleration in ISO standards and machinery monitoring. For a pure sine wave: RMS = 0.707 × peak. The RMS value of a complex waveform cannot be predicted from the peak value without knowing the waveform shape.

### Rolling Element Bearing (Anti-Friction Bearing)
A bearing that supports shaft load through rolling elements (balls or rollers) running on inner and outer races, with a cage retaining element spacing. Generates characteristic defect frequencies when any of the four components (inner race, outer race, rolling elements, cage) are damaged. See also: Fault Patterns — Rolling Element Bearing Wear.

### Root Cause Analysis
The determination of the underlying physical cause of a machinery failure, as distinct from the observed failure mode. Vibration analysis contributes to root cause analysis by identifying the fault type (imbalance, misalignment, looseness, bearing failure, etc.) and its likely origin.

---

### Sampling Rate
The number of data points per second acquired by the A/D converter. Must exceed twice the FMAX of interest (Nyquist criterion). In practice, analysers sample at 2.56 × FMAX to allow for anti-aliasing filter rolloff.

### Sidebands
Spectral components appearing symmetrically on either side of a carrier frequency, spaced at a modulating frequency. Sidebands arise from amplitude or frequency modulation of the carrier signal. In machinery diagnostics, sidebands around gearmesh frequency at spacings equal to shaft speed indicate gear eccentricity, wear, or load variation. Sidebands around bearing defect frequencies indicate bearing fault progression.

### Signature (Vibration Signature)
The characteristic vibration frequency spectrum of a specific machine at a specific operating condition. The signature encodes information about all active forcing mechanisms. Comparison of current signatures against baseline signatures is the primary method of detecting developing machine faults. The spectrum is considered the richest single non-destructive indicator of machine condition.

### Ski Slope
A spectral artefact characterised by very high amplitude at the low-frequency end of the spectrum decaying progressively across higher frequencies. Indicates a measurement problem rather than a genuine machine fault: loose or improperly mounted transducer, thermal transient on the sensor, mechanical shock during data collection, or sensor saturation from excessively high vibration. Should be rejected and the measurement repeated. See also: Fault Patterns — Ski Slope.

### Soft Foot
A mounting condition in which one or more feet of a machine are not in full planar contact with the baseplate, causing the machine frame to distort when hold-down bolts are tightened. Soft foot introduces artificial misalignment and must be corrected before alignment correction is attempted. Diagnosed by measuring the change in coupling gap or vibration level when individual hold-down bolts are successively loosened.

### Spall
A flake or chip of material released from the race surface of a rolling element bearing. Spalling is the physical manifestation of advanced bearing fatigue damage. A spalled bearing generates impulsive vibration at bearing defect frequencies and their harmonics. Detection of spalling via demodulation (enveloping) is a primary goal of bearing condition monitoring.

### Spectrum
The frequency domain representation of a time domain vibration signal, produced by FFT analysis. The spectrum decomposes the signal into constituent sine wave components, displaying amplitude versus frequency. Machinery spectra are interpreted by identifying peaks at known forcing frequencies and comparing their amplitudes with baseline and alarm thresholds.

### Stiffness
The resistance of a mechanical element to deformation under load. Expressed as force per unit deflection (N/m or lbf/in). Along with mass, stiffness determines the natural frequency of a mechanical system: natural frequency ∝ √(stiffness/mass). Changes in bearing stiffness (e.g., from wear or damage) shift natural frequencies and alter vibration response.

### Sub-Harmonic
A vibration frequency component at a fraction (sub-multiple) of the fundamental frequency: 0.5X, 0.33X, etc. Sub-harmonics in machinery spectra indicate nonlinear behaviour, looseness, rub, or fluid film instability (oil whirl). Their presence is diagnostically significant.

### Sub-Synchronous
Vibration at a frequency below the shaft rotational speed (below 1X). Includes oil whirl (0.38–0.48X), rub-induced sub-harmonics (0.5X), and fluid instabilities. Sub-synchronous vibration at high amplitude typically indicates a potentially serious or rapidly developing condition.

### Synchronous
Vibration components at integer multiples of the shaft rotational frequency (1X, 2X, 3X...). Synchronous components are excited by rotating imbalance, misalignment, mechanical looseness, and other forcing mechanisms tied to shaft rotation.

---

### Tangential
In triaxial vibration measurement on rotating machinery, the direction tangent to the rotating shaft (perpendicular to both the radial and axial directions). Less commonly used than radial and axial in standard route-based monitoring.

### Time Domain / Time Waveform
The representation of a vibration signal as amplitude versus time, as would be viewed on an oscilloscope. The time waveform reveals information not always visible in the spectrum: impulsive events (bearing impacts, rubs), signal modulation, and waveform shape. For bearing diagnostics in particular, the time waveform showing repetitive impacts is a valuable supplement to the frequency spectrum.

### Transducer
A device that converts one form of energy into another. In vibration measurement, the transducer converts mechanical motion into an electrical signal. The three primary transducer types are: accelerometers (measure acceleration), velocity transducers (measure velocity), and proximity probes/eddy current probes (measure displacement). Piezoelectric accelerometers are the dominant type for industrial machinery monitoring.

### Transient Vibration
Temporarily sustained vibration associated with a change in machine operating conditions — such as start-up, shutdown, or sudden load change. Transient vibration analysis during run-up and coast-down reveals critical speeds and resonances via Bode plots and cascade (waterfall) plots.

### Trending
The tracking of vibration parameters over time to detect progressive deterioration. Key parameters for trending include: overall broadband level, amplitudes of specific spectral peaks (1X, 2X, bearing defect frequencies), crest factor, kurtosis, and demodulated (envelope) spectrum amplitudes. Rate of change (slope of trend) is as diagnostically important as the absolute level.

---

### Velocity
The time rate of change of displacement. In vibration signals, velocity is expressed in millimetres per second (mm/s) or inches per second (in/s), typically as a peak or RMS value. Velocity is the standard measurement parameter for ISO 10816-3 severity assessment for most general industrial rotating machinery operating above approximately 600 RPM. Velocity is obtained by integrating acceleration electronically or digitally.

### Vibration
Oscillatory motion of a mechanical system about a reference (rest) position. In rotating machinery, vibration is generated by dynamic forces from unbalance, misalignment, bearing defects, aerodynamic forces, and structural resonances. Characterised by frequency, amplitude, and phase.

### Vibration Signature
See Signature.

---

### Waveform
See Time Domain.

### Waterfall Plot (Spectral Map)
A three-dimensional display of successive vibration spectra plotted against a third axis (time or RPM). Commonly used during run-up and coast-down to track how spectral peaks evolve as machine speed changes. Resonances appear as amplitude ridges at constant frequency lines as speed is varied. Also used in steady-state monitoring to display how a machine's spectrum changes over time.

### Window (Windowing)
A mathematical weighting function applied to each time record before FFT computation to reduce spectral leakage. Common types in machinery analysis:
- **Hanning window:** Most commonly used. Good frequency resolution. Forces amplitude to zero at record boundaries.
- **Flat Top window:** Best amplitude accuracy. Reduced frequency resolution. Used when precise amplitude measurement is more important than frequency resolution.
- **Hamming window:** Similar to Hanning but does not reduce to zero at boundaries.
- **Rectangular (Uniform) window:** No weighting applied. Provides no leakage protection. Suitable only for transient signals that decay within the time record.

---

### Zero-to-Peak
Equivalent to peak value — the maximum excursion of the signal from the zero baseline in one direction. Equal to half the peak-to-peak value for a symmetric waveform.

---

## PART 2 — FAULT PATTERN REFERENCE

This section describes the characteristic vibration signatures of common rotating machinery fault conditions. Each entry specifies dominant frequency components, measurement directions, phase behaviour, and diagnostic notes. This information is used to classify fault probability from spectral data.

**Frequency notation:**
- 1X = shaft rotational frequency (fundamental)
- 2X = twice shaft rotational frequency
- 3X–8X = third to eighth harmonic of shaft speed
- nX = any integer multiple of running speed
- Sub-X = sub-synchronous (fractional multiples, e.g., 0.5X, 0.38–0.48X)
- BPF = blade/vane pass frequency
- GMF = gearmesh frequency
- BPFI, BPFO, BSF, FTF = rolling element bearing defect frequencies

---

### Fault: Ski Slope (Bad Measurement Artefact)

**Frequency signature:** Very high amplitude near 0 Hz, decaying progressively to the right across the spectrum. Not a machine fault — a measurement artefact.

**Cause:** Loose or improperly mounted transducer; mechanical shock or bump to the sensor during data collection; thermal transient on sensor surface; sensor overload or saturation from excessively high vibration.

**Diagnostic action:** Reject the measurement. Check transducer mounting integrity and condition. Repeat measurement. If ski slope recurs, inspect the measurement point attachment and sensor cable.

**Note:** If the ski slope is accompanied by a raised noise floor at the high-frequency end, the transducer may be saturated by a high-frequency, high-amplitude vibration source.

---

### Fault: Raised Noise Floor

**Frequency signature:** Overall elevation of the spectrum noise floor across a wide frequency range. May be most pronounced in the high-frequency region.

**Causes:**
- Rolling element bearing wear (Stage 6 end-stage: noise floor elevation with 1X, 2X, 3X peaks riding on raised floor)
- Cavitation (noise floor biased toward higher frequencies, with possible vane pass peak present)
- Advanced mechanical wear generating broadband vibration
- Resonances or closely spaced sidebands (appear as spectral "humps" — distinguish by examining at high spectral resolution)

**Diagnostic note:** If the elevated noise floor is biased toward higher frequencies, consider cavitation (for pump assets) or high-frequency structural excitation. If distributed across a wide range with 1X, 2X, 3X peaks superimposed, consider end-stage bearing failure.

---

### Fault: Imbalance — Static

**Frequency signature:** Strong 1X radial (both vertical and horizontal). Phase: approximately 0–30° between vertical and horizontal measurement points on the same bearing. Phase at 1X is consistent and repeatable across measurements.

**Mechanism:** The rotor mass centreline is offset from but parallel to the rotational axis. A single heavy spot exists; centrifugal force rotates at 1X. 1X is dominant in the radial direction. Axial 1X is low.

**Correction:** Single-plane balance correction at the heavy spot angular location.

**Distinguishing notes:** Static imbalance produces in-phase 1X across the machine (both bearings show similar phase). Compare with couple imbalance, which shows 180° phase difference between bearings.

---

### Fault: Imbalance — Couple

**Frequency signature:** Strong 1X radial. Phase: approximately 180° (±30°) out of phase between vertical readings at the two bearings (and between horizontal readings at the two bearings). Vibration levels highest in radial direction.

**Mechanism:** The rotor is statically balanced (no net heavy spot) but has two equal and opposite imbalance masses at opposite ends of the shaft, creating a couple. The 180° out-of-phase response between bearings is the key diagnostic indicator.

**Correction:** Two-plane balancing required.

---

### Fault: Imbalance — Dynamic

**Frequency signature:** Strong 1X radial. Phase difference between bearings between 0° and 180° (combined static and couple components). Highest vibration in horizontal direction (due to greatest flexibility).

**Mechanism:** The most common imbalance type in practice. Combination of static and couple components. The principal inertia axis neither intersects nor parallels the rotational axis.

**Correction:** Two-plane balancing required.

---

### Fault: Imbalance — Overhung Rotor

**Frequency signature:** High 1X in both radial (vertical and horizontal) and axial directions. Axial 1X is comparable to radial 1X. Phase readings between vertical and horizontal at the axial position are approximately in-phase.

**Mechanism:** Rotor mounted outboard of both bearings (overhung). The imbalance creates a bending moment on the shaft that drives axial vibration. Common in close-coupled pumps with axial flow fans and small turbines.

**Distinguishing notes:** Significant axial 1X distinguishes overhung imbalance from standard static/couple imbalance where axial 1X is minimal.

---

### Fault: Imbalance — Vertical Machine

**Frequency signature:** Strong 1X radial (in horizontal / tangential direction). Phase behaviour similar at both bearings (in-phase in the same direction for static, out-of-phase for couple component). May be challenging to separate motor imbalance from pump imbalance without decoupling.

**Diagnostic procedure:** To isolate the source in a vertical motor-pump, decouple the motor from the pump and run the motor solo. If 1X level drops significantly, imbalance is in the pump rotor. If 1X remains elevated, imbalance is in the motor.

---

### Fault: Eccentric Rotor or Gear

**Frequency signature:** Strong 1X radial (vertical and horizontal). Similar to imbalance in spectrum appearance. Eccentric rotor: 1X dominates. Eccentric gear: strong 1X of the eccentric gear, plus gearmesh frequency (GMF) harmonics at 1GMF, 2GMF, 3GMF, with sidebands spaced at the eccentric gear's rotational speed.

**Mechanism:** The geometric centreline of a rotor, gear, or sheave (pulley) is offset from its rotational centre. This creates a direction-dependent radial loading that repeats at 1X. Unlike imbalance (which generates a rotating centrifugal force), eccentricity generates a unidirectional radial loading that alternates as the rotor turns.

**Distinguishing from imbalance:** Eccentricity cannot be corrected by balancing. Vibration level does not decrease proportionally with added balance weights. For fans and motors: eccentricity often produces different 1X levels in vertical vs. horizontal (highest in direction of greatest belt tension for sheaves, or in direction of air gap variation for motors).

---

### Fault: Eccentric Sheave (Eccentric Pulley)

**Frequency signature:** Strong 1X radial, highest in the direction of belt tension. May show 1X of both motor and driven equipment if both sheaves are eccentric. Phase between motor and fan/pump 1X peaks may be 0° or 180°.

**Mechanism:** The geometric centre of a belt drive sheave (pulley) is offset from its rotational centre. Generates 1X vibration and cyclic belt tension variation. Belt condition and proper tensioning should be assessed concurrently.

---

### Fault: Misalignment (General)

**Frequency signature:** 1X and 2X radial and/or axial vibration. In severe misalignment: strong harmonics up to 3X–8X (and sometimes higher) in axial direction. Phase across the coupling is 180° (axial direction) for angular misalignment; 180° in radial direction for parallel misalignment.

**Mechanism:** Misalignment is a condition in which the centrelines of coupled shafts are not coincident. Two primary types:
- **Parallel (offset) misalignment:** Shaft centrelines are parallel but not coincident. Primary spectral signature: strong 2X radial with smaller 1X; 180° phase across coupling in radial direction.
- **Angular misalignment:** Shaft centrelines meet at a point but are not parallel. Primary spectral signature: strong axial 1X with 2X and 3X axial; 180° phase across coupling in axial direction.

Most real misalignment is a combination of both types.

**Phase diagnostic:** Axial phase difference of approximately 180° across the coupling is the strongest single indicator of angular misalignment. Radial phase difference of 180° across the coupling indicates parallel misalignment.

---

### Fault: Angular Misalignment

**Frequency signature:** High axial vibration at 1X; 2X and 3X also present in axial direction. Radial 1X and 2X also elevated but axial components dominate. Axial vibration 180° out of phase across the coupling (measured at each bearing in the axial direction). Radial 1X and 2X are in-phase between bearings.

---

### Fault: Parallel (Offset) Misalignment

**Frequency signature:** Strong 2X radial (vertical and horizontal). 1X and 3X also present but lower. Dominant direction is radial. Axial 1X and 2X elevated but lower than in angular misalignment. 180° radial phase across the coupling. In severe cases, harmonics up to 8X can be present.

**Note:** In severe parallel misalignment, noise floor may be raised between harmonic peaks (distinguish from looseness, which also generates harmonics).

---

### Fault: Bent Shaft

**Frequency signature:** High 1X axial vibration. 2X axial also visible if the bend is near mid-span. Phase: approximately 180° between axial readings at opposite ends of the machine.

**Mechanism:** A shaft that is not straight will generate a rotating bending moment, producing axial vibration at 1X (if the bend is near the coupling) or 2X (if near mid-span). Distinguished from misalignment by: the 180° axial phase difference exists along the shaft even without a coupling; the condition does not change when the coupling is realigned.

**Diagnostic confirmation:** Measure axial phase at both bearing housings. A consistent 180° phase difference that does not improve with alignment corrections indicates a bent shaft.

---

### Fault: Cocked Bearing

**Frequency signature:** Strong 1X, 2X, and 3X axial vibration. 180° phase difference in axial readings on either side of the bearing (above and below the shaft; left and right of the shaft). Can appear similar to misalignment and overhung rotor imbalance.

**Mechanism:** A rolling element or plain bearing whose mounting face is not perpendicular to the shaft axis. Creates a twisting or rocking motion of the shaft at the bearing location. Produces strong axial vibration components.

**Distinguishing feature:** Phase difference of 180° measured axially on either side of the bearing (e.g., top vs. bottom of bearing housing, or drive end vs. non-drive end close to the same bearing). This localised phase reversal distinguishes a cocked bearing from general misalignment.

---

### Fault: Mechanical Looseness — Rotating (Bearing Clearance Looseness)

**Frequency signature:** 1X harmonics extending to 10X and beyond in the radial direction. Half-order harmonics (0.5X, 1.5X, 2.5X, etc.) may be present in severe cases. Vertical vibration often higher than horizontal (looseness tends to manifest in the direction of least stiffness).

**Mechanism:** Excessive clearance between a rotating shaft and its bearing (journal bearing clearance, rolling element bearing in housing). The looseness allows the rotating element to move within the clearance envelope, generating truncated, clipped, or impulsive waveforms that produce rich harmonic content in the spectrum.

**Key diagnostic pattern:** A "forest" of harmonics extending well beyond 3X–4X. Sub-harmonics (0.5X multiples) indicate severe looseness or rub. Vibration is directional — often much higher in one radial direction than the other.

---

### Fault: Mechanical Looseness — Structural (Foundation/Frame Looseness)

**Frequency signature:** Dominant 1X horizontal (in the direction of least structural stiffness). Additional harmonics possible but typically less numerous than rotating looseness. 180° phase difference between the machine body and the foundation/baseplate.

**Mechanism:** Looseness between a machine foot and its baseplate, or between a baseplate and its foundation. Caused by loose hold-down bolts, cracked grout, corrosion, or structural deterioration. The machine foot lifts or rocks on the foundation, reducing support stiffness and increasing 1X horizontal vibration.

**Diagnostic procedure:** Phase measurement between the machine casing and the baseplate will show ~180° phase difference if structural looseness is present. Check for soft foot concurrently.

---

### Fault: Mechanical Looseness — Pedestal Bearing (Pillow Block)

**Frequency signature:** 1X, 2X, and 3X radial. May include a 0.5X component in more severe cases. 180° phase across the bearing pedestal base.

**Mechanism:** Looseness within a pedestal (plummer block / pillow block) bearing housing — between the bearing outer ring and housing, or between the housing and its mounting surface.

---

### Fault: Rotor Rub

**Frequency signature:** 1X harmonics (similar to looseness) plus 0.5X sub-harmonic. One or more resonance frequencies may be excited and appear as additional peaks at non-synchronous frequencies. The 0.5X component (half-order) is the most distinctive indicator of rub.

**Mechanism:** Physical contact between a rotating element and a stationary component (seal, casing, labyrinth). Contact generates impulsive forces that excite harmonics of running speed and, characteristically, sub-harmonic at 0.5X (because each rub event may occur once every two revolutions when the orbit locks into a sub-harmonic pattern).

**Severity:** Rub is a potentially serious condition. High temperature at the contact point can cause thermal bow of the shaft, which may cause the rub to worsen progressively.

---

### Fault: Journal Bearing Clearance (Sleeve Bearing Wear)

**Frequency signature:** Multiple 1X harmonics extending to high orders (1X, 2X, 3X, 4X, 5X and beyond). Vertical vibration typically higher than horizontal. Half-order components possible in severe cases.

**Mechanism:** Excessive radial clearance in a journal (sleeve / plain) bearing allows the shaft to move within an enlarged clearance envelope, generating a rich harmonic spectrum similar to rotating looseness. Occurs in fluid film bearings where the oil film is unable to maintain the shaft centreline position.

---

### Fault: Oil Whirl

**Frequency signature:** Strong sub-synchronous peak at 0.38–0.48X of running speed (never at exactly 0.5X). The peak frequency tracks with running speed changes (remains at approximately 0.43–0.48X as speed varies). Radial direction dominant.

**Mechanism:** Hydrodynamic instability in a lightly loaded journal bearing. The rotating oil film drags the journal into a circular precessing motion at approximately half the oil film velocity — typically 40–49% of shaft speed. Caused by excessive bearing clearance, light radial load, or low oil viscosity.

**Oil whip:** If the oil whirl frequency approaches the first critical speed of the rotor, the whirl frequency locks onto the critical speed (no longer tracks with running speed changes) and amplitude increases dramatically. This condition — oil whip — is destructive and requires immediate corrective action.

**Distinguishing feature:** The 0.38–0.48X peak tracks proportionally with speed changes (distinguishing oil whirl from structural resonance, which remains at a fixed frequency as speed changes).

---

### Fault: Resonance

**Frequency signature:** A single high-amplitude spectral peak in one measurement direction (typically), usually at 1X or another forcing frequency. The peak may appear as a "hump" rather than a sharp spike if it spans multiple spectral lines. Does not track proportionally with speed changes (the resonant frequency is fixed, determined by structural properties).

**Mechanism:** A machine forcing frequency (1X, 2X, blade pass, etc.) coincides with or is close to a structural natural frequency of the machine, support, or piping. The structure responds with disproportionately amplified vibration at the natural frequency.

**Diagnostic test:** Change the machine speed. If the amplitude of the suspect peak tracks with speed (moves proportionally in frequency as RPM changes), it is an order-related forcing peak. If the peak remains at a fixed frequency while the speed changes, it is a structural resonance.

**Correction:** Resonance is addressed by: (1) changing the forcing frequency (speed adjustment), (2) changing the natural frequency (structural modification — stiffening or mass addition), or (3) adding damping.

---

### Fault: Rolling Element Bearing Wear

Rolling element bearing damage follows a characteristic progression through six stages, each with a distinctive vibration signature. Early detection enables planned maintenance before catastrophic failure.

**Bearing defect frequencies are calculated from bearing geometry:**

- **BPFI (Ball Pass Frequency Inner race):** Frequency at which rolling elements pass over a defect on the inner race. Appears at non-synchronous (asynchronous) frequency. BPFI = (n/2) × (1 + (d/D) × cos α) × RPM/60
- **BPFO (Ball Pass Frequency Outer race):** Frequency at which rolling elements pass over a defect on the outer race. BPFO = (n/2) × (1 − (d/D) × cos α) × RPM/60
- **BSF (Ball Spin Frequency):** Frequency of rolling element rotation about its own axis. BSF = (D/2d) × (1 − (d/D)² × cos²α) × RPM/60
- **FTF (Fundamental Train Frequency / Cage Rate):** Frequency of cage rotation. FTF = (1/2) × (1 − (d/D) × cos α) × RPM/60

Where: n = number of rolling elements; d = rolling element (ball) diameter; D = bearing pitch diameter; α = contact angle.

**Simplified rule of thumb:** BPFI ≈ 0.6 × n × RPM/60; BPFO ≈ 0.4 × n × RPM/60 (approximate only).

**Stage 1 — Earliest detectable damage:**
High-frequency "ringing" of the bearing natural frequency in the ultrasonic range. Detectable only by specialised high-frequency methods: HFD (High Frequency Detection), SEE (Spectral Emitted Energy), Spike Energy, or demodulation analysis. No visible change in broadband velocity spectrum. Action: note and schedule early inspection.

**Stage 2 — Early bearing defect frequencies:**
Bearing defect frequencies (BPFI, BPFO, BSF, or FTF) appear as low-amplitude peaks at non-synchronous frequencies in the demodulated (envelope) spectrum. The broadband velocity RMS remains within ISO acceptable zones. Tools such as demodulation, kurtosis, and crest factor detect this stage. Action: increase monitoring frequency; begin trend tracking of defect frequency amplitudes.

**Stage 3 — Developing defect:**
Bearing defect frequencies (BPI/BPO/BSF) become visible in the standard velocity spectrum. Harmonics of defect frequencies appear. Sidebands spaced at running speed appear around the defect frequency harmonics. Broadband velocity RMS may begin to rise modestly. Action: plan replacement; continue close monitoring.

**Stage 4 — Significant defect:**
Defect frequency amplitudes increase substantially. Additional harmonics and sideband families develop. Broadband vibration is noticeably elevated. Crest factor is elevated. Action: schedule replacement in near term.

**Stage 5 — Advanced damage:**
All defect frequency harmonics present with significant sidebands. Very broadband. Noise floor begins to rise. Vibration amplitudes continue to increase. Machine is in an advanced failure state.

**Stage 6 — Imminent failure:**
Bearing defect frequencies may begin to disappear from the spectrum as the bearing surface becomes uniformly damaged (no discrete defect events). 1X, 2X, 3X running speed harmonics become prominent. The overall noise floor is substantially raised across the entire spectrum. Broadband velocity RMS is high (likely in ISO Zone C or D). Machine must be shut down and bearing replaced immediately. Failure is imminent.

---

### Fault: Pumps and Fans — Blade/Vane Pass

**Frequency signature:** Spectral peak at blade pass frequency (BPF = number of blades × shaft frequency in Hz). Harmonics of BPF (2×BPF, 3×BPF) may be present. BPF peak is present in all pumps and fans as a normal operational component; diagnosis focuses on elevated or growing amplitude.

**Formula:** Blade Pass Frequency = Number of blades (or vanes) × RPM/60 (Hz)

**Elevated BPF amplitude indicates:**
- Unequal blade or vane spacing (manufacturing defect or damage)
- Excessive clearance between rotating blades/vanes and stationary diffuser, volute cutwater, or casing
- Sharp bends, obstructions, or recirculation zones in the fluid path
- Hydraulic recirculation at off-design flow conditions (operating far from Best Efficiency Point)
- Cavitation (concurrent raised noise floor and BPF elevation)

**Diagnostic note:** Some elevation of BPF is normal and expected. Assess whether BPF amplitude is trending upward over time, and whether it is approaching or exceeding alert thresholds. If BPF is high and the machine is operating far from its design flow point, assess whether the operating point can be corrected.

---

## PART 3 — MEASUREMENT UNITS AND CONVERSION REFERENCE

| Quantity | SI Unit | Common Units | Notes |
|---|---|---|---|
| Displacement | µm (micrometre) | mil (0.001 in) | 1 mil = 25.4 µm |
| Velocity | mm/s | in/s | ISO 10816-3 uses mm/s RMS |
| Acceleration | m/s², g | g | 1g = 9.807 m/s² |
| Frequency | Hz (cycles/s) | CPM (cycles/min), Orders | 1 Hz = 60 CPM |
| Rotational speed | RPM | Hz | Hz = RPM/60 |

**Amplitude convention summary:**
- Displacement: peak-to-peak (µm pk-pk or mils pk-pk)
- Velocity: RMS (mm/s RMS) — ISO 10816-3 standard
- Acceleration: RMS (g RMS or m/s² RMS)

**dB reference values:**
- Acceleration: AdB = 20 log(A / 3.861×10⁻⁴ in/s²)
- Velocity: VdB = 20 log(V / 5.568×10⁻⁷ in/s)
- 6 dB = 2× amplitude; 20 dB = 10× amplitude

---

## PART 4 — DIAGNOSTIC REASONING RULES

The following rules summarise key diagnostic logic for AI-assisted fault classification. These rules reduce hallucination risk by anchoring interpretation to physically grounded vibration signatures.

**Rule 1 — Direction matters:** Imbalance is primarily radial. Misalignment has a significant axial component. Structural looseness is directional (usually horizontal). Always interpret measurement direction alongside frequency content.

**Rule 2 — Phase confirms fault type:** Phase cannot be determined from a single-channel auto spectrum but is diagnostically critical. Imbalance: consistent in-phase response across the machine. Misalignment: ~180° phase across the coupling. Bent shaft / cocked bearing: localised 180° phase reversal in axial direction.

**Rule 3 — 1X dominant → imbalance or eccentricity (or resonance at 1X):** A single dominant 1X peak in radial direction with low harmonics and low axial component is the classic imbalance signature. If it does not correct with balancing, suspect eccentricity.

**Rule 4 — 2X dominant with axial → misalignment:** High 2X (with 1X present but lower) plus elevated axial is a primary misalignment indicator. Phase confirmation across the coupling is definitive.

**Rule 5 — Multiple high harmonics → looseness:** A spectrum showing 1X through 5X, 6X, 7X and beyond, with or without half-order harmonics, indicates mechanical looseness. Identify whether rotating (bearing clearance) or structural (foundation/frame).

**Rule 6 — Sub-synchronous peaks → fluid instability or rub:** A peak below 1X that is not a known sub-harmonic of a known forcing frequency should be assessed for oil whirl (0.38–0.48X tracking with speed) or rub (0.5X).

**Rule 7 — Non-synchronous peaks at bearing defect frequencies → bearing damage:** Asynchronous peaks that correspond to calculated BPFI, BPFO, BSF, or FTF values indicate rolling element bearing damage. Confirm with demodulated (envelope) spectrum analysis.

**Rule 8 — Raised noise floor → advanced bearing damage or cavitation (for pumps):** Broadband elevation of the noise floor without discrete peaks is a late-stage bearing signature (Stage 6) or cavitation. For pumps, assess operating point relative to Best Efficiency Point concurrently.

**Rule 9 — Ski slope → measurement artefact, not machine fault:** Reject the measurement and investigate transducer mounting before reporting a machine condition.

**Rule 10 — Resonance does not track with speed:** If a suspect peak remains at a fixed frequency while machine speed is varied, it is structural resonance. If it shifts proportionally with speed, it is a machine forcing frequency.

**Rule 11 — Crest factor and kurtosis detect early bearing damage:** Broadband velocity RMS may remain within ISO acceptable zones during bearing Stages 1–2. Crest factor > 3.5 and elevated kurtosis are early indicators. Use demodulation (envelope) spectrum to confirm.

**Rule 12 — All diagnostic conclusions require qualified engineer review:** AI-generated vibration analysis is a decision support tool. The diagnostic output must be reviewed and signed off by a qualified vibration analyst or mechanical engineer. The AI report is a draft assessment, not a certified determination.

---

*End of document.*
*Internal use only — AxiomAnare Knowledge Base.*
*Source: derived and rewritten from vibration analysis domain knowledge for internal RAG use.*
