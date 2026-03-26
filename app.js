// ══ SUPABASE CONFIG ══
const SUPABASE_URL = 'https://duedtedevbnrflfbnzba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZWR0ZWRldmJucmZsZmJuemJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTIzNzIsImV4cCI6MjA5MDA2ODM3Mn0.u_ngs7Fct7xQof90C-aPLMKeMcrqtS-yccUgI7r2FrE';

// Supabase REST API helper — no SDK needed, pure fetch
const SB = {
  async get(table, params='') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
    });
    return r.ok ? r.json() : null;
  },
  async post(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    return r.ok ? r.json() : null;
  }
};

// Load bearing library from Supabase — falls back to local CONFIG if offline
async function loadBearingLibrary() {
  try {
    const rows = await SB.get('bearing_library', 'select=bearing_model,bpfo_mult,bpfi_mult,bsf_mult,ftf_mult,ball_count,manufacturer');
    if (rows && rows.length > 0) {
      rows.forEach(r => {
        BEARING_LIBRARY[r.bearing_model] = {
          bpfo: r.bpfo_mult, bpfi: r.bpfi_mult,
          bsf: r.bsf_mult,  ftf: r.ftf_mult,
          balls: r.ball_count, note: r.manufacturer
        };
      });
      console.log('Bearing library loaded from Supabase:', rows.length, 'bearings');
    }
  } catch(e) {
    console.log('Bearing library: using local CONFIG (Supabase offline)');
  }
}

// Save NVR record to Supabase after analysis
async function saveNVRToSupabase(nvr) {
  try {
    const top = nvr.faults && nvr.faults[0];
    const record = {
      filename:        nvr.filename,
      file_format:     nvr.filename.split('.').pop(),
      sample_count:    nvr.n,
      sample_rate_hz:  nvr.sr,
      rms_mms:         parseFloat(nvr.rms),
      peak_mms:        parseFloat(nvr.peak),
      crest_factor:    parseFloat(nvr.cf),
      kurtosis:        parseFloat(nvr.kurt),
      deviation_sigma: parseFloat(nvr.devSc),
      iso_zone:        nvr.zoneRow?.zone_label,
      trend_code:      nvr.trendRow?.code,
      rul_days:        nvr.rulR?.days,
      rul_ci_days:     nvr.rulR?.ci,
      shaft_hz:        nvr.shaftHz,
      top_fault:       top?.name,
      top_fault_pct:   top?.pct,
      machine_class:   nvr.classRow?.display_label,
      load_pct:        nvr.machineParams?.loadPct || null,
      contributed_to_silo: true
    };
    const saved = await SB.post('nvr_records', record);
    if (saved) {
      console.log('NVR saved to Supabase:', saved[0]?.id);
      // Also save to cumulative silo if fault detected
      if (top && top.pct > 20 && !top.locked) {
        await SB.post('fault_signatures', {
          machine_class:   record.machine_class,
          equipment_type:  nvr.machineParams?.equipType || 'unknown',
          fault_type:      top.name,
          fault_category:  top.category,
          confidence_pct:  top.pct,
          iso_zone:        record.iso_zone,
          shaft_hz:        record.shaft_hz,
          rms_mms:         record.rms_mms,
          kurtosis:        record.kurtosis,
          crest_factor:    record.crest_factor,
          freq_hz:         top.freq_hz,
          harmonics_used:  top.harmonics_used,
          bearing_model:   nvr.machineParams?.bearingModel || null,
          load_pct:        record.load_pct
        });
      }
    }
  } catch(e) {
    console.log('Supabase save failed (offline mode):', e.message);
  }
}

// ══ BEARING LIBRARY — common industrial bearings with pre-computed fault multipliers ══
// Source: SKF/FAG/NSK published bearing geometry specifications
// Multipliers: BPFO = (n/2)*(1-(Bd/Pd)*cos(a)) | BPFI = (n/2)*(1+(Bd/Pd)*cos(a))
// BSF = (Pd/(2*Bd))*(1-((Bd/Pd)*cos(a))^2) | FTF = 0.5*(1-(Bd/Pd)*cos(a))
const BEARING_LIBRARY = {
  // SKF 6200 series (light series)
  'SKF 6200': {bpfo:3.053,bpfi:4.947,bsf:1.994,ftf:0.382,balls:7,note:'17mm bore'},
  'SKF 6201': {bpfo:3.053,bpfi:4.947,bsf:1.994,ftf:0.382,balls:7,note:'12mm bore'},
  'SKF 6202': {bpfo:3.053,bpfi:4.947,bsf:1.994,ftf:0.382,balls:7,note:'15mm bore'},
  'SKF 6203': {bpfo:3.592,bpfi:5.408,bsf:2.357,ftf:0.399,balls:8,note:'17mm bore'},
  'SKF 6204': {bpfo:3.592,bpfi:5.408,bsf:2.357,ftf:0.399,balls:8,note:'20mm bore'},
  'SKF 6205': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'25mm bore - CWRU standard'},
  'SKF 6206': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'30mm bore'},
  'SKF 6207': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'35mm bore'},
  'SKF 6208': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'40mm bore'},
  'SKF 6209': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'45mm bore'},
  'SKF 6210': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'50mm bore'},
  // SKF 6300 series (medium series)
  'SKF 6304': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'20mm bore'},
  'SKF 6305': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'25mm bore'},
  'SKF 6306': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'30mm bore'},
  'SKF 6307': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'35mm bore'},
  'SKF 6308': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'40mm bore'},
  'SKF 6309': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'45mm bore'},
  'SKF 6310': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'50mm bore'},
  // FAG equivalents
  'FAG 6205': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'25mm bore'},
  'FAG 6206': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'30mm bore'},
  'FAG 6207': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'35mm bore'},
  'FAG 6208': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'40mm bore'},
  'FAG 6305': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'25mm bore'},
  'FAG 6306': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'30mm bore'},
  'FAG 6307': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'35mm bore'},
  'FAG 6308': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'40mm bore'},
  // NSK equivalents
  'NSK 6205': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'25mm bore'},
  'NSK 6206': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'30mm bore'},
  'NSK 6305': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'25mm bore'},
  'NSK 6308': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'40mm bore'},
  // NTN equivalents
  'NTN 6205': {bpfo:3.585,bpfi:5.415,bsf:2.357,ftf:0.398,balls:9,note:'25mm bore'},
  'NTN 6308': {bpfo:3.991,bpfi:6.009,bsf:2.616,ftf:0.399,balls:8,note:'40mm bore'},
  // Timken (tapered roller — common in gearboxes)
  'TIMKEN 30205': {bpfo:3.746,bpfi:6.254,bsf:2.841,ftf:0.374,balls:13,note:'25mm bore tapered'},
  'TIMKEN 30208': {bpfo:3.746,bpfi:6.254,bsf:2.841,ftf:0.374,balls:13,note:'40mm bore tapered'},
};

// ══ USER MACHINE PARAMETERS — populated by Step 2 form ══
let machineParams = {
  equipType:    '',
  rpm:          null,    // nameplate RPM — null = use FFT detection
  bearingModel: '',
  bpfoMult:     null,    // null = use CONFIG defaults
  bpfiMult:     null,
  bsfMult:      null,
  ftfMult:      null,
  measPoint:    'bearing_housing',
  measAxis:     'H',
  loadPct:      null,
  lastMaint:    null,
  paramsEntered: false
};

const CONFIG = {
  iso_machine_classes: [
    { class_id:"cls_i",    display_label:"Class I",        iso_standard_ref:"ISO 10816-3:2009", machine_type_desc:"Small Machines",          power_kw_desc:"Up to 15 kW",      power_kw_min:0,   power_kw_max:15,   mounting_type:"Rigid Mount"    },
    { class_id:"cls_ii",   display_label:"Class II",       iso_standard_ref:"ISO 10816-3:2009", machine_type_desc:"Medium Machines",         power_kw_desc:"15 - 300 kW",      power_kw_min:15,  power_kw_max:300,  mounting_type:"Rigid Mount"    },
    { class_id:"cls_ii_f", display_label:"Class II (Flex)",iso_standard_ref:"ISO 10816-3:2009", machine_type_desc:"Medium Machines",         power_kw_desc:"15 - 300 kW",      power_kw_min:15,  power_kw_max:300,  mounting_type:"Flexible Mount" },
    { class_id:"cls_iii",  display_label:"Class III",      iso_standard_ref:"ISO 10816-3:2009", machine_type_desc:"Large Machines",          power_kw_desc:"Above 300 kW",     power_kw_min:300, power_kw_max:50000,mounting_type:"Rigid Mount"    },
    { class_id:"cls_iv",   display_label:"Class IV",       iso_standard_ref:"ISO 10816-3:2009", machine_type_desc:"Large Machines",          power_kw_desc:"Above 300 kW",     power_kw_min:300, power_kw_max:50000,mounting_type:"Flexible Mount" }
  ],
  iso_severity_zones: [
    { zone_id:"zi_a",  class_id:"cls_i",    zone_label:"A", rms_lower_mm_s:0,    rms_upper_mm_s:0.71,  action_required:"No action required. Newly commissioned or well-maintained.",                     iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.1" },
    { zone_id:"zi_b",  class_id:"cls_i",    zone_label:"B", rms_lower_mm_s:0.71, rms_upper_mm_s:1.8,   action_required:"Satisfactory for continuous operation.",                                        iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.2" },
    { zone_id:"zi_c",  class_id:"cls_i",    zone_label:"C", rms_lower_mm_s:1.8,  rms_upper_mm_s:4.5,   action_required:"Unsatisfactory for long-term operation. Corrective action required.",            iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.3" },
    { zone_id:"zi_d",  class_id:"cls_i",    zone_label:"D", rms_lower_mm_s:4.5,  rms_upper_mm_s:99999, action_required:"Dangerous. Risk of machine damage. Immediate shutdown warranted.",               iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.4" },
    { zone_id:"zii_a", class_id:"cls_ii",   zone_label:"A", rms_lower_mm_s:0,    rms_upper_mm_s:2.3,   action_required:"No action required. Newly commissioned or well-maintained.",                     iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.1" },
    { zone_id:"zii_b", class_id:"cls_ii",   zone_label:"B", rms_lower_mm_s:2.3,  rms_upper_mm_s:7.1,   action_required:"Satisfactory for continuous operation. Maintenance planning recommended.",        iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.2" },
    { zone_id:"zii_c", class_id:"cls_ii",   zone_label:"C", rms_lower_mm_s:7.1,  rms_upper_mm_s:11.2,  action_required:"Unsatisfactory - acceptable for short periods only. Corrective action required.", iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.3" },
    { zone_id:"zii_d", class_id:"cls_ii",   zone_label:"D", rms_lower_mm_s:11.2, rms_upper_mm_s:99999, action_required:"Dangerous. Risk of machine damage. Immediate shutdown warranted.",               iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.4" },
    { zone_id:"ziif_a",class_id:"cls_ii_f", zone_label:"A", rms_lower_mm_s:0,    rms_upper_mm_s:3.5,   action_required:"No action required.",                                                           iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.1" },
    { zone_id:"ziif_b",class_id:"cls_ii_f", zone_label:"B", rms_lower_mm_s:3.5,  rms_upper_mm_s:11.2,  action_required:"Satisfactory for continuous operation.",                                        iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.2" },
    { zone_id:"ziif_c",class_id:"cls_ii_f", zone_label:"C", rms_lower_mm_s:11.2, rms_upper_mm_s:18.0,  action_required:"Unsatisfactory - corrective action required.",                                  iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.3" },
    { zone_id:"ziif_d",class_id:"cls_ii_f", zone_label:"D", rms_lower_mm_s:18.0, rms_upper_mm_s:99999, action_required:"Dangerous. Immediate shutdown warranted.",                                      iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.4" },
    { zone_id:"ziii_a",class_id:"cls_iii",  zone_label:"A", rms_lower_mm_s:0,    rms_upper_mm_s:3.5,   action_required:"No action required.",                                                           iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.1" },
    { zone_id:"ziii_b",class_id:"cls_iii",  zone_label:"B", rms_lower_mm_s:3.5,  rms_upper_mm_s:11.2,  action_required:"Satisfactory for continuous operation.",                                        iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.2" },
    { zone_id:"ziii_c",class_id:"cls_iii",  zone_label:"C", rms_lower_mm_s:11.2, rms_upper_mm_s:18.0,  action_required:"Unsatisfactory - corrective action required.",                                  iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.3" },
    { zone_id:"ziii_d",class_id:"cls_iii",  zone_label:"D", rms_lower_mm_s:18.0, rms_upper_mm_s:99999, action_required:"Dangerous. Immediate shutdown warranted.",                                      iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.4" },
    { zone_id:"ziv_a", class_id:"cls_iv",   zone_label:"A", rms_lower_mm_s:0,    rms_upper_mm_s:3.5,   action_required:"No action required.",                                                           iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.1" },
    { zone_id:"ziv_b", class_id:"cls_iv",   zone_label:"B", rms_lower_mm_s:3.5,  rms_upper_mm_s:14.0,  action_required:"Satisfactory for continuous operation.",                                        iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.2" },
    { zone_id:"ziv_c", class_id:"cls_iv",   zone_label:"C", rms_lower_mm_s:14.0, rms_upper_mm_s:22.4,  action_required:"Unsatisfactory - corrective action required.",                                  iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.3" },
    { zone_id:"ziv_d", class_id:"cls_iv",   zone_label:"D", rms_lower_mm_s:22.4, rms_upper_mm_s:99999, action_required:"Dangerous. Immediate shutdown warranted.",                                      iso_clause_ref:"ISO 10816-3:2009 Table 1 S5.4" }
  ],
  fault_frequency_rules: [

    // -- MECHANICAL FAULTS (detectable from vibration) ----------------------
    // category: "mechanical" | requires: "vibration"
    { rule_id:"r_loose_found", fault_type:"Loose Foundation",      category:"mechanical", requires:"vibration",
      freq_multiplier:0.5,  harmonic_count:8, bandwidth_pct:0.10, confidence_weight:0.35,
      detection_note:"Sub-harmonic and multiple harmonics of shaft speed indicate structural looseness",
      iso_reference:"ISO 13379-1:2012 S5.4" },
    { rule_id:"r_imbal",       fault_type:"Mechanical Unbalance",  category:"mechanical", requires:"vibration",
      freq_multiplier:1.0,  harmonic_count:1, bandwidth_pct:0.12, confidence_weight:0.50,
      detection_note:"Dominant 1x shaft frequency component",
      iso_reference:"ISO 13379-1:2012 S5.2" },
    { rule_id:"r_misalign",    fault_type:"Shaft Misalignment",    category:"mechanical", requires:"vibration",
      freq_multiplier:2.0,  harmonic_count:3, bandwidth_pct:0.12, confidence_weight:0.45,
      detection_note:"Elevated 2x and 3x shaft frequency harmonics",
      iso_reference:"ISO 13379-1:2012 S5.3" },

    // -- BEARING FAULTS (detectable from vibration) -------------------------
    { rule_id:"r_bpfo", fault_type:"Bearing - Outer Race",         category:"bearing",   requires:"vibration",
      freq_multiplier:3.5,  harmonic_count:3, bandwidth_pct:0.15, confidence_weight:0.40,
      detection_note:"Ball pass frequency outer race harmonics; elevated kurtosis confirms impacting",
      iso_reference:"ISO 13379-1:2012 Annex A SA.3" },
    { rule_id:"r_bpfi", fault_type:"Bearing - Inner Race",         category:"bearing",   requires:"vibration",
      freq_multiplier:5.5,  harmonic_count:3, bandwidth_pct:0.15, confidence_weight:0.40,
      detection_note:"Ball pass frequency inner race harmonics with shaft-rate sidebands",
      iso_reference:"ISO 13379-1:2012 Annex A SA.3" },
    { rule_id:"r_bsf",  fault_type:"Bearing - Rolling Element",    category:"bearing",   requires:"vibration",
      freq_multiplier:2.4,  harmonic_count:2, bandwidth_pct:0.15, confidence_weight:0.30,
      detection_note:"Ball spin frequency - indicates rolling element surface defect",
      iso_reference:"ISO 13379-1:2012 Annex A SA.3" },
    { rule_id:"r_ftf",  fault_type:"Bearing - Cage Defect",        category:"bearing",   requires:"vibration",
      freq_multiplier:0.4,  harmonic_count:2, bandwidth_pct:0.20, confidence_weight:0.30,
      detection_note:"Fundamental train frequency - indicates cage wear or damage",
      iso_reference:"ISO 13379-1:2012 Annex A SA.3" },

    // -- ELECTRICAL FAULT INDICATORS (vibration-derived  -  indirect) ---------
    // These are detectable from vibration as the mechanical effects of electrical faults.
    // Confidence is lower than direct MCSA measurement. Labelled as "vibration-derived".
    { rule_id:"r_rotor_bar",   fault_type:"Electrical - Rotor Bar",    category:"electrical", requires:"vibration",
      freq_multiplier:1.0,  harmonic_count:4, bandwidth_pct:0.08, confidence_weight:0.30,
      detection_note:"Rotor bar defects create amplitude modulation at 1x +/- slip frequency. Vibration-derived indicator  -  confirm with MCSA.",
      iso_reference:"IEC 60034-14:2003 S5.2" },
    { rule_id:"r_stator_ecc",  fault_type:"Electrical - Stator Eccentricity", category:"electrical", requires:"vibration",
      freq_multiplier:2.0,  harmonic_count:2, bandwidth_pct:0.10, confidence_weight:0.25,
      detection_note:"Air gap variation from stator eccentricity produces vibration at twice line frequency (100/120 Hz). Vibration-derived indicator.",
      iso_reference:"IEC 60034-14:2003 S5.1" },

    // -- ELECTRICAL FAULTS REQUIRING MCSA/POWER DATA ------------------------
    // These CANNOT be determined from vibration alone. Shown as locked/greyed.
    { rule_id:"r_volt_unbal",  fault_type:"Voltage Unbalance",          category:"electrical", requires:"mcsa",
      freq_multiplier:null, harmonic_count:0, bandwidth_pct:0, confidence_weight:0,
      detection_note:"Requires voltage measurement data (Va, Vb, Vc). Cannot be derived from vibration.",
      iso_reference:"IEC 60034-14:2003 S5.4" },
    { rule_id:"r_curr_unbal",  fault_type:"Current Unbalance",          category:"electrical", requires:"mcsa",
      freq_multiplier:null, harmonic_count:0, bandwidth_pct:0, confidence_weight:0,
      detection_note:"Requires current measurement data (Ia, Ib, Ic). Cannot be derived from vibration.",
      iso_reference:"IEC 60034-14:2003 S5.4" },
    { rule_id:"r_pwr_factor",  fault_type:"Power Factor",               category:"process",    requires:"power",
      freq_multiplier:null, harmonic_count:0, bandwidth_pct:0, confidence_weight:0,
      detection_note:"Requires real and reactive power measurements. Cannot be derived from vibration.",
      iso_reference:"ISO 55001:2014 S8.1" },
    { rule_id:"r_active_pwr",  fault_type:"Active Power / Efficiency",  category:"process",    requires:"power",
      freq_multiplier:null, harmonic_count:0, bandwidth_pct:0, confidence_weight:0,
      detection_note:"Requires watt-meter or power analyser data. Cannot be derived from vibration.",
      iso_reference:"ISO 55001:2014 S8.1" }
  ],

  // -- data_type_detection  -  column name patterns that identify input type --
  data_type_detection: {
    vibration: ['accel','acc','vib','vibration','velocity','vel','amplitude','amp','rms','g','mm/s','signal'],
    mcsa:      ['current','ia','ib','ic','i_a','i_b','i_c','amps','ampere','phase_current'],
    voltage:   ['voltage','va','vb','vc','v_a','v_b','v_c','volt','v_line','vln'],
    power:     ['power','kw','watt','active_power','power_factor','pf','reactive','kva','kvars'],
    frequency: ['freq','frequency','hz','f_line']
  },
  unit_conversion_factors: [
    { from_unit:"mm/s", to_unit:"mm/s", multiplier:1.0,    offset:0, canonical_flag:1 },
    { from_unit:"m/s",  to_unit:"mm/s", multiplier:1000.0, offset:0, canonical_flag:0 },
    { from_unit:"in/s", to_unit:"mm/s", multiplier:25.4,   offset:0, canonical_flag:0 },
    { from_unit:"g",    to_unit:"mm/s", multiplier:null,   offset:0, canonical_flag:0 },
    { from_unit:"m/s2", to_unit:"mm/s", multiplier:null,   offset:0, canonical_flag:0 },
    { from_unit:"mg",   to_unit:"g",    multiplier:0.001,  offset:0, canonical_flag:0 }
  ],
  baseline_deviation_thresholds: [
    { classification:"Within Baseline",       sd_lower:0,   sd_upper:1.0, iso_reference:"ISO 13373-2:2016 S8.1" },
    { classification:"Minor Deviation",       sd_lower:1.0, sd_upper:2.0, iso_reference:"ISO 13373-2:2016 S8.1" },
    { classification:"Significant Deviation", sd_lower:2.0, sd_upper:3.5, iso_reference:"ISO 13373-2:2016 S8.1" },
    { classification:"Step-Change",           sd_lower:3.5, sd_upper:9999,iso_reference:"ISO 13373-2:2016 S8.1" }
  ],
  trend_state_rules: [
    { code:"SWB", label:"Stable Within Baseline",       slope_lower:-0.04, slope_upper:0.04,  sd_trigger:null, description:"Regression slope negligible.",                                   iso_reference:"ISO 13373-2:2016 S8.2" },
    { code:"DDU", label:"Deviating - Direction Unclear", slope_lower:null,  slope_upper:null,  sd_trigger:1.0,  description:"Single snapshot - trend direction cannot be established.",     iso_reference:"ISO 13373-2:2016 S8.2" },
    { code:"PRS", label:"Progressing - Steady",         slope_lower:0.04,  slope_upper:0.15,  sd_trigger:null, description:"Positive slope sustained. Maintenance planning recommended.", iso_reference:"ISO 13373-2:2016 S8.2" },
    { code:"PRA", label:"Progressing - Accelerating",   slope_lower:0.15,  slope_upper:9999,  sd_trigger:null, description:"Slope steepening. Corrective action required.",                iso_reference:"ISO 13373-2:2016 S8.2" },
    { code:"RGI", label:"Regressing - Improving",       slope_lower:-9999, slope_upper:-0.04, sd_trigger:null, description:"Consistent downward trend. Monitor to confirm.",               iso_reference:"ISO 13373-2:2016 S8.2" },
    { code:"SCO", label:"Step-Change Outside Baseline",  slope_lower:null,  slope_upper:null,  sd_trigger:3.5,  description:"Sudden departure. Manual review required.",                   iso_reference:"ISO 13373-2:2016 S8.2" }
  ],
  early_warning_rule: { trigger_deviation_classes:["Significant Deviation","Step-Change"], trigger_trend_states:["PRS","PRA"], trigger_zones:["A","B"], iso_reference:"ISO 13379-1:2012 S6.4" },
  rul_zone_base_days: [ { zone:"A", base_days:365, iso_reference:"ISO 13381-1:2015 S5.2" }, { zone:"B", base_days:180, iso_reference:"ISO 13381-1:2015 S5.2" }, { zone:"C", base_days:60, iso_reference:"ISO 13381-1:2015 S5.2" }, { zone:"D", base_days:7, iso_reference:"ISO 13381-1:2015 S5.2" } ],
  rul_trend_modifiers: [ { trend_code:"SWB", multiplier:1.00 }, { trend_code:"DDU", multiplier:0.90 }, { trend_code:"PRS", multiplier:0.65 }, { trend_code:"PRA", multiplier:0.40 }, { trend_code:"RGI", multiplier:1.30 }, { trend_code:"SCO", multiplier:0.20 } ],
  rul_ci_fraction: 0.22,
  kurtosis_thresholds: [ { label:"Normal", lower:0, upper:3.0, score_bonus:0, iso_reference:"ISO 13373-2:2016 S7.4" }, { label:"Minor impacting", lower:3.0, upper:4.0, score_bonus:15, iso_reference:"ISO 13373-2:2016 S7.4" }, { label:"Elevated", lower:4.0, upper:6.0, score_bonus:30, iso_reference:"ISO 13373-2:2016 S7.4" }, { label:"High impacting", lower:6.0, upper:9999, score_bonus:50, iso_reference:"ISO 13373-2:2016 S7.4" } ],
  crest_factor_thresholds: [ { label:"Normal", lower:0, upper:3.5, score_bonus:0, iso_reference:"ISO 13373-2:2016 S7.3" }, { label:"Elevated", lower:3.5, upper:5.0, score_bonus:10, iso_reference:"ISO 13373-2:2016 S7.3" }, { label:"High", lower:5.0, upper:9999, score_bonus:20, iso_reference:"ISO 13373-2:2016 S7.3" } ],
  monitoring_intervals: [ { condition:"zone_D", interval_desc:"Continuous until shutdown", iso_reference:"ISO 13373-1:2002 S7.3" }, { condition:"zone_C", interval_desc:"Daily", iso_reference:"ISO 13373-1:2002 S7.3" }, { condition:"trend_PRA", interval_desc:"Every 3 days", iso_reference:"ISO 13373-1:2002 S7.3" }, { condition:"trend_PRS", interval_desc:"Weekly", iso_reference:"ISO 13373-1:2002 S7.3" }, { condition:"zone_B_or_below", interval_desc:"Monthly", iso_reference:"ISO 13373-1:2002 S7.3" } ],
  minimum_fault_confidence_pct: 8,
  fault_display_limit: 6,
  ddu_min_samples: 500,
  rul_bar_scale_days: null,
  default_sample_rate_hz: 1000,
  shaft_freq_search_min_hz: 5,
  shaft_freq_search_max_hz: 200,
  harmonic_comb_count: 4,
  gravity_mm_s2: 9806.65,
  chatbot_config: { model_version:"claude-sonnet-4-20250514", max_output_tokens:1000, disclaimer_text:"AI-GENERATED ANALYSIS - IMPORTANT NOTICE: This output is intended to assist qualified maintenance and reliability engineers. It does not constitute a certified engineering determination. All corrective actions must be reviewed and authorised by a suitably qualified professional. Kairos Ventures Pte Ltd accepts no liability for any decision arising from reliance on this output without independent qualified engineering review." }
};


// AxiomAnare  -  Diagnostic Engine
// All logic runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // Load bearing library from Supabase on startup
  loadBearingLibrary();

// == CONFIG LOOKUP HELPERS ==
function getZonesForClass(id) {
  return CONFIG.iso_severity_zones.filter(z => z.class_id === id)
    .sort((a, b) => a.rms_lower_mm_s - b.rms_lower_mm_s);
}
function lookupZone(rms, id) {
  const z = getZonesForClass(id);
  return z.find(r => rms >= r.rms_lower_mm_s && rms < r.rms_upper_mm_s) || z[z.length - 1];
}
function classifyDeviation(sd) {
  return [...CONFIG.baseline_deviation_thresholds]
    .sort((a, b) => a.sd_lower - b.sd_lower)
    .find(t => sd >= t.sd_lower && sd < t.sd_upper)
    || CONFIG.baseline_deviation_thresholds[CONFIG.baseline_deviation_thresholds.length - 1];
}
function toCanonicalUnit(v, unit, hz) {
  const r = CONFIG.unit_conversion_factors.find(x => x.from_unit === unit);
  if (!r) return v;
  if (r.multiplier !== null) return v * r.multiplier;
  if (unit === 'g' && hz) return (v * CONFIG.gravity_mm_s2) / (2 * Math.PI * hz);
  if (unit === 'm/s2' && hz) return v / (2 * Math.PI * hz) * 1000;
  return v;
}
function calcRUL(zone, trend) {
  const b = CONFIG.rul_zone_base_days.find(r => r.zone === zone);
  const m = CONFIG.rul_trend_modifiers.find(r => r.trend_code === trend);
  const days = Math.max(3, Math.round((b?.base_days || 90) * (m?.multiplier || 1)));
  return { days, ci: Math.round(days * CONFIG.rul_ci_fraction), iso_reference: b?.iso_reference || 'ISO 13381-1:2015 S5.2' };
}
function getMonitoringInterval(zone, trend) {
  const c = { zone_D: zone==='D', zone_C: zone==='C', trend_PRA: trend==='PRA',
    trend_PRS: trend==='PRS', zone_B_or_below: ['A','B'].includes(zone) };
  return CONFIG.monitoring_intervals.find(r => c[r.condition]) || CONFIG.monitoring_intervals[CONFIG.monitoring_intervals.length-1];
}
function getCFLabel(cf) { return [...CONFIG.crest_factor_thresholds].sort((a,b)=>b.lower-a.lower).find(t=>cf>=t.lower)?.label||'Normal'; }
function getKLabel(k)  { return [...CONFIG.kurtosis_thresholds].sort((a,b)=>b.lower-a.lower).find(t=>k>=t.lower)?.label||'Normal'; }
function getCFBonus(cf) { return [...CONFIG.crest_factor_thresholds].sort((a,b)=>b.lower-a.lower).find(t=>cf>=t.lower)?.score_bonus||0; }
function getKBonus(k)  { return [...CONFIG.kurtosis_thresholds].sort((a,b)=>b.lower-a.lower).find(t=>k>=t.lower)?.score_bonus||0; }

// == STATE ==
let selClassId = CONFIG.iso_machine_classes[1].class_id;
let radarInst = null, fftInst = null, nvr = {};
let pendingFile = null, pendingRaw = null, pendingMatBuffer = false;

// == CLASS SELECTOR ==
function initClassSelector() {
  document.getElementById('class-grid').innerHTML = CONFIG.iso_machine_classes.map(c => `
    <div class="class-btn${c.class_id===selClassId?' selected':''}" data-id="${c.class_id}" onclick="selectClass('${c.class_id}')">
      <div class="cb-id">${c.display_label}</div>
      <div class="cb-desc">${c.machine_type_desc}</div>
      <div class="cb-kw">${c.power_kw_desc}</div>
      <div class="cb-mount">${c.mounting_type}</div>
    </div>`).join('');
}
window.selectClass = function(id) {
  selClassId = id;
  document.querySelectorAll('.class-btn').forEach(b => b.classList.toggle('selected', b.dataset.id === id));
  if (pendingFile) updateStep3Meta();
};
initClassSelector();

// == FILE HANDLING ==
window.onDrop = function(e) { e.preventDefault(); if (e.dataTransfer.files[0]) stageFile(e.dataTransfer.files[0]); };
document.getElementById('fileInput').addEventListener('change', function() { if (this.files[0]) stageFile(this.files[0]); });
document.getElementById('run-btn').addEventListener('click', runFromReady);
document.getElementById('new-upload-btn').addEventListener('click', resetApp);
document.getElementById('sample-link').addEventListener('click', loadSampleData);

function updateStep3Meta() {
  const c = CONFIG.iso_machine_classes.find(x => x.class_id === selClassId);
  document.getElementById('ready-class').textContent = c ? 'Class: ' + c.machine_type_desc : ' - ';
  document.getElementById('step3-note').textContent = c ? c.iso_standard_ref + ' . ' + c.mounting_type : ' - ';
}

function stageFile(file) {
  pendingFile = file; pendingRaw = null;
  const ext = file.name.split('.').pop().toLowerCase();
  const sz = file.size > 1048576 ? (file.size/1048576).toFixed(1)+' MB' : (file.size/1024).toFixed(1)+' KB';
  // Update drop zone
  document.getElementById('drop-glyph').textContent = '[OK]';
  document.getElementById('drop-title').textContent = file.name;
  document.getElementById('drop-sub').textContent = sz + ' . click to change';
  document.getElementById('select-btn').textContent = '^ Change File';
  // Populate Step 3
  document.getElementById('ready-filename').textContent = file.name;
  document.getElementById('ready-meta').textContent = sz + ' . .' + ext.toUpperCase();
  updateStep3Meta();
  // Mark steps done
  setStepDone('step1-num', true); setStepDone('step3-num', true);
  // Show Step 3
  const s3 = document.getElementById('step3-card');
  s3.style.display = 'block';
  setTimeout(() => s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
  // Read file
  if (['xlsx','xls'].includes(ext)) {
    const r = new FileReader();
    r.onload = ev => { try { const wb=XLSX.read(ev.target.result,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; pendingRaw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}).map(row=>row.join(',')).join('\n'); } catch(e){ showFileError('Cannot parse: '+e.message); } };
    r.onerror = () => showFileError('File read failed.');
    r.readAsArrayBuffer(file);
  } else if (ext === 'json') {
    const r = new FileReader();
    r.onload = ev => { try { const a=[].concat(JSON.parse(ev.target.result)); const k=Object.keys(a[0]); pendingRaw=[k.join(','),...a.map(row=>k.map(x=>row[x]).join(','))].join('\n'); } catch { pendingRaw=ev.target.result; } };
    r.onerror = () => showFileError('File read failed.');
    r.readAsText(file);
  } else if (ext === 'mat') {
    const r = new FileReader();
    r.onload = ev => {
      pendingRaw = ev.target.result;
      pendingMatBuffer = true;
      document.getElementById('ready-meta').textContent =
        (file.size/1024).toFixed(0)+'KB  MATLAB .mat  -  Drive End / Fan End channel will be extracted';
    };
    r.onerror = () => showFileError('Cannot read .mat file.');
    r.readAsArrayBuffer(file);
  } else {
    const r = new FileReader();
    r.onload = ev => { pendingRaw = ev.target.result; };
    r.onerror = () => showFileError('File read failed.');
    r.readAsText(file);
  }
}

function showFileError(msg) {
  const el = document.getElementById('ready-meta');
  el.textContent = '(!) ' + msg; el.style.color = 'var(--red)';
}

function runFromReady() {
  if (!pendingFile) return;
  if (!pendingRaw) { document.getElementById('ready-meta').textContent = 'Reading file...'; setTimeout(runFromReady, 300); return; }
  showProcessing(pendingFile.name);
  runPipeline(pendingRaw, pendingFile.name);
}

window.clearFile = function() {
  pendingFile = null; pendingRaw = null; pendingMatBuffer = false;
  document.getElementById('fileInput').value = '';
  document.getElementById('step3-card').style.display = 'none';
  document.getElementById('drop-glyph').textContent = '[folder]';
  document.getElementById('drop-title').textContent = 'Drop file here or click to browse';
  document.getElementById('drop-sub').textContent = 'Any column layout  -  auto-detected';
  document.getElementById('select-btn').textContent = '^ Browse File';
  setStepDone('step1-num', false); setStepDone('step3-num', false);
};

function setStepDone(id, done) {
  const el = document.getElementById(id);
  if (done) { el.classList.add('done'); el.textContent = '[check]'; }
  else { el.classList.remove('done'); el.textContent = id.replace('step','').replace('-num',''); }
}

// == SAMPLE DATA ==
function loadSampleData() {
  const fs = 10000, N = fs * 0.5;
  const shaftHz = 24.5;
  const bpfo = CONFIG.fault_frequency_rules.find(r => r.rule_id === 'r_bpfo');
  const imbal = CONFIG.fault_frequency_rules.find(r => r.rule_id === 'r_imbal');
  const bpfoHz = shaftHz * bpfo.freq_multiplier;
  const imbalHz = shaftHz * imbal.freq_multiplier;
  const lines = ['timestamp_s,velocity_mm_s'];
  for (let i = 0; i < N; i++) {
    const t = i / fs;
    const v = 1.2*Math.sin(2*Math.PI*imbalHz*t) + 0.5*Math.sin(2*Math.PI*imbalHz*2*t)
            + 2.8*Math.sin(2*Math.PI*bpfoHz*t)*(1+0.4*Math.sin(2*Math.PI*shaftHz*t))
            + (Math.random()-0.5)*0.28;
    lines.push(t.toFixed(5)+','+v.toFixed(4));
  }
  pendingRaw = lines.join('\n');
  pendingFile = { name: 'sample_bearing_fault_NDE_H.csv', size: pendingRaw.length };
  document.getElementById('drop-glyph').textContent = '[OK]';
  document.getElementById('drop-title').textContent = 'sample_bearing_fault_NDE_H.csv';
  document.getElementById('drop-sub').textContent = 'Synthetic BPFO bearing fault  -  '+Math.floor(N)+' samples @ 10 kHz';
  document.getElementById('ready-filename').textContent = 'sample_bearing_fault_NDE_H.csv';
  document.getElementById('ready-meta').textContent = 'Synthetic . '+Math.floor(N)+' samples @ 10 kHz';
  updateStep3Meta();
  setStepDone('step1-num', true); setStepDone('step3-num', true);
  const s3 = document.getElementById('step3-card');
  s3.style.display = 'block';
  setTimeout(() => s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
}

// == PIPELINE ==
async function runPipeline(raw, filename) {
  document.getElementById('proc-filename').textContent = filename;

  // Stage 1  -  Ingest
  await activateStage(1);
  // Route .mat files through dedicated MAT parser
  let parsed;
  if (pendingMatBuffer && raw instanceof ArrayBuffer) {
    parsed = parseMat(raw);
    pendingMatBuffer = false;
  } else {
    parsed = parseData(raw);
  }
  if (!parsed || parsed.values.length < 10) { doneStage(1,'QUARANTINED'); setNote('(!) Cannot extract numeric data.'); return; }
  const cu = CONFIG.unit_conversion_factors.find(r => r.canonical_flag === 1).to_unit;
  const sr = parsed.sampleRate || CONFIG.default_sample_rate_hz;
  // If user provided nameplate RPM, use it directly — skip FFT shaft detection uncertainty
  // Re-read form values fresh at run time — captures any unsubmitted input
  const rpmInput = document.getElementById('p-rpm');
  if (rpmInput && rpmInput.value) {
    const rpmVal = parseFloat(rpmInput.value);
    if (isFinite(rpmVal) && rpmVal > 0) machineParams.rpm = rpmVal;
  }
  const knownShaftHz = machineParams.rpm ? machineParams.rpm / 60.0 : null;
  if (knownShaftHz) console.log('Using nameplate shaft Hz:', knownShaftHz.toFixed(3), '(', machineParams.rpm, 'RPM)');
  // Detect what type of data we have from column headers
  const dataTypes = detectDataTypes(parsed.allHeaders || [parsed.colName]);
  const dataBanner = getDataTypeBanner(dataTypes);
  let vals;
  if (['g','m/s2','mg'].includes(parsed.unit)) {
    const rf = computeFFT(parsed.values, sr); const hz = detectShaft(rf);
    vals = parsed.values.map(v => toCanonicalUnit(v, parsed.unit, hz));
  } else { vals = parsed.values.map(v => toCanonicalUnit(v, parsed.unit, null)); }
  doneStage(1, vals.length+' samples . '+parsed.unit+'->'+cu);

  // Stage 2  -  Baseline
  await activateStage(2);
  const n = vals.length;
  const mean = vals.reduce((a,b)=>a+b,0)/n;
  const std  = Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/n) || 1;
  const rms  = Math.sqrt(vals.reduce((s,v)=>s+v*v,0)/n);
  let peak = 0; for (let i=0; i<vals.length; i++) { const a=Math.abs(vals[i]); if(a>peak) peak=a; }
  const cf   = peak/(rms||1);
  const kurt = vals.reduce((s,v)=>s+((v-mean)/std)**4,0)/n;
  const devSc = (rms-mean)/std;
  const devRow = classifyDeviation(Math.abs(devSc));
  doneStage(2, devRow.classification+' ('+devSc.toFixed(2)+'sigma)');

  // Stage 3  -  Trend (DDU for single file  -  cannot establish trend from one snapshot)
  await activateStage(3);
  const trendRow = CONFIG.trend_state_rules.find(r => r.code === 'DDU');
  doneStage(3, 'DDU  -  '+trendRow.label);

  // Stage 4  -  ISO Zone
  await activateStage(4);
  const zoneRow  = lookupZone(rms, selClassId);
  const classRow = CONFIG.iso_machine_classes.find(c => c.class_id === selClassId);
  const ew = CONFIG.early_warning_rule;
  const earlyWarn = ew.trigger_deviation_classes.includes(devRow.classification)
    && ew.trigger_trend_states.includes(trendRow.code)
    && ew.trigger_zones.includes(zoneRow.zone_label);
  doneStage(4, 'Zone '+zoneRow.zone_label+' . '+rms.toFixed(3)+' '+cu);

  // Stage 5  -  Fault Classification
  await activateStage(5);
  const fftR = computeFFT(vals, sr);
  // Use nameplate RPM if provided — physics is exact, no detection needed
  const shaftHz = knownShaftHz || detectShaft(fftR);
  if (knownShaftHz) console.log('Shaft locked to nameplate:', shaftHz.toFixed(3), 'Hz');
  // Yield to UI thread before heavy fault classification
  await new Promise(r => setTimeout(r, 50));
  // Use user-provided bearing multipliers if available, otherwise CONFIG defaults
  const activeFaultRules = getActiveFaultRules(machineParams);
  const allFaults = classifyFaults(fftR, cf, kurt, dataTypes, knownShaftHz, activeFaultRules);
  // Show: unlocked faults above confidence threshold + all locked faults (greyed out)
  const faults = [
    ...allFaults.filter(f => !f.locked && f.pct >= CONFIG.minimum_fault_confidence_pct),
    ...allFaults.filter(f => f.locked)
  ];
  doneStage(5, (faults[0]?.name||' - ')+' '+(faults[0]?.pct||0)+'%');

  // Stage 6  -  RUL
  await activateStage(6);
  const rulR = calcRUL(zoneRow.zone_label, trendRow.code);
  doneStage(6, 'RUL '+rulR.days+'d +/- '+rulR.ci+'d');
  setNote('Rendering results...');

  // Apply fault-zone override — ISO 13379-1 frequency findings take precedence
  const override = applyFaultOverride(zoneRow, rulR, faults, parseFloat(kurt.toFixed(2)), parseFloat(cf.toFixed(2)), classRow);
  const finalZoneRow = override.zoneRow;
  const finalRulR    = override.rulR;

  nvr = { filename, rms: rms.toFixed(3), peak: peak.toFixed(3), cf: cf.toFixed(2),
    dataTypes, dataBanner, machineParams: {...machineParams},
    kurt: kurt.toFixed(2), devSc: devSc.toFixed(2), devRow,
    zoneRow: finalZoneRow, trendRow,
    earlyWarn, faults: faults.length ? faults : allFaults.slice(0, CONFIG.fault_display_limit),
    fftR, rulR: finalRulR, n, sr, classRow, cu, shaftHz, singleFile: true,
    override };

  // Save to Supabase (non-blocking — runs in background)
  saveNVRToSupabase(nvr).catch(e => console.log('Supabase:', e.message));
  await new Promise(r => setTimeout(r, 250));
  document.getElementById('processing-screen').style.display = 'none';
  document.getElementById('results-screen').style.display = 'block';
  renderResults();
  streamClaude();
}

// == MACHINE PARAMETER FORM ==
window.toggleParams = function() {
  const form = document.getElementById('param-form');
  const sub = document.getElementById('param-toggle-sub');
  const isOpen = form.classList.contains('open');
  form.classList.toggle('open', !isOpen);
  sub.innerHTML = isOpen ? '&#9660; Expand' : '&#9650; Collapse';
};

window.onBearingInput = function(val) {
  const lookup = document.getElementById('bearing-lookup');
  const cleaned = val.trim().toUpperCase();
  // Try exact match first
  let found = BEARING_LIBRARY[val.trim()] || BEARING_LIBRARY['SKF ' + cleaned.replace('SKF','').trim()]
    || BEARING_LIBRARY['FAG ' + cleaned.replace('FAG','').trim()]
    || BEARING_LIBRARY['NSK ' + cleaned.replace('NSK','').trim()]
    || BEARING_LIBRARY['NTN ' + cleaned.replace('NTN','').trim()]
    || BEARING_LIBRARY['TIMKEN ' + cleaned.replace('TIMKEN','').trim()];
  // Try partial match
  if (!found) {
    const key = Object.keys(BEARING_LIBRARY).find(k => k.toUpperCase().includes(cleaned) || cleaned.includes(k.toUpperCase().replace(/[^0-9]/g,'')));
    if (key) found = BEARING_LIBRARY[key];
  }
  if (found && val.length > 3) {
    lookup.style.display = 'block';
    lookup.innerHTML = '[check] Found: BPFO=' + found.bpfo + 'x | BPFI=' + found.bpfi + 'x | BSF=' + found.bsf + 'x | FTF=' + found.ftf + 'x | ' + found.balls + ' balls | ' + found.note;
    machineParams.bpfoMult = found.bpfo;
    machineParams.bpfiMult = found.bpfi;
    machineParams.bsfMult  = found.bsf;
    machineParams.ftfMult  = found.ftf;
    machineParams.bearingModel = val.trim();
  } else if (val.length > 2) {
    lookup.style.display = 'block';
    lookup.innerHTML = 'Bearing not in library — using generic multipliers. Try: SKF 6205, FAG 6308, NSK 6204';
    lookup.style.color = 'var(--yellow)';
    machineParams.bpfoMult = null;
    machineParams.bpfiMult = null;
    machineParams.bsfMult  = null;
    machineParams.ftfMult  = null;
  } else {
    lookup.style.display = 'none';
  }
  onParamChange();
};

window.onParamChange = function() {
  const rpm = parseFloat(document.getElementById('p-rpm').value);
  const equip = document.getElementById('p-equip-type').value;
  machineParams.rpm = isFinite(rpm) && rpm > 0 ? rpm : null;
  machineParams.equipType = equip;
  machineParams.measPoint = document.getElementById('p-meas-point').value;
  machineParams.measAxis  = document.getElementById('p-axis').value;
  const load = document.getElementById('p-load').value;
  machineParams.loadPct = load ? parseInt(load) : null;
  const maint = document.getElementById('p-last-maint').value;
  machineParams.lastMaint = maint || null;
  // Count meaningful params entered
  const count = [machineParams.rpm, machineParams.bpfoMult, machineParams.equipType].filter(Boolean).length;
  machineParams.paramsEntered = count > 0;
  const acc = document.getElementById('param-accuracy');
  const accTxt = document.getElementById('param-accuracy-text');
  if (machineParams.paramsEntered) {
    acc.style.display = 'flex';
    const msgs = [];
    if (machineParams.rpm) msgs.push('RPM ' + machineParams.rpm + ' locked');
    if (machineParams.bpfoMult) msgs.push('exact bearing frequencies active');
    if (machineParams.equipType) msgs.push(machineParams.equipType + ' profile');
    accTxt.textContent = msgs.join(' | ') + ' — improved accuracy';
  } else {
    acc.style.display = 'none';
  }
  // Mark step 2 done if any params entered
  setStepDone('step2-num', machineParams.paramsEntered);
};

// == MAT FILE PARSER ==
// Self-contained MATLAB Level 5 MAT-file parser
// No external dependencies — handles CWRU and standard instrument exports
// Spec: https://www.mathworks.com/help/pdf_doc/matlab/matfile_format.pdf
function parseMat(arrayBuffer) {
  try {
    const buf = arrayBuffer;
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    // Verify MAT file header (first 116 bytes = description text)
    const header = String.fromCharCode(...bytes.slice(0,116)).trim();
    if (!header.includes('MATLAB')) throw new Error('Not a valid MATLAB .mat file');

    // Byte 126-127: version (0x0100) + endian indicator (MI = little endian)
    const littleEndian = (view.getUint16(126, true) === 0x4D49) ? false : true;
    // Most CWRU files are little-endian (PCWIN)
    const le = true;

    let offset = 128; // data starts after 128-byte header
    const variables = {};

    // Parse data elements
    while (offset < buf.byteLength - 8) {
      const dataType = view.getUint32(offset, le);
      const numBytes = view.getUint32(offset + 4, le);
      offset += 8;

      if (numBytes === 0 || dataType === 0) break;
      if (offset + numBytes > buf.byteLength) break;

      // miMATRIX = 14
      if (dataType === 14) {
        try {
          const varEnd = offset + numBytes;
          let pos = offset;

          // Array flags sub-element
          const flagsType = view.getUint32(pos, le);
          const flagsBytes = view.getUint32(pos+4, le);
          const arrayClass = bytes[pos+9] & 0xFF; // mxDOUBLE_CLASS=6, mxSINGLE_CLASS=7
          pos += 8 + flagsBytes;
          pos = Math.ceil(pos/8)*8; // pad to 8 bytes

          // Dimensions sub-element
          const dimType = view.getUint32(pos, le);
          const dimBytes = view.getUint32(pos+4, le);
          pos += 8;
          const dims = [];
          for (let d=0; d<dimBytes/4; d++) dims.push(view.getInt32(pos+d*4, le));
          pos += dimBytes;
          pos = Math.ceil(pos/8)*8;

          // Array name sub-element
          const nameType = view.getUint32(pos, le);
          const nameBytes = view.getUint32(pos+4, le);
          pos += 8;
          let varName = '';
          for (let n=0; n<nameBytes; n++) {
            const c = bytes[pos+n];
            if (c > 0) varName += String.fromCharCode(c);
          }
          pos += nameBytes;
          pos = Math.ceil(pos/8)*8;

          // Real data sub-element
          if (pos < varEnd) {
            const realType = view.getUint32(pos, le);
            const realBytes = view.getUint32(pos+4, le);
            pos += 8;

            const totalElements = dims.reduce((a,b)=>a*b, 1);
            const values = new Float64Array(totalElements);

            if (arrayClass === 6 && realType === 9) {
              // mxDOUBLE_CLASS, miDOUBLE
              for (let i=0; i<totalElements && i<realBytes/8; i++) {
                values[i] = view.getFloat64(pos + i*8, le);
              }
            } else if (arrayClass === 7 && realType === 7) {
              // mxSINGLE_CLASS, miSINGLE
              for (let i=0; i<totalElements && i<realBytes/4; i++) {
                values[i] = view.getFloat32(pos + i*4, le);
              }
            } else if (realType === 9) {
              // miDOUBLE with any class
              for (let i=0; i<totalElements && i<realBytes/8; i++) {
                values[i] = view.getFloat64(pos + i*8, le);
              }
            }

            if (varName && totalElements > 10) {
              variables[varName] = Array.from(values);
            }
          }
        } catch(innerErr) {
          // Skip malformed element
        }
      }

      // Advance to next element (pad to 8 bytes)
      offset += numBytes;
      if (numBytes % 8 !== 0) offset += 8 - (numBytes % 8);
    }

    const keys = Object.keys(variables);
    console.log('MAT variables parsed:', keys, 'sizes:', keys.map(k=>variables[k].length));

    if (keys.length === 0) throw new Error('No numeric arrays found in MAT file');

    // CWRU channel priority: Drive End > Fan End > Base > largest array
    const deKey  = keys.find(k => /DE_time|_de_time/i.test(k));
    const feKey  = keys.find(k => /FE_time|_fe_time/i.test(k));
    const baKey  = keys.find(k => /BA_time|_ba_time/i.test(k));
    const rpmKey = keys.find(k => /rpm|speed/i.test(k));

    // Fallback: pick largest array (most likely to be vibration waveform)
    const largestKey = keys.reduce((a,b) => variables[a].length >= variables[b].length ? a : b);
    const chosenKey = deKey || feKey || baKey || largestKey;

    const values = variables[chosenKey].filter(v => isFinite(v));
    if (values.length < 100) throw new Error('Too few samples in '+chosenKey+': '+values.length);

    const rpm = rpmKey ? variables[rpmKey][0] : null;
    const channelType = deKey?'Drive End':feKey?'Fan End':baKey?'Base':'Primary';

    console.log('Using channel:', chosenKey, '| Samples:', values.length, '| Type:', channelType);

    return {
      values,
      colName: chosenKey,
      unit: 'g',
      sampleRate: 12000,
      allHeaders: keys,
      rpmDetected: rpm,
      channelUsed: chosenKey,
      channelType
    };
  } catch(e) {
    console.error('MAT parse error:', e.message);
    return null;
  }
}

// == DATA PARSER ==
function parseData(raw) {
  let rows=[], headers=[], numCols=[];
  try {
    const r = Papa.parse(raw.trim(), {header:true, dynamicTyping:true, skipEmptyLines:true});
    if (r.data?.length > 5) { rows=r.data; headers=r.meta.fields||[]; numCols=headers.filter(h=>rows.slice(0,20).filter(row=>typeof row[h]==='number'&&isFinite(row[h])).length>10); }
  } catch(e) {}
  if (!numCols.length) {
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 5) return null;
    headers = lines[0].split(/[\t,;]/);
    rows = lines.slice(1).map(l => { const p=l.split(/[\t,;]/),o={}; headers.forEach((h,i)=>{const v=parseFloat(p[i]);o[h]=isFinite(v)?v:p[i];}); return o; });
    numCols = headers.filter(h => rows.slice(0,20).filter(r=>typeof r[h]==='number'&&isFinite(r[h])).length > 10);
  }
  if (!numCols.length) return null;
  const tsN=['time','timestamp','t','date','seconds','ms','index','sample','i','n'];
  // Prioritise acceleration columns — best for fault detection
  // Velocity is acceptable fallback, but accel gives stronger bearing signatures
  const accelNames=['accel','acc','acceleration','g_rms','_g'];
  const vbN=['accel','acc','vib','vibration','amplitude','amp','signal','ch','chan','sensor','x','y','z'];
  const velN=['velocity','vel','mm_s','mm/s'];
  let col = numCols.find(c=>accelNames.some(p=>c.toLowerCase().includes(p)))
         || numCols.find(c=>vbN.some(p=>c.toLowerCase().includes(p)))
         || numCols.find(c=>velN.some(p=>c.toLowerCase().includes(p)))
         || numCols.find(c=>!tsN.some(p=>c.toLowerCase().includes(p)))
         || numCols[numCols.length>1?1:0];
  const values = rows.map(r=>r[col]).filter(v=>typeof v==='number'&&isFinite(v));
  if (values.length < 10) return null;
  const cl = col.toLowerCase();
  let unit = 'g'; // default: assume acceleration in g
  if (cl.includes('velocity')||cl.includes('vel_')||cl.includes('_vel')||cl==='vel') unit='mm/s';
  else if (cl.includes('mm_s')||cl==='mm/s') unit='mm/s';
  else if (cl.includes('m/s2')||cl.includes('ms2')) unit='m/s2';
  else if (cl.includes('mg')&&!cl.includes('img')) unit='mg';
  // acceleration_g, accel, acc, g -> stay as 'g'
  let sr = CONFIG.default_sample_rate_hz;
  const tc = headers.find(h=>tsN.some(p=>h.toLowerCase()===p||h.toLowerCase().startsWith(p)));
  if (tc) { const ts=rows.slice(0,10).map(r=>parseFloat(r[tc])).filter(isFinite); if(ts.length>2){const dt=ts[1]-ts[0];if(dt>0&&dt<1)sr=Math.round(1/dt);else if(dt>=1&&dt<1000)sr=Math.round(1000/dt);} }
  return { values, colName: col, unit, sampleRate: sr, allHeaders: headers };
}

// == FFT ==
function computeFFT(signal, fs) {
  const N = Math.pow(2, Math.floor(Math.log2(Math.min(signal.length, 4096))));
  const w = signal.slice(0,N).map((v,i) => v*(0.5-0.5*Math.cos(2*Math.PI*i/(N-1))));
  function fft(re,im){const n=re.length;if(n<=1)return;const ee=[],eo=[],ie=[],io=[];for(let i=0;i<n/2;i++){ee.push(re[2*i]);eo.push(re[2*i+1]);ie.push(im[2*i]);io.push(im[2*i+1]);}fft(ee,ie);fft(eo,io);for(let k=0;k<n/2;k++){const a=-2*Math.PI*k/n,c=Math.cos(a),s=Math.sin(a),tr=c*eo[k]-s*io[k],ti=c*io[k]+s*eo[k];re[k]=ee[k]+tr;im[k]=ie[k]+ti;re[k+n/2]=ee[k]-tr;im[k+n/2]=ie[k]-ti;}}
  const re=[...w],im=new Array(N).fill(0); fft(re,im);
  const freqs=[],mags=[];
  for(let k=0;k<N/2;k++){freqs.push(k*fs/N);mags.push(Math.sqrt(re[k]**2+im[k]**2)/(N/2));}
  const sRms = Math.sqrt(mags.reduce((s,m)=>s+m*m,0)/mags.length);
  return {freqs,mags,fs,N,sRms};
}

// == SHAFT DETECTION  -  harmonic comb search ==
function detectShaft(fft) {
  const {freqs,mags,sRms} = fft;
  const fMin=CONFIG.shaft_freq_search_min_hz, fMax=CONFIG.shaft_freq_search_max_hz, n=CONFIG.harmonic_comb_count, bw=0.08;
  function peak(fc){const lo=fc*(1-bw),hi=fc*(1+bw);let mx=0;for(let i=0;i<freqs.length;i++){if(freqs[i]>hi)break;if(freqs[i]>=lo&&mags[i]>mx)mx=mags[i];}return mx;}
  // Find global max in search range to set adaptive threshold
  let rangeMax=0;
  for(let i=0;i<freqs.length;i++){if(freqs[i]>=fMin&&freqs[i]<=fMax&&mags[i]>rangeMax)rangeMax=mags[i];}
  const threshold = rangeMax * 0.05; // 5% of range peak — much more sensitive
  const cands=[];
  for(let i=1;i<freqs.length-1;i++){const f=freqs[i];if(f<fMin||f>fMax)continue;if(mags[i]>mags[i-1]&&mags[i]>mags[i+1]&&mags[i]>threshold)cands.push(f);}
  if(!cands.length)return (fMin+fMax)/2;
  let best=cands[0],bestS=-1;
  for(const fc of cands){if(fc*n>fft.fs/2)continue;let s=0;for(let h=1;h<=n;h++)s+=peak(fc*h);s*=(fc>fMax*0.5?0.85:1.0);if(s>bestS){bestS=s;best=fc;}}
  return best;
}

// == DATA TYPE DETECTOR ==
// Inspects column headers to determine what kind of data was uploaded.
// Returns a set of available data types: 'vibration', 'mcsa', 'voltage', 'power', 'frequency'
function detectDataTypes(headers) {
  const available = new Set();
  const det = CONFIG.data_type_detection;
  const hl = headers.map(h => h.toLowerCase());
  Object.entries(det).forEach(([type, patterns]) => {
    if (hl.some(h => patterns.some(p => h.includes(p)))) available.add(type);
  });
  // Always assume vibration if any numeric data present  -  it's the default input
  if (available.size === 0) available.add('vibration');
  return available;
}

// Returns a human-readable banner message about what data was detected
function getDataTypeBanner(dataTypes) {
  const has = t => dataTypes.has(t);
  if (has('mcsa') && has('vibration')) return { type:'combined', msg:'Vibration + MCSA data detected. Full mechanical and electrical fault analysis available.' };
  if (has('power') && has('vibration')) return { type:'combined', msg:'Vibration + Power monitoring data detected. Mechanical and process fault analysis available.' };
  if (has('mcsa')) return { type:'mcsa', msg:'MCSA / electrical data detected. Electrical fault analysis available. Vibration-based faults require acceleration or velocity data.' };
  if (has('power')) return { type:'power', msg:'Power monitoring data detected. Process fault analysis available.' };
  return { type:'vibration', msg:'Vibration data detected. Mechanical and bearing fault analysis will run. Electrical and process fault categories require MCSA or power meter data  -  not shown.' };
}

// == ACTIVE FAULT RULES — merges user bearing params with CONFIG defaults ==
function getActiveFaultRules(params) {
  return CONFIG.fault_frequency_rules.map(rule => {
    const r = {...rule}; // copy
    // Override multipliers if user provided bearing geometry
    if (params.bpfoMult && rule.rule_id === 'r_bpfo') r.freq_multiplier = params.bpfoMult;
    if (params.bpfiMult && rule.rule_id === 'r_bpfi') r.freq_multiplier = params.bpfiMult;
    if (params.bsfMult  && rule.rule_id === 'r_bsf')  r.freq_multiplier = params.bsfMult;
    if (params.ftfMult  && rule.rule_id === 'r_ftf')  r.freq_multiplier = params.ftfMult;
    return r;
  });
}

// == FAULT-ZONE OVERRIDE ENGINE ==
// ISO 13379-1:2012 §5.4 — frequency-domain findings take precedence over RMS zone
// when fault confidence exceeds threshold. The worst finding always governs.
function applyFaultOverride(zoneRow, rulR, faults, kurt, cf, classRow) {
  const result = {
    zoneRow:    { ...zoneRow },
    rulR:       { ...rulR },
    overrideActive: false,
    overrideReason: null,
    overrideISO:    null,
    healthScore:    null  // 0-100, lower = worse
  };

  // Find dominant unlocked fault
  const unlockedFaults = faults.filter(f => !f.locked);
  const topFault = unlockedFaults[0];
  const topPct = topFault?.pct || 0;
  const topName = topFault?.name || '';
  const isBearing = topFault?.category === 'bearing';
  const isMechanical = topFault?.category === 'mechanical';

  // ── Rule 1: Bearing fault override ──
  // ISO 13379-1:2012 §5.4: bearing fault frequency indicators
  // take precedence over broadband severity assessment
  if (isBearing && topPct >= 60) {
    result.overrideActive = true;
    // Upgrade zone if currently A or B with high fault score
    if (zoneRow.zone_label === 'A' || (zoneRow.zone_label === 'B' && topPct >= 80)) {
      result.zoneRow = {
        ...zoneRow,
        zone_label: topPct >= 80 ? 'C' : 'B',
        action_required: topPct >= 80
          ? 'BEARING FAULT DETECTED — Corrective maintenance required. RMS underestimates severity for impulsive faults.'
          : 'BEARING FAULT DETECTED — Schedule inspection. Frequency analysis indicates bearing defect despite low RMS.',
        urgency: topPct >= 80 ? 'CORRECTIVE' : 'SCHEDULED'
      };
      // Shorten RUL based on fault severity
      const rulFactor = topPct >= 80 ? 0.4 : 0.6;
      result.rulR = {
        ...rulR,
        days: Math.round(rulR.days * rulFactor),
        ci:   Math.round(rulR.ci   * rulFactor),
        overridden: true
      };
    }
    result.overrideReason = `Bearing fault detected at ${topPct}% confidence (${topName}) — ISO 13379-1 frequency analysis overrides RMS-based zone assessment`;
    result.overrideISO = 'ISO 13379-1:2012 §5.4 | ISO 13373-2:2016 §8.3';
  }

  // ── Rule 2: Kurtosis override ──
  // ISO 13373-2:2016 §8.3: elevated kurtosis indicates impulsive fault
  // even when RMS is low
  if (kurt >= 4.0 && !result.overrideActive) {
    result.overrideActive = true;
    result.overrideReason = `Elevated kurtosis (${kurt.toFixed(2)}) indicates impulsive fault activity — ISO 13373-2 §8.3`;
    result.overrideISO = 'ISO 13373-2:2016 §8.3';
    if (zoneRow.zone_label === 'A') {
      result.zoneRow = {
        ...zoneRow,
        action_required: 'Elevated kurtosis detected. Impulsive fault activity present despite low RMS. Inspect bearing condition.',
        urgency: 'SCHEDULED'
      };
    }
  }

  // ── Rule 3: Dominant score override ──
  // Whenever one fault score is significantly higher than all others,
  // that score drives the health status regardless of absolute level
  if (unlockedFaults.length >= 2) {
    const score1 = unlockedFaults[0]?.pct || 0;
    const score2 = unlockedFaults[1]?.pct || 0;
    const dominance = score1 - score2;
    if (dominance >= 20 && score1 >= 40) {
      // Clear dominant fault — this drives the diagnosis
      if (!result.overrideActive) {
        result.overrideReason = `${topName} is dominant at ${score1}% (${dominance}% above next fault) — ISO 13379-1 Annex A §A.3`;
        result.overrideISO = 'ISO 13379-1:2012 Annex A §A.3';
      }
    }
  }

  // ── Compute health score 0-100 (100=perfect, 0=critical) ──
  const zoneScores = { 'A': 95, 'B': 70, 'C': 35, 'D': 5 };
  const zoneHealth = zoneScores[result.zoneRow.zone_label] || 70;
  const faultPenalty = Math.min(60, topPct * 0.6);
  const kurtPenalty  = kurt > 4 ? Math.min(15, (kurt-3)*5) : 0;
  result.healthScore = Math.max(5, Math.round(zoneHealth - faultPenalty - kurtPenalty));

  return result;
}

// == FAULT CLASSIFICATION ==
function classifyFaults(fft, cf, kurt, dataTypes, knownShaftHz, faultRules) {
  const {freqs,mags,sRms} = fft;
  // Use user-provided RPM for precise fault frequencies if available
  const shaft = knownShaftHz || detectShaft(fft);
  const rules = faultRules || CONFIG.fault_frequency_rules;
  // Peak magnitude in band — more sensitive to tonal fault peaks
  // Binary search to find band start index — O(log n) instead of O(n)
  function findIdx(target){let lo=0,hi=freqs.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(freqs[mid]<target)lo=mid+1;else hi=mid;}return lo;}
  function bE(fc,bw){
    const lo=fc*(1-bw),hi=fc*(1+bw);
    const start=findIdx(lo);
    let mx=0;
    for(let i=start;i<freqs.length&&freqs[i]<=hi;i++){if(mags[i]>mx)mx=mags[i];}
    return mx;
  }
  const cfB=getCFBonus(cf), kB=getKBonus(kurt);
  const bearIds=new Set(['r_bpfo','r_bpfi','r_bsf','r_ftf']);
  // Peak spectral magnitude — more stable normalisation than RMS
  // Use spectral RMS as base — prevents noise from inflating scores
  // specPeak/sRms = SNR — high SNR means strong tonal fault present
  let specPeak=0; for(let i=0;i<mags.length;i++){if(mags[i]>specPeak)specPeak=mags[i];}
  // Mean magnitude = noise floor reference — fault bands must be above this to score
  const meanMag = mags.reduce((a,b)=>a+b,0)/mags.length;
  const base = meanMag||sRms||1;
  const snr = specPeak/base;

  return CONFIG.fault_frequency_rules.map(rule => {
    const req = rule.requires;

    // -- Rules that require data we don't have -> locked --
    const hasRequired =
      (req === 'vibration' && dataTypes.has('vibration')) ||
      (req === 'mcsa'      && (dataTypes.has('mcsa') || dataTypes.has('voltage'))) ||
      (req === 'power'     && dataTypes.has('power'));

    if (!hasRequired) {
      return {
        name: rule.fault_type, category: rule.category,
        pct: 0, locked: true,
        lock_reason: rule.detection_note,
        iso_reference: rule.iso_reference,
        freq_hz: null, harmonics_used: 0
      };
    }

    // -- Vibration-derived electrical indicators --
    const isVibDerived = (rule.category === 'electrical' && req === 'vibration');

    // -- Rules with no frequency (shouldn't reach here, but guard) --
    if (!rule.freq_multiplier) {
      return { name:rule.fault_type, category:rule.category, pct:2, locked:false,
               iso_reference:rule.iso_reference, freq_hz:null, harmonics_used:0 };
    }

    const fc = shaft * rule.freq_multiplier;
    if (fc > fft.fs / 2) {
      return { name:rule.fault_type, category:rule.category, pct:2, locked:false,
               iso_reference:rule.iso_reference, freq_hz:fc, harmonics_used:0 };
    }

    let tot=0, h2=0;
    for(let h=1;h<=rule.harmonic_count;h++){
      const fh=fc*h; if(fh>fft.fs/2)break;
      tot+=bE(fh,rule.bandwidth_pct); h2++;
    }
    if (!h2) return { name:rule.fault_type, category:rule.category, pct:2, locked:false,
                      iso_reference:rule.iso_reference, freq_hz:fc, harmonics_used:0 };

    // Band Energy Ratio scoring — industry standard approach
    // Compare fault band energy against background bands at same spacing
    const bw = rule.bandwidth_pct;
    const bgBand1 = bE(fc * 0.7, bw);
    const bgBand2 = bE(fc * 1.3, bw);
    const bgBand3 = bE(fc * 0.5, bw);
    const bgMean = (bgBand1 + bgBand2 + bgBand3) / 3 || base;
    const ber = tot / (bgMean || base);
    let relScore = Math.min(90, Math.max(2, Math.round((ber - 1) * 15 * rule.confidence_weight)));

    // ── Loose Foundation special rule ──
    // ISO 13379-1:2012 §5.4: loose foundation produces sub-harmonics (0.5x shaft)
    // Normal motors also produce shaft harmonics — require sub-harmonic evidence
    if (rule.rule_id === 'r_loose_foundation') {
      const subHarmonic = bE(shaft * 0.5, 0.1);  // 0.5x shaft
      const subHarmonicRatio = subHarmonic / (bgMean || base);
      // Only score high if sub-harmonic is present (ratio > 1.5)
      if (subHarmonicRatio < 1.5) {
        relScore = Math.min(relScore, 25); // cap at 25% without sub-harmonic
      }
    }

    let sc = Math.round(relScore);
    if (bearIds.has(rule.rule_id)) sc += Math.round((cfB+kB)*rule.confidence_weight*0.5);
    // Vibration-derived electrical: cap confidence lower  -  it's indirect
    const cap = isVibDerived ? 65 : 95;

    return {
      name: rule.fault_type, category: rule.category,
      pct: Math.min(cap, Math.max(2, sc)),
      locked: false,
      vibration_derived: isVibDerived || false,
      iso_reference: rule.iso_reference,
      freq_hz: fc, harmonics_used: h2,
      detection_note: isVibDerived ? rule.detection_note : null
    };
  }).sort((a,b) => {
    // Locked faults go to end; within each group sort by score
    if (a.locked && !b.locked) return 1;
    if (!a.locked && b.locked) return -1;
    return b.pct - a.pct;
  });
}

// == UI HELPERS ==
function showProcessing(fn) {
  document.getElementById('upload-screen').style.display='none';
  document.getElementById('processing-screen').style.display='flex';
  document.getElementById('results-screen').style.display='none';
  document.getElementById('proc-filename').textContent=fn;
  for(let i=1;i<=6;i++){document.getElementById('stage-'+i).className='stage-item';document.getElementById('s'+i+'-st').textContent=' - ';}
}
function setNote(t){document.getElementById('proc-note').textContent=t;}
async function activateStage(n){
  await new Promise(r=>setTimeout(r,280));
  const el=document.getElementById('stage-'+n);
  el.className='stage-item active';
  el.querySelector('.s-num').innerHTML='<div class="spinner"></div>';
  document.getElementById('s'+n+'-st').textContent='Running...';
  await new Promise(r=>setTimeout(r,450+Math.random()*280));
}
function doneStage(n,msg){const el=document.getElementById('stage-'+n);el.className='stage-item done';el.querySelector('.s-num').textContent=n;document.getElementById('s'+n+'-st').textContent=msg;}

function resetApp(){
  pendingFile=null;pendingRaw=null;
  document.getElementById('fileInput').value='';
  document.getElementById('upload-screen').style.display='flex';
  document.getElementById('processing-screen').style.display='none';
  document.getElementById('results-screen').style.display='none';
  document.getElementById('step3-card').style.display='none';
  document.getElementById('drop-glyph').textContent='[folder]';
  document.getElementById('drop-title').textContent='Drop file here or click to browse';
  document.getElementById('drop-sub').textContent='Any column layout  -  auto-detected';
  document.getElementById('select-btn').textContent='^ Browse File';
  setStepDone('step1-num',false); setStepDone('step2-num',false);
  document.getElementById('reco-text').textContent='';
  document.getElementById('reco-text').classList.add('typing');
  document.getElementById('ew-banner').classList.remove('show');
  if(radarInst){radarInst.destroy();radarInst=null;}
  if(fftInst){fftInst.destroy();fftInst=null;}
}

// == RENDER ==
function renderResults(){
  const d=nvr;
  const zC={A:'var(--green)',B:'#1a6bbf',C:'var(--yellow)',D:'var(--red)'};
  document.getElementById('results-meta').innerHTML='File: <span>'+d.filename+'</span> &nbsp;.&nbsp; Class: <span>'+d.classRow.machine_type_desc+'</span>';
  const cfL=getCFLabel(parseFloat(d.cf)), kL=getKLabel(parseFloat(d.kurt));
  const tips = {
    'RMS Velocity': 'The overall vibration energy level  -  the most important single number. Higher = more vibration. Compared against ISO limits to determine your severity zone.',
    'Peak': 'The highest instantaneous vibration spike in the data. High peak with low RMS can indicate intermittent impact faults like bearing defects.',
    'Crest Factor': 'Peak divided by RMS. A healthy machine is typically 2.5 - 3.5. Above 5 = impacting faults likely (e.g. bearing damage). Think of it as a measure of how spiky the signal is.',
    'Kurtosis': 'A statistical measure of how sharp the vibration peaks are. Normal machinery = around 3. Above 6 = strong evidence of bearing impact faults. Your value here is key.',
    'Deviation': 'How far the current RMS is from the learned baseline  -  measured in standard deviations (sigma). Above 2sigma = Significant Deviation. Above 3.5sigma = Step-Change anomaly.',
    'Samples': 'Total data points analysed and the sampling rate. Higher sample rates capture higher-frequency faults like bearing defects more accurately.'
  };
  document.getElementById('nvr-grid').innerHTML=[
    {lb:'RMS Velocity',v:d.rms,u:d.cu,c:zC[d.zoneRow.zone_label]||'var(--text)'},
    {lb:'Peak',v:d.peak,u:d.cu,c:'var(--text)'},
    {lb:'Crest Factor',v:d.cf,u:cfL,c:cfL==='High'?'var(--orange)':cfL==='Elevated'?'var(--yellow)':'var(--text)'},
    {lb:'Kurtosis',v:d.kurt,u:kL,c:kL==='High impacting'?'var(--orange)':kL==='Elevated'?'var(--yellow)':'var(--text)'},
    {lb:'Deviation',v:d.devSc+'sigma',u:d.devRow.classification,c:['Significant Deviation','Step-Change'].includes(d.devRow.classification)?'var(--orange)':'var(--green)'},
    {lb:'Samples',v:d.n.toLocaleString(),u:(d.sr/1000).toFixed(1)+' kHz',c:'var(--accent)'},
  ].map(i=>'<div class="nvr-item"><div class="nvr-label"><span class="tip">'+i.lb+'<span class="tip-box">'+tips[i.lb]+'</span></span></div><div class="nvr-val" style="color:'+i.c+'">'+i.v+'</div><div class="nvr-unit">'+i.u+'</div></div>').join('');
  document.getElementById('nvr-clauses').innerHTML='<span class="clause">'+d.devRow.iso_reference+'</span><span class="clause">ISO 13373-1:2002 S5.2</span>';
  document.querySelectorAll('.zone-seg').forEach(el=>el.classList.toggle('current',el.dataset.z===d.zoneRow.zone_label));
  document.getElementById('zone-desc').textContent=d.zoneRow.action_required;
  document.getElementById('zone-iso-clause').textContent=d.zoneRow.iso_clause_ref;
  const rs=CONFIG.rul_bar_scale_days||Math.max(...CONFIG.rul_zone_base_days.map(r=>r.base_days));
  const rc=d.rulR.days<30?'var(--red)':d.rulR.days<90?'var(--orange)':d.rulR.days<180?'var(--yellow)':'var(--green)';
  document.getElementById('rul-num').textContent=d.rulR.days+'d';
  document.getElementById('rul-num').style.color=rc;
  document.getElementById('rul-ci').textContent='+/- '+d.rulR.ci+'d CI';
  document.getElementById('rul-scale-label').textContent=rs+'d';
  const pct=Math.min(95,Math.max(5,(d.rulR.days/rs)*100));
  const arr=document.getElementById('rul-arrow');arr.style.left=pct+'%';arr.style.background=rc;
  document.getElementById('rul-clauses').innerHTML='<span class="clause">'+d.rulR.iso_reference+'</span><span class="clause">ISO 55001:2014 S6.1</span>';
  const tC={SWB:'b-green',DDU:'b-blue',PRS:'b-yellow',PRA:'b-red',RGI:'b-green',SCO:'b-red'};
  document.getElementById('trend-badge').textContent=d.trendRow.code+'  -  '+d.trendRow.label;
  document.getElementById('trend-badge').className='badge '+(tC[d.trendRow.code]||'b-blue');
  if(d.earlyWarn){document.getElementById('ew-banner').classList.add('show');document.getElementById('ew-desc').textContent=d.devRow.classification+' ('+d.devSc+'sigma) + '+d.trendRow.code+' in Zone '+d.zoneRow.zone_label;document.getElementById('ew-clause').innerHTML='<span class="clause">'+CONFIG.early_warning_rule.iso_reference+'</span>';}
  const fp=['var(--red)','var(--orange)','var(--yellow)','var(--accent)','var(--green)','var(--muted)'];
  // Data type banner
  const bannerEl = document.getElementById('data-type-banner');
  if (bannerEl && d.dataBanner) {
    bannerEl.textContent = d.dataBanner.msg;
    bannerEl.style.display = 'flex';
    bannerEl.className = 'data-banner data-banner-'+d.dataBanner.type;
  }

  // Fault override warning banner
  let overrideBanner = document.getElementById('override-banner');
  if (!overrideBanner) {
    overrideBanner = document.createElement('div');
    overrideBanner.id = 'override-banner';
    overrideBanner.style.cssText = 'display:none;padding:10px 16px;background:rgba(220,50,50,0.15);border:1px solid rgba(220,50,50,0.4);border-radius:8px;font-family:"IBM Plex Mono",monospace;font-size:11px;color:#e87070;margin-bottom:12px;line-height:1.5;';
    const dataBanner = document.getElementById('data-type-banner');
    if (dataBanner && dataBanner.parentNode) {
      dataBanner.parentNode.insertBefore(overrideBanner, dataBanner.nextSibling);
    }
  }
  if (d.override && d.override.overrideActive) {
    overrideBanner.style.display = 'block';
    overrideBanner.innerHTML = '&#9888;&nbsp;<strong>FAULT OVERRIDE ACTIVE</strong> — '
      + d.override.overrideReason
      + '&nbsp;&nbsp;<span style="opacity:0.6;font-size:10px;">'
      + (d.override.overrideISO || '') + '</span>';
  } else {
    overrideBanner.style.display = 'none';
  }

  // Fault bars  -  unlocked faults in colour, locked faults greyed with lock icon
  const unlockedFaults = d.faults.filter(f => !f.locked);
  const lockedFaults   = d.faults.filter(f => f.locked);

  const unlockedHtml = unlockedFaults.slice(0, CONFIG.fault_display_limit).map((f,i) => {
    const col = fp[Math.min(i, fp.length-1)];
    const derivedTag = f.vibration_derived
      ? '<span style="font-size:8px;background:rgba(179,106,0,0.12);color:var(--yellow);border-radius:3px;padding:1px 5px;margin-left:5px;font-family:IBM Plex Mono,monospace;">vibration-derived</span>'
      : '';
    return '<div class="fault-item">'
      + '<div class="fault-name" style="color:'+col+';">'+f.name+derivedTag+'</div>'
      + '<div class="fault-bar-wrap"><div class="fault-bar-fill" style="background:'+col+';" data-w="'+f.pct+'"></div></div>'
      + '<div class="fault-pct" style="color:'+col+';">'+f.pct+'%</div>'
      + '</div>';
  }).join('');

  const lockedHtml = lockedFaults.slice(0, 4).map(f =>
    '<div class="fault-item fault-locked">'
    + '<div class="fault-name" style="color:var(--dim);">[lock] '+f.name+'</div>'
    + '<div class="fault-bar-wrap"><div style="height:100%;background:var(--surface3);border-radius:3px;width:100%;"></div></div>'
    + '<div class="fault-pct" style="color:var(--dim);font-size:9px;">N/A</div>'
    + '</div>'
  ).join('');

  document.getElementById('fault-bars').innerHTML = unlockedHtml + (lockedFaults.length ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);font-size:9px;color:var(--muted);font-family:IBM Plex Mono,monospace;margin-bottom:6px;">Additional data required to analyse:</div>' + lockedHtml : '');
  setTimeout(()=>document.querySelectorAll('.fault-bar-fill').forEach(el=>el.style.width=el.dataset.w+'%'),80);
  const top=d.faults[0]||{name:' - ',pct:0,iso_reference:'',freq_hz:0,harmonics_used:0};
  document.getElementById('top-fault-badge').textContent=top.name+' '+top.pct+'%';
  document.getElementById('top-fault-badge').className='badge '+(top.pct>60?'b-red':top.pct>40?'b-orange':'b-yellow');
  document.getElementById('driving-feature').textContent='Shaft ~'+(d.shaftHz||0).toFixed(1)+' Hz . Kurt '+d.kurt+' . CF '+d.cf+' . '+(top.harmonics_used||0)+' harmonics';
  document.getElementById('fault-clauses').innerHTML=top.iso_reference?'<span class="clause">'+top.iso_reference+'</span>':'';
  const rpmSource = d.machineParams && d.machineParams.rpm ? 'nameplate' : 'est.';
  document.getElementById('rpm-badge').textContent='~'+Math.round((d.shaftHz||0)*60)+' RPM '+rpmSource;
  document.getElementById('disclaimer-box').textContent='(!) '+CONFIG.chatbot_config.disclaimer_text;
  buildRadar(d.faults.filter(f => !f.locked)); buildFFT(d.fftR, d.sr);
}

// == CHARTS ==
Chart.defaults.color='#7f93aa';Chart.defaults.borderColor='#2a3a52';Chart.defaults.font.family="'IBM Plex Mono',monospace";
function buildRadar(faults){
  if(radarInst){radarInst.destroy();radarInst=null;}
  const top = faults.slice(0,8);
  if(!top.length) return;
  // Colour each point by severity
  const ptColors = top.map((_,i)=>i===0?'#c0392b':i===1?'#e67e22':i===2?'#e74c3c':'#2471a3');
  radarInst = new Chart(document.getElementById('radarChart').getContext('2d'),{
    type:'radar',
    data:{
      labels: top.map(f=>f.name.split(' - ').pop().trim().split(' ').slice(0,3).join(' ')),
      datasets:[{
        data: top.map(f=>f.pct),
        backgroundColor: 'rgba(192,57,43,0.25)',
        borderColor: '#c0392b',
        borderWidth: 3,
        pointBackgroundColor: ptColors,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: top.map((_,i)=>i===0?8:6),
        pointHoverRadius: 10
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'#1a2030',
          borderColor:'#c0392b',
          borderWidth:1,
          padding:10,
          titleColor:'#ffffff',
          bodyColor:'#ffffff',
          callbacks:{label:c=>c.raw+'% confidence'}
        }
      },
      scales:{
        r:{
          min:0, max:100,
          grid:{color:'rgba(77,157,224,0.2)'},
          angleLines:{color:'rgba(77,157,224,0.25)'},
          ticks:{
            backdropColor:'rgba(26,36,53,0.85)',
            color:'#e8edf5',
            font:{size:10, weight:'bold'},
            stepSize:20,
            showLabelBackdrop:true
          },
          pointLabels:{
            color:'#e8edf5',
            font:{size:10, weight:'bold'}
          }
        }
      }
    }
  });
}

function buildFFT(fft,fs){
  if(fftInst){fftInst.destroy();fftInst=null;}
  const {freqs,mags}=fft, step=Math.max(1,Math.floor(freqs.length/400));
  const df=[],dm=[],dc=[];
  let dI=0; for(let i=1;i<mags.length;i++){if(mags[i]>mags[dI])dI=i;} const tF=freqs[dI];
  for(let i=0;i<freqs.length&&freqs[i]<fs*0.45;i+=step){const f=freqs[i];df.push(f.toFixed(1));dm.push(parseFloat(mags[i].toFixed(5)));dc.push(Math.abs(f-tF)<tF*0.15?'rgba(192,57,43,1.0)':Math.abs(f-tF*2)<tF*0.15?'rgba(211,84,0,1.0)':Math.abs(f-tF*3)<tF*0.15?'rgba(183,149,11,1.0)':f>fs*0.35?'rgba(88,44,140,0.9)':'rgba(0,85,170,0.5)');}
  fftInst=new Chart(document.getElementById('fftChart').getContext('2d'),{type:'bar',data:{labels:df,datasets:[{data:dm,backgroundColor:dc,barPercentage:1.3,categoryPercentage:1,borderWidth:0}]},options:{responsive:true,animation:{duration:400},plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a2030',borderColor:'#c0392b',borderWidth:1,titleColor:'#ffffff',bodyColor:'#ffffff',callbacks:{title:i=>i[0].label+' Hz',label:c=>' '+c.raw.toFixed(5)}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:10,font:{size:10,weight:'bold'},color:'#7f93aa',callback:(v,i)=>parseFloat(df[i])%50<5?df[i]+'Hz':''}},y:{grid:{color:'rgba(77,157,224,0.12)'},ticks:{font:{size:10,weight:'bold'},color:'#7f93aa'},min:0}}}});
  document.getElementById('fft-legend').innerHTML=['Dominant freq','2nd harmonic','3rd harmonic','High-freq'].map((l,i)=>{const cs=['#c0392b','#c0520a','#b36a00','#6b3fa0'][i];return'<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:'+cs+';font-family:\'IBM Plex Mono\',monospace;"><div style="width:7px;height:7px;border-radius:50%;background:'+cs+'"></div>'+l+'</div>';}).join('');
}

// == CLAUDE AI ==
async function streamClaude(){
  const d=nvr;
  document.getElementById('stream-thinking').style.display='flex';
  document.getElementById('reco-text').textContent='';
  document.getElementById('reco-text').classList.add('typing');
  const mi=getMonitoringInterval(d.zoneRow.zone_label,d.trendRow.code);
  const flags=[];
  if(d.singleFile)flags.push('SINGLE_FILE: Trend is DDU. One snapshot only  -  do NOT imply deterioration trajectory.');
  if(d.faults[0]&&d.faults[0].pct<40)flags.push('LOW_CONFIDENCE: Top fault '+d.faults[0].pct+'%  -  use indicative language only.');
  const zA=getZonesForClass(selClassId)[0];
  if(parseFloat(d.rms)<zA.rms_upper_mm_s)flags.push('ZONE_A: Machine in Zone A. Routine monitoring only  -  do not over-diagnose.');
  const fd=d.faults.slice(0,CONFIG.fault_display_limit).map(f=>'- '+f.name+': '+f.pct+'% | freq: '+(f.freq_hz?f.freq_hz.toFixed(1)+' Hz':'N/A')+' | harmonics: '+(f.harmonics_used||0)+' | '+f.iso_reference).join('\n');
  const prompt=[
    'You are AxiomAssist  -  domain-ringfenced to vibration analysis, condition monitoring, rotating machinery, and maintenance engineering ONLY.',
    d.override && d.override.overrideActive ? [
      '','=== ⚠ FAULT OVERRIDE ACTIVE ===',
      d.override.overrideReason,
      'ISO Reference: ' + (d.override.overrideISO||''),
      'Health assessment is fault-driven, not RMS-driven per ' + (d.override.overrideISO||''),
      ''
    ].join('\n') : '',
    '','=== MACHINE ===',
    d.classRow.machine_type_desc+' | '+d.classRow.iso_standard_ref+' | '+d.classRow.mounting_type+' mount',
    d.machineParams && d.machineParams.paramsEntered ? [
      d.machineParams.equipType ? 'Equipment type: '+d.machineParams.equipType : '',
      d.machineParams.rpm ? 'Nameplate RPM: '+d.machineParams.rpm+' ('+d.machineParams.rpm/60.0+'Hz shaft)' : 'RPM: estimated from FFT',
      d.machineParams.bearingModel ? 'Bearing: '+d.machineParams.bearingModel+' (BPFO='+d.machineParams.bpfoMult+'x)' : 'Bearing: generic multipliers',
      d.machineParams.measPoint ? 'Measurement: '+d.machineParams.measPoint+' / '+d.machineParams.measAxis+' axis' : '',
      d.machineParams.loadPct ? 'Load at measurement: '+d.machineParams.loadPct+'%' : '',
      d.machineParams.lastMaint ? 'Last maintenance: '+d.machineParams.lastMaint : ''
    ].filter(Boolean).join(' | ') : 'Machine parameters: not entered — generic defaults used',
    '','=== NVR RECORD ===',
    'File: '+d.filename+' | Samples: '+d.n+' | Sample rate: '+d.sr+' Hz',
    'RMS: '+d.rms+' '+d.cu+' | Peak: '+d.peak+' | CF: '+d.cf+' ['+getCFLabel(parseFloat(d.cf))+'] | Kurtosis: '+d.kurt+' ['+getKLabel(parseFloat(d.kurt))+']',
    'Deviation: '+d.devSc+'sigma  -  '+d.devRow.classification+' ('+d.devRow.iso_reference+')',
    'ISO Zone: '+d.zoneRow.zone_label+'  -  '+d.zoneRow.action_required+' ('+d.zoneRow.iso_clause_ref+')',
    'Trend: '+d.trendRow.code+'  -  '+d.trendRow.label+' ('+d.trendRow.iso_reference+')',
    'Early Warning: '+d.earlyWarn+(d.earlyWarn?' ('+CONFIG.early_warning_rule.iso_reference+')':''),
    'RUL: '+d.rulR.days+'d +/- '+d.rulR.ci+'d ('+d.rulR.iso_reference+')',
    'Monitoring: '+mi.interval_desc+' ('+mi.iso_reference+')',
    'Shaft: '+(d.shaftHz?d.shaftHz.toFixed(1):'?')+' Hz (~'+Math.round((d.shaftHz||0)*60)+' RPM)',
    '','=== FAULT CLASSIFICATION ===',fd,
    '','=== DATA QUALITY FLAGS ===',
    flags.length?flags.map(f=>'(!) '+f).join('\n'):' -  No flags.',
    '','=== ANTI-HALLUCINATION RULES ===',
    '1. Use ONLY values above. Do not invent bearing models, temperatures, or values not in this data.',
    '2. Obey every DATA QUALITY FLAG.',
    '3. Fault <40% confidence = indicative language only, never confirmed.',
    '4. Cite ONLY ISO clauses from the NVR record above.',
    '5. Always quote RUL CI. State it cannot replace engineering judgement.',
    '','=== REPORT  -  6 SECTIONS ===',
    '1. DIAGNOSTIC SUMMARY  -  Zone, RMS, trend, limitations.',
    '2. PRIMARY FAULT ANALYSIS  -  Interpret top fault(s), qualify confidence, cite ISO 13379-1 clause.',
    '3. SEVERITY ASSESSMENT  -  Interpret zone, cite exact ISO clause from NVR record.',
    '4. RECOMMENDED ACTIONS  -  Immediate/Short-term/Long-term. Each must cite an ISO clause.',
    '5. MONITORING GUIDANCE  -  Interval and parameters. Cite ISO 13373-1 clause.',
    '6. RUL & PROGNOSTIC NOTE  -  Quote days and CI. Cite ISO 13381-1 clause. State limitations.',
  ].join('\n');
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:CONFIG.chatbot_config.model_version,max_tokens:CONFIG.chatbot_config.max_output_tokens,stream:true,messages:[{role:'user',content:prompt}]})});
    document.getElementById('stream-thinking').style.display='none';
    if(!resp.ok)throw new Error(await resp.text());
    const reader=resp.body.getReader(),dec=new TextDecoder();let buf='';
    const rt=document.getElementById('reco-text');
    while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();for(const l of ls){if(!l.startsWith('data:'))continue;const dat=l.slice(5).trim();if(dat==='[DONE]')break;try{const e=JSON.parse(dat);if(e.type==='content_block_delta'&&e.delta?.type==='text_delta'){rt.textContent+=e.delta.text;rt.scrollIntoView({behavior:'smooth',block:'nearest'});}}catch{}}}
  }catch(err){
    document.getElementById('stream-thinking').style.display='none';
    await typeText(document.getElementById('reco-text'), buildFallback(nvr));
  }
  document.getElementById('reco-text').classList.remove('typing');
}

// == FALLBACK REPORT ==
function buildFallback(d){
  const top=d.faults[0]||{name:'Unknown',pct:0,iso_reference:'ISO 13379-1:2012',freq_hz:null,harmonics_used:0};
  const mi=getMonitoringInterval(d.zoneRow.zone_label,d.trendRow.code);
  const allZ=getZonesForClass(selClassId);
  const zI=allZ.findIndex(z=>z.zone_label===d.zoneRow.zone_label);
  const urg=zI===allZ.length-1?'IMMEDIATE SHUTDOWN':zI===allZ.length-2?'URGENT  -  within 7 days':'PLANNED  -  within 90 days';
  const cq=top.pct>=60?'':'indicative of ';
  const fA=top.name.includes('BPFO')?'Spectral signature is '+cq+'outer race bearing defect (BPFO). CF ('+d.cf+') and Kurtosis ('+d.kurt+') '+(top.pct>=60?'confirm':'suggest')+' impacting behaviour. '+top.harmonics_used+' harmonic(s) at ~'+(top.freq_hz?top.freq_hz.toFixed(1):'est.')+' Hz. Per '+top.iso_reference+'.':top.name.includes('BPFI')?'Spectral signature is '+cq+'inner race bearing defect. Kurtosis ('+d.kurt+') provides supporting evidence. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.':top.name.includes('Imbalance')?'1x shaft frequency component is '+cq+'mechanical imbalance. '+top.harmonics_used+' harmonic(s) at ~'+(top.freq_hz?top.freq_hz.toFixed(1):'est.')+' Hz. Per '+top.iso_reference+'.':top.name.includes('Misalignment')?'2x/3x harmonic content is '+cq+'shaft misalignment. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.':top.name.includes('Looseness')?'Multiple harmonics are '+cq+'mechanical looseness. '+top.harmonics_used+' matched. Per '+top.iso_reference+'.':'Spectral signature is '+cq+top.name+'. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.';
  return '1. DIAGNOSTIC SUMMARY\nISO Zone '+d.zoneRow.zone_label+' ('+d.zoneRow.iso_clause_ref+'). RMS: '+d.rms+' '+d.cu+' on '+d.classRow.machine_type_desc+'.\n'+d.zoneRow.action_required+'\nDeviation: '+d.devSc+'sigma ('+d.devRow.classification+', '+d.devRow.iso_reference+').\nTrend: '+d.trendRow.code+'  -  '+d.trendRow.description+' ('+d.trendRow.iso_reference+').\nNote: Single measurement file  -  trend direction cannot be established from one snapshot. Multiple readings over time required per '+d.trendRow.iso_reference+'.\n\n2. PRIMARY FAULT ANALYSIS ('+top.iso_reference+')\n'+top.name+' at '+top.pct+'% confidence.\n'+fA+(d.faults[1]?'\nSecondary: '+d.faults[1].name+' at '+d.faults[1].pct+'% ('+d.faults[1].iso_reference+').':'')+'\n\n3. SEVERITY ASSESSMENT\n'+allZ.map(z=>'Zone '+z.zone_label+': '+z.rms_lower_mm_s+' - '+(z.rms_upper_mm_s===99999?'inf':z.rms_upper_mm_s)+' mm/s  -  '+z.action_required+' ('+z.iso_clause_ref+')').join('\n')+'\nCurrent RMS '+d.rms+' '+d.cu+' -> Zone '+d.zoneRow.zone_label+'.\nUrgency: '+urg+'\n\n4. RECOMMENDED ACTIONS\nImmediate:\n'+(zI===allZ.length-1?'* Controlled shutdown required. Do not restart without engineering authorisation. ('+d.zoneRow.iso_clause_ref+')':zI===allZ.length-2?'* Schedule maintenance within 7 days. ('+d.zoneRow.iso_clause_ref+')':'* Continue current schedule. Document per ISO 55001:2014 S7.5.')+'\nShort-term:\n* '+(top.name.includes('BPF')||top.name.includes('BSF')||top.name.includes('FTF')?'Inspect bearing. Verify lubrication per ISO 13373-1:2002 S6.2.':top.name.includes('Imbalance')?'Dynamic balance per ISO 1940-1.':top.name.includes('Misalignment')?'Precision alignment. Check soft-foot.':top.name.includes('Looseness')?'Inspect fasteners and connections.':'Address fault per '+top.iso_reference+'.')+'\nLong-term:\n* Re-baseline post-maintenance (ISO 13373-2:2016 S8.1).\n\n5. MONITORING GUIDANCE ('+mi.iso_reference+')\nInterval: '+mi.interval_desc+'.\nMeasure H/V/A at bearing housings (ISO 13373-1:2002 S5.2). Track RMS, CF, Kurtosis.\n\n6. RUL & PROGNOSTIC NOTE ('+d.rulR.iso_reference+')\nRUL: '+d.rulR.days+'d +/- '+d.rulR.ci+'d CI ('+Math.round((1-CONFIG.rul_ci_fraction)*100)+'% confidence).\n'+(d.rulR.days<60?'Below 60 days  -  begin maintenance planning immediately.':'Continue trending to improve accuracy.')+'\nPer '+d.rulR.iso_reference+': this estimate must not be the sole criterion for maintenance deferral. Qualified engineering review required.';
}

async function typeText(el,text){el.textContent='';for(let i=0;i<text.length;i+=4){el.textContent+=text.slice(i,i+4);if(i%80===0)await new Promise(r=>setTimeout(r,5));}}

}); // end DOMContentLoaded
