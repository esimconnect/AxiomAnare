// AxiomAnare — Diagnostic Engine
// All logic runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {

// ══ CONFIG LOOKUP HELPERS ══
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
  return { days, ci: Math.round(days * CONFIG.rul_ci_fraction), iso_reference: b?.iso_reference || 'ISO 13381-1:2015 §5.2' };
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

// ══ STATE ══
let selClassId = CONFIG.iso_machine_classes[1].class_id;
let radarInst = null, fftInst = null, nvr = {};
let pendingFile = null, pendingRaw = null;

// ══ CLASS SELECTOR ══
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

// ══ FILE HANDLING ══
window.onDrop = function(e) { e.preventDefault(); if (e.dataTransfer.files[0]) stageFile(e.dataTransfer.files[0]); };
document.getElementById('fileInput').addEventListener('change', function() { if (this.files[0]) stageFile(this.files[0]); });
document.getElementById('run-btn').addEventListener('click', runFromReady);
document.getElementById('new-upload-btn').addEventListener('click', resetApp);
document.getElementById('sample-link').addEventListener('click', loadSampleData);

function updateStep3Meta() {
  const c = CONFIG.iso_machine_classes.find(x => x.class_id === selClassId);
  document.getElementById('ready-class').textContent = c ? 'Class: ' + c.machine_type_desc : '—';
  document.getElementById('step3-note').textContent = c ? c.iso_standard_ref + ' · ' + c.mounting_type : '—';
}

function stageFile(file) {
  pendingFile = file; pendingRaw = null;
  const ext = file.name.split('.').pop().toLowerCase();
  const sz = file.size > 1048576 ? (file.size/1048576).toFixed(1)+' MB' : (file.size/1024).toFixed(1)+' KB';
  // Update drop zone
  document.getElementById('drop-glyph').textContent = '✅';
  document.getElementById('drop-title').textContent = file.name;
  document.getElementById('drop-sub').textContent = sz + ' · click to change';
  document.getElementById('select-btn').textContent = '⬆ Change File';
  // Populate Step 3
  document.getElementById('ready-filename').textContent = file.name;
  document.getElementById('ready-meta').textContent = sz + ' · .' + ext.toUpperCase();
  updateStep3Meta();
  // Mark steps done
  setStepDone('step1-num', true); setStepDone('step2-num', true);
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
  } else {
    const r = new FileReader();
    r.onload = ev => { pendingRaw = ev.target.result; };
    r.onerror = () => showFileError('File read failed.');
    r.readAsText(file);
  }
}

function showFileError(msg) {
  const el = document.getElementById('ready-meta');
  el.textContent = '⚠ ' + msg; el.style.color = 'var(--red)';
}

function runFromReady() {
  if (!pendingFile) return;
  if (!pendingRaw) { document.getElementById('ready-meta').textContent = 'Reading file…'; setTimeout(runFromReady, 300); return; }
  showProcessing(pendingFile.name);
  runPipeline(pendingRaw, pendingFile.name);
}

window.clearFile = function() {
  pendingFile = null; pendingRaw = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('step3-card').style.display = 'none';
  document.getElementById('drop-glyph').textContent = '📂';
  document.getElementById('drop-title').textContent = 'Drop file here or click to browse';
  document.getElementById('drop-sub').textContent = 'Any column layout — auto-detected';
  document.getElementById('select-btn').textContent = '⬆ Browse File';
  setStepDone('step1-num', false); setStepDone('step2-num', false);
};

function setStepDone(id, done) {
  const el = document.getElementById(id);
  if (done) { el.classList.add('done'); el.textContent = '✓'; }
  else { el.classList.remove('done'); el.textContent = id.replace('step','').replace('-num',''); }
}

// ══ SAMPLE DATA ══
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
  document.getElementById('drop-glyph').textContent = '✅';
  document.getElementById('drop-title').textContent = 'sample_bearing_fault_NDE_H.csv';
  document.getElementById('drop-sub').textContent = 'Synthetic BPFO bearing fault — '+Math.floor(N)+' samples @ 10 kHz';
  document.getElementById('ready-filename').textContent = 'sample_bearing_fault_NDE_H.csv';
  document.getElementById('ready-meta').textContent = 'Synthetic · '+Math.floor(N)+' samples @ 10 kHz';
  updateStep3Meta();
  setStepDone('step1-num', true); setStepDone('step2-num', true);
  const s3 = document.getElementById('step3-card');
  s3.style.display = 'block';
  setTimeout(() => s3.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
}

// ══ PIPELINE ══
async function runPipeline(raw, filename) {
  document.getElementById('proc-filename').textContent = filename;

  // Stage 1 — Ingest
  await activateStage(1);
  const parsed = parseData(raw);
  if (!parsed || parsed.values.length < 10) { doneStage(1,'QUARANTINED'); setNote('⚠ Cannot extract numeric data.'); return; }
  const cu = CONFIG.unit_conversion_factors.find(r => r.canonical_flag === 1).to_unit;
  const sr = parsed.sampleRate || CONFIG.default_sample_rate_hz;
  // Detect what type of data we have from column headers
  const dataTypes = detectDataTypes(parsed.allHeaders || [parsed.colName]);
  const dataBanner = getDataTypeBanner(dataTypes);
  let vals;
  if (['g','m/s2','mg'].includes(parsed.unit)) {
    const rf = computeFFT(parsed.values, sr); const hz = detectShaft(rf);
    vals = parsed.values.map(v => toCanonicalUnit(v, parsed.unit, hz));
  } else { vals = parsed.values.map(v => toCanonicalUnit(v, parsed.unit, null)); }
  doneStage(1, vals.length+' samples · '+parsed.unit+'→'+cu);

  // Stage 2 — Baseline
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
  doneStage(2, devRow.classification+' ('+devSc.toFixed(2)+'σ)');

  // Stage 3 — Trend (DDU for single file — cannot establish trend from one snapshot)
  await activateStage(3);
  const trendRow = CONFIG.trend_state_rules.find(r => r.code === 'DDU');
  doneStage(3, 'DDU — '+trendRow.label);

  // Stage 4 — ISO Zone
  await activateStage(4);
  const zoneRow  = lookupZone(rms, selClassId);
  const classRow = CONFIG.iso_machine_classes.find(c => c.class_id === selClassId);
  const ew = CONFIG.early_warning_rule;
  const earlyWarn = ew.trigger_deviation_classes.includes(devRow.classification)
    && ew.trigger_trend_states.includes(trendRow.code)
    && ew.trigger_zones.includes(zoneRow.zone_label);
  doneStage(4, 'Zone '+zoneRow.zone_label+' · '+rms.toFixed(3)+' '+cu);

  // Stage 5 — Fault Classification
  await activateStage(5);
  const fftR = computeFFT(vals, sr);
  const shaftHz = detectShaft(fftR);
  const allFaults = classifyFaults(fftR, cf, kurt, dataTypes);
  // Show: unlocked faults above confidence threshold + all locked faults (greyed out)
  const faults = [
    ...allFaults.filter(f => !f.locked && f.pct >= CONFIG.minimum_fault_confidence_pct),
    ...allFaults.filter(f => f.locked)
  ];
  doneStage(5, (faults[0]?.name||'—')+' '+(faults[0]?.pct||0)+'%');

  // Stage 6 — RUL
  await activateStage(6);
  const rulR = calcRUL(zoneRow.zone_label, trendRow.code);
  doneStage(6, 'RUL '+rulR.days+'d ± '+rulR.ci+'d');
  setNote('Rendering results…');

  nvr = { filename, rms: rms.toFixed(3), peak: peak.toFixed(3), cf: cf.toFixed(2),
    dataTypes, dataBanner,
    kurt: kurt.toFixed(2), devSc: devSc.toFixed(2), devRow, zoneRow, trendRow,
    earlyWarn, faults: faults.length ? faults : allFaults.slice(0, CONFIG.fault_display_limit),
    fftR, rulR, n, sr, classRow, cu, shaftHz, singleFile: true };

  await new Promise(r => setTimeout(r, 250));
  document.getElementById('processing-screen').style.display = 'none';
  document.getElementById('results-screen').style.display = 'block';
  renderResults();
  streamClaude();
}

// ══ DATA PARSER ══
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
  const vbN=['accel','acc','vib','velocity','vel','amplitude','amp','rms','g','mm','signal','value','data','ch','chan','sensor','x','y','z'];
  let col = numCols.find(c=>vbN.some(p=>c.toLowerCase().includes(p))) || numCols.find(c=>!tsN.some(p=>c.toLowerCase().includes(p))) || numCols[numCols.length>1?1:0];
  const values = rows.map(r=>r[col]).filter(v=>typeof v==='number'&&isFinite(v));
  if (values.length < 10) return null;
  const cl = col.toLowerCase();
  let unit = 'g';
  if (cl.includes('mm')||cl.includes('vel')||cl.includes('velocity')) unit='mm/s';
  else if (cl.includes('m/s2')||cl.includes('ms2')) unit='m/s2';
  else if (cl.includes('mg')) unit='mg';
  let sr = CONFIG.default_sample_rate_hz;
  const tc = headers.find(h=>tsN.some(p=>h.toLowerCase()===p||h.toLowerCase().startsWith(p)));
  if (tc) { const ts=rows.slice(0,10).map(r=>parseFloat(r[tc])).filter(isFinite); if(ts.length>2){const dt=ts[1]-ts[0];if(dt>0&&dt<1)sr=Math.round(1/dt);else if(dt>=1&&dt<1000)sr=Math.round(1000/dt);} }
  return { values, colName: col, unit, sampleRate: sr };
}

// ══ FFT ══
function computeFFT(signal, fs) {
  const N = Math.pow(2, Math.floor(Math.log2(Math.min(signal.length, 8192))));
  const w = signal.slice(0,N).map((v,i) => v*(0.5-0.5*Math.cos(2*Math.PI*i/(N-1))));
  function fft(re,im){const n=re.length;if(n<=1)return;const ee=[],eo=[],ie=[],io=[];for(let i=0;i<n/2;i++){ee.push(re[2*i]);eo.push(re[2*i+1]);ie.push(im[2*i]);io.push(im[2*i+1]);}fft(ee,ie);fft(eo,io);for(let k=0;k<n/2;k++){const a=-2*Math.PI*k/n,c=Math.cos(a),s=Math.sin(a),tr=c*eo[k]-s*io[k],ti=c*io[k]+s*eo[k];re[k]=ee[k]+tr;im[k]=ie[k]+ti;re[k+n/2]=ee[k]-tr;im[k+n/2]=ie[k]-ti;}}
  const re=[...w],im=new Array(N).fill(0); fft(re,im);
  const freqs=[],mags=[];
  for(let k=0;k<N/2;k++){freqs.push(k*fs/N);mags.push(Math.sqrt(re[k]**2+im[k]**2)/(N/2));}
  const sRms = Math.sqrt(mags.reduce((s,m)=>s+m*m,0)/mags.length);
  return {freqs,mags,fs,N,sRms};
}

// ══ SHAFT DETECTION — harmonic comb search ══
function detectShaft(fft) {
  const {freqs,mags,sRms} = fft;
  const fMin=CONFIG.shaft_freq_search_min_hz, fMax=CONFIG.shaft_freq_search_max_hz, n=CONFIG.harmonic_comb_count, bw=0.08;
  function peak(fc){const lo=fc*(1-bw),hi=fc*(1+bw);let mx=0;for(let i=0;i<freqs.length;i++){if(freqs[i]>hi)break;if(freqs[i]>=lo&&mags[i]>mx)mx=mags[i];}return mx;}
  let rangeMax=0;for(let j=0;j<freqs.length;j++){if(freqs[j]>=fMin&&freqs[j]<=fMax&&mags[j]>rangeMax)rangeMax=mags[j];}
  const cands=[];
  for(let i=1;i<freqs.length-1;i++){const f=freqs[i];if(f<fMin||f>fMax)continue;if(mags[i]>mags[i-1]&&mags[i]>mags[i+1]&&mags[i]>rangeMax*0.05)cands.push(f);}
  if(!cands.length)return (fMin+fMax)/2;
  let best=cands[0],bestS=-1;
  for(const fc of cands){if(fc*n>fft.fs/2)continue;let s=0;for(let h=1;h<=n;h++)s+=peak(fc*h);s*=(fc>fMax*0.5?0.85:1.0);if(s>bestS){bestS=s;best=fc;}}
  return best;
}

// ══ DATA TYPE DETECTOR ══
// Inspects column headers to determine what kind of data was uploaded.
// Returns a set of available data types: 'vibration', 'mcsa', 'voltage', 'power', 'frequency'
function detectDataTypes(headers) {
  const available = new Set();
  const det = CONFIG.data_type_detection;
  const hl = headers.map(h => h.toLowerCase());
  Object.entries(det).forEach(([type, patterns]) => {
    if (hl.some(h => patterns.some(p => h.includes(p)))) available.add(type);
  });
  // Always assume vibration if any numeric data present — it's the default input
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
  return { type:'vibration', msg:'Vibration data detected. Mechanical and bearing fault analysis will run. Electrical and process fault categories require MCSA or power meter data — not shown.' };
}

// ══ FAULT CLASSIFICATION ══
function classifyFaults(fft, cf, kurt, dataTypes) {
  const {freqs,mags,sRms} = fft;
  const shaft = detectShaft(fft);
  function bE(fc,bw){const lo=fc*(1-bw),hi=fc*(1+bw);let e=0,n=0;for(let i=0;i<freqs.length;i++){if(freqs[i]>hi)break;if(freqs[i]>=lo){e+=mags[i]**2;n++;}}return n>0?Math.sqrt(e/n):0;}
  const cfB=getCFBonus(cf), kB=getKBonus(kurt);
  const bearIds=new Set(['r_bpfo','r_bpfi','r_bsf','r_ftf']);
  const base=sRms||1;

  return CONFIG.fault_frequency_rules.map(rule => {
    const req = rule.requires;

    // ── Rules that require data we don't have → locked ──
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

    // ── Vibration-derived electrical indicators ──
    const isVibDerived = (rule.category === 'electrical' && req === 'vibration');

    // ── Rules with no frequency (shouldn't reach here, but guard) ──
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

    let sc = Math.round(((tot/h2)/base)*80*rule.confidence_weight);
    if (bearIds.has(rule.rule_id)) sc += Math.round((cfB+kB)*rule.confidence_weight);
    // Vibration-derived electrical: cap confidence lower — it's indirect
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

// ══ UI HELPERS ══
function showProcessing(fn) {
  document.getElementById('upload-screen').style.display='none';
  document.getElementById('processing-screen').style.display='flex';
  document.getElementById('results-screen').style.display='none';
  document.getElementById('proc-filename').textContent=fn;
  for(let i=1;i<=6;i++){document.getElementById('stage-'+i).className='stage-item';document.getElementById('s'+i+'-st').textContent='—';}
}
function setNote(t){document.getElementById('proc-note').textContent=t;}
async function activateStage(n){
  await new Promise(r=>setTimeout(r,280));
  const el=document.getElementById('stage-'+n);
  el.className='stage-item active';
  el.querySelector('.s-num').innerHTML='<div class="spinner"></div>';
  document.getElementById('s'+n+'-st').textContent='Running…';
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
  document.getElementById('drop-glyph').textContent='📂';
  document.getElementById('drop-title').textContent='Drop file here or click to browse';
  document.getElementById('drop-sub').textContent='Any column layout — auto-detected';
  document.getElementById('select-btn').textContent='⬆ Browse File';
  setStepDone('step1-num',false); setStepDone('step2-num',false);
  document.getElementById('reco-text').textContent='';
  document.getElementById('reco-text').classList.add('typing');
  document.getElementById('ew-banner').classList.remove('show');
  if(radarInst){radarInst.destroy();radarInst=null;}
  if(fftInst){fftInst.destroy();fftInst=null;}
}

// ══ RENDER ══
function renderResults(){
  const d=nvr;
  const zC={A:'var(--green)',B:'#1a6bbf',C:'var(--yellow)',D:'var(--red)'};
  document.getElementById('results-meta').innerHTML='File: <span>'+d.filename+'</span> &nbsp;·&nbsp; Class: <span>'+d.classRow.machine_type_desc+'</span>';
  const cfL=getCFLabel(parseFloat(d.cf)), kL=getKLabel(parseFloat(d.kurt));
  const tips = {
    'RMS Velocity': 'The overall vibration energy level — the most important single number. Higher = more vibration. Compared against ISO limits to determine your severity zone.',
    'Peak': 'The highest instantaneous vibration spike in the data. High peak with low RMS can indicate intermittent impact faults like bearing defects.',
    'Crest Factor': 'Peak divided by RMS. A healthy machine is typically 2.5–3.5. Above 5 = impacting faults likely (e.g. bearing damage). Think of it as a measure of how spiky the signal is.',
    'Kurtosis': 'A statistical measure of how sharp the vibration peaks are. Normal machinery = around 3. Above 6 = strong evidence of bearing impact faults. Your value here is key.',
    'Deviation': 'How far the current RMS is from the learned baseline — measured in standard deviations (σ). Above 2σ = Significant Deviation. Above 3.5σ = Step-Change anomaly.',
    'Samples': 'Total data points analysed and the sampling rate. Higher sample rates capture higher-frequency faults like bearing defects more accurately.'
  };
  document.getElementById('nvr-grid').innerHTML=[
    {lb:'RMS Velocity',v:d.rms,u:d.cu,c:zC[d.zoneRow.zone_label]||'var(--text)'},
    {lb:'Peak',v:d.peak,u:d.cu,c:'var(--text)'},
    {lb:'Crest Factor',v:d.cf,u:cfL,c:cfL==='High'?'var(--orange)':cfL==='Elevated'?'var(--yellow)':'var(--text)'},
    {lb:'Kurtosis',v:d.kurt,u:kL,c:kL==='High impacting'?'var(--orange)':kL==='Elevated'?'var(--yellow)':'var(--text)'},
    {lb:'Deviation',v:d.devSc+'σ',u:d.devRow.classification,c:['Significant Deviation','Step-Change'].includes(d.devRow.classification)?'var(--orange)':'var(--green)'},
    {lb:'Samples',v:d.n.toLocaleString(),u:(d.sr/1000).toFixed(1)+' kHz',c:'var(--accent)'},
  ].map(i=>'<div class="nvr-item"><div class="nvr-label"><span class="tip">'+i.lb+'<span class="tip-box">'+tips[i.lb]+'</span></span></div><div class="nvr-val" style="color:'+i.c+'">'+i.v+'</div><div class="nvr-unit">'+i.u+'</div></div>').join('');
  document.getElementById('nvr-clauses').innerHTML='<span class="clause">'+d.devRow.iso_reference+'</span><span class="clause">ISO 13373-1:2002 §5.2</span>';
  document.querySelectorAll('.zone-seg').forEach(el=>el.classList.toggle('current',el.dataset.z===d.zoneRow.zone_label));
  document.getElementById('zone-desc').textContent=d.zoneRow.action_required;
  document.getElementById('zone-iso-clause').textContent=d.zoneRow.iso_clause_ref;
  const rs=CONFIG.rul_bar_scale_days||Math.max(...CONFIG.rul_zone_base_days.map(r=>r.base_days));
  const rc=d.rulR.days<30?'var(--red)':d.rulR.days<90?'var(--orange)':d.rulR.days<180?'var(--yellow)':'var(--green)';
  document.getElementById('rul-num').textContent=d.rulR.days+'d';
  document.getElementById('rul-num').style.color=rc;
  document.getElementById('rul-ci').textContent='± '+d.rulR.ci+'d CI';
  document.getElementById('rul-scale-label').textContent=rs+'d';
  const pct=Math.min(95,Math.max(5,(d.rulR.days/rs)*100));
  const arr=document.getElementById('rul-arrow');arr.style.left=pct+'%';arr.style.background=rc;
  document.getElementById('rul-clauses').innerHTML='<span class="clause">'+d.rulR.iso_reference+'</span><span class="clause">ISO 55001:2014 §6.1</span>';
  const tC={SWB:'b-green',DDU:'b-blue',PRS:'b-yellow',PRA:'b-red',RGI:'b-green',SCO:'b-red'};
  document.getElementById('trend-badge').textContent=d.trendRow.code+' — '+d.trendRow.label;
  document.getElementById('trend-badge').className='badge '+(tC[d.trendRow.code]||'b-blue');
  if(d.earlyWarn){document.getElementById('ew-banner').classList.add('show');document.getElementById('ew-desc').textContent=d.devRow.classification+' ('+d.devSc+'σ) + '+d.trendRow.code+' in Zone '+d.zoneRow.zone_label;document.getElementById('ew-clause').innerHTML='<span class="clause">'+CONFIG.early_warning_rule.iso_reference+'</span>';}
  const fp=['var(--red)','var(--orange)','var(--yellow)','var(--accent)','var(--green)','var(--muted)'];
  // Data type banner
  const bannerEl = document.getElementById('data-type-banner');
  if (bannerEl && d.dataBanner) {
    bannerEl.textContent = d.dataBanner.msg;
    bannerEl.style.display = 'flex';
    bannerEl.className = 'data-banner data-banner-'+d.dataBanner.type;
  }

  // Fault bars — unlocked faults in colour, locked faults greyed with lock icon
  const unlockedFaults = d.faults.filter(f => !f.locked);
  const lockedFaults   = d.faults.filter(f => f.locked);

  const unlockedHtml = unlockedFaults.slice(0, CONFIG.fault_display_limit).map((f,i) => {
    const col = fp[Math.min(i, fp.length-1)];
    const derivedTag = f.vibration_derived
      ? '<span style="font-size:8px;background:rgba(179,106,0,0.12);color:var(--yellow);border-radius:3px;padding:1px 5px;margin-left:5px;font-family:monospace;">vibration-derived</span>'
      : '';
    return '<div class="fault-item">'
      + '<div class="fault-name" style="color:'+col+';">'+f.name+derivedTag+'</div>'
      + '<div class="fault-bar-wrap"><div class="fault-bar-fill" style="background:'+col+';" data-w="'+f.pct+'"></div></div>'
      + '<div class="fault-pct" style="color:'+col+';">'+f.pct+'%</div>'
      + '</div>';
  }).join('');

  const lockedHtml = lockedFaults.slice(0, 4).map(f =>
    '<div class="fault-item fault-locked">'
    + '<div class="fault-name" style="color:var(--dim);">🔒 '+f.name+'</div>'
    + '<div class="fault-bar-wrap"><div style="height:100%;background:var(--surface3);border-radius:3px;width:100%;"></div></div>'
    + '<div class="fault-pct" style="color:var(--dim);font-size:9px;">N/A</div>'
    + '</div>'
  ).join('');

  document.getElementById('fault-bars').innerHTML = unlockedHtml + (lockedFaults.length ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);font-size:9px;color:var(--muted);font-family:monospace;margin-bottom:6px;">Additional data required to analyse:</div>' + lockedHtml : '');
  setTimeout(()=>document.querySelectorAll('.fault-bar-fill').forEach(el=>el.style.width=el.dataset.w+'%'),80);
  const top=d.faults[0]||{name:'—',pct:0,iso_reference:'',freq_hz:0,harmonics_used:0};
  document.getElementById('top-fault-badge').textContent=top.name+' '+top.pct+'%';
  document.getElementById('top-fault-badge').className='badge '+(top.pct>60?'b-red':top.pct>40?'b-orange':'b-yellow');
  document.getElementById('driving-feature').textContent='Shaft ~'+(d.shaftHz||0).toFixed(1)+' Hz · Kurt '+d.kurt+' · CF '+d.cf+' · '+(top.harmonics_used||0)+' harmonics';
  document.getElementById('fault-clauses').innerHTML=top.iso_reference?'<span class="clause">'+top.iso_reference+'</span>':'';
  document.getElementById('rpm-badge').textContent='~'+Math.round((d.shaftHz||0)*60)+' RPM est.';
  document.getElementById('disclaimer-box').textContent='⚠ '+CONFIG.chatbot_config.disclaimer_text;
  buildRadar(d.faults.filter(f => !f.locked)); buildFFT(d.fftR, d.sr);
}

// ══ CHARTS ══
Chart.defaults.color='#5a7a9a';Chart.defaults.borderColor='#c8d6e5';Chart.defaults.font.family="'IBM Plex Mono',monospace";
function buildRadar(faults){
  if(radarInst){radarInst.destroy();radarInst=null;}
  const top=faults.slice(0,7);
  radarInst=new Chart(document.getElementById('radarChart').getContext('2d'),{type:'radar',data:{labels:top.map(f=>f.name.split('—')[0].trim().split(' ').slice(0,3).join(' ')),datasets:[{data:top.map(f=>f.pct),backgroundColor:'rgba(0,102,204,0.1)',borderColor:'rgba(0,102,204,0.9)',borderWidth:2,pointBackgroundColor:top.map((_,i)=>i===0?'#c0392b':i===1?'#c0520a':'rgba(0,102,204,0.8)'),pointRadius:top.map((_,i)=>i===0?5:3),pointBorderColor:'#fff',pointBorderWidth:1.5}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a2535',borderColor:'#0066cc',borderWidth:1,callbacks:{label:c=>c.raw+'% severity'}}},scales:{r:{min:0,max:100,grid:{color:'rgba(0,102,204,0.25)'},angleLines:{color:'rgba(0,102,204,0.3)'},ticks:{backdropColor:'rgba(255,255,255,0.8)',color:'#1a2535',font:{size:8},showLabelBackdrop:true},pointLabels:{color:'#1a2535',font:{size:9,weight:'600'}}}}}});
}
function buildFFT(fft,fs){
  if(fftInst){fftInst.destroy();fftInst=null;}
  const {freqs,mags}=fft, step=Math.max(1,Math.floor(freqs.length/400));
  const df=[],dm=[],dc=[];
  let dI=0; for(let i=1;i<mags.length;i++){if(mags[i]>mags[dI])dI=i;} const tF=freqs[dI];
  for(let i=0;i<freqs.length&&freqs[i]<fs*0.45;i+=step){const f=freqs[i];df.push(f.toFixed(1));dm.push(parseFloat(mags[i].toFixed(5)));dc.push(Math.abs(f-tF)<tF*0.15?'rgba(192,57,43,0.85)':Math.abs(f-tF*2)<tF*0.15?'rgba(192,82,10,0.75)':Math.abs(f-tF*3)<tF*0.15?'rgba(179,106,0,0.7)':f>fs*0.35?'rgba(107,63,160,0.55)':'rgba(0,102,204,0.35)');}
  fftInst=new Chart(document.getElementById('fftChart').getContext('2d'),{type:'bar',data:{labels:df,datasets:[{data:dm,backgroundColor:dc,barPercentage:1.3,categoryPercentage:1,borderWidth:0}]},options:{responsive:true,animation:{duration:400},plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a2535',borderColor:'#0066cc',borderWidth:1,callbacks:{title:i=>i[0].label+' Hz',label:c=>' '+c.raw.toFixed(5)}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:10,font:{size:9},color:'#5a7a9a',callback:(v,i)=>parseFloat(df[i])%50<5?df[i]+'Hz':''}},y:{grid:{color:'rgba(0,102,204,0.12)'},ticks:{font:{size:9},color:'#5a7a9a'},min:0}}}});
  document.getElementById('fft-legend').innerHTML=['Dominant freq','2nd harmonic','3rd harmonic','High-freq'].map((l,i)=>{const cs=['#c0392b','#c0520a','#b36a00','#6b3fa0'][i];return'<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:'+cs+';font-family:\'IBM Plex Mono\',monospace;"><div style="width:7px;height:7px;border-radius:50%;background:'+cs+'"></div>'+l+'</div>';}).join('');
}

// ══ CLAUDE AI ══
async function streamClaude(){
  const d=nvr;
  document.getElementById('stream-thinking').style.display='flex';
  document.getElementById('reco-text').textContent='';
  document.getElementById('reco-text').classList.add('typing');
  const mi=getMonitoringInterval(d.zoneRow.zone_label,d.trendRow.code);
  const flags=[];
  if(d.singleFile)flags.push('SINGLE_FILE: Trend is DDU. One snapshot only — do NOT imply deterioration trajectory.');
  if(d.faults[0]&&d.faults[0].pct<40)flags.push('LOW_CONFIDENCE: Top fault '+d.faults[0].pct+'% — use indicative language only.');
  const zA=getZonesForClass(selClassId)[0];
  if(parseFloat(d.rms)<zA.rms_upper_mm_s)flags.push('ZONE_A: Machine in Zone A. Routine monitoring only — do not over-diagnose.');
  const fd=d.faults.slice(0,CONFIG.fault_display_limit).map(f=>'- '+f.name+': '+f.pct+'% | freq: '+(f.freq_hz?f.freq_hz.toFixed(1)+' Hz':'N/A')+' | harmonics: '+(f.harmonics_used||0)+' | '+f.iso_reference).join('\n');
  const prompt=[
    'You are AxiomAssist — domain-ringfenced to vibration analysis, condition monitoring, rotating machinery, and maintenance engineering ONLY.',
    '','=== MACHINE ===',
    d.classRow.machine_type_desc+' | '+d.classRow.iso_standard_ref+' | '+d.classRow.mounting_type+' mount',
    '','=== NVR RECORD ===',
    'File: '+d.filename+' | Samples: '+d.n+' | Sample rate: '+d.sr+' Hz',
    'RMS: '+d.rms+' '+d.cu+' | Peak: '+d.peak+' | CF: '+d.cf+' ['+getCFLabel(parseFloat(d.cf))+'] | Kurtosis: '+d.kurt+' ['+getKLabel(parseFloat(d.kurt))+']',
    'Deviation: '+d.devSc+'σ — '+d.devRow.classification+' ('+d.devRow.iso_reference+')',
    'ISO Zone: '+d.zoneRow.zone_label+' — '+d.zoneRow.action_required+' ('+d.zoneRow.iso_clause_ref+')',
    'Trend: '+d.trendRow.code+' — '+d.trendRow.label+' ('+d.trendRow.iso_reference+')',
    'Early Warning: '+d.earlyWarn+(d.earlyWarn?' ('+CONFIG.early_warning_rule.iso_reference+')':''),
    'RUL: '+d.rulR.days+'d ± '+d.rulR.ci+'d ('+d.rulR.iso_reference+')',
    'Monitoring: '+mi.interval_desc+' ('+mi.iso_reference+')',
    'Shaft: '+(d.shaftHz?d.shaftHz.toFixed(1):'?')+' Hz (~'+Math.round((d.shaftHz||0)*60)+' RPM)',
    '','=== FAULT CLASSIFICATION ===',fd,
    '','=== DATA QUALITY FLAGS ===',
    flags.length?flags.map(f=>'⚠ '+f).join('\n'):'— No flags.',
    '','=== ANTI-HALLUCINATION RULES ===',
    '1. Use ONLY values above. Do not invent bearing models, temperatures, or values not in this data.',
    '2. Obey every DATA QUALITY FLAG.',
    '3. Fault <40% confidence = indicative language only, never confirmed.',
    '4. Cite ONLY ISO clauses from the NVR record above.',
    '5. Always quote RUL CI. State it cannot replace engineering judgement.',
    '','=== REPORT — 6 SECTIONS ===',
    '1. DIAGNOSTIC SUMMARY — Zone, RMS, trend, limitations.',
    '2. PRIMARY FAULT ANALYSIS — Interpret top fault(s), qualify confidence, cite ISO 13379-1 clause.',
    '3. SEVERITY ASSESSMENT — Interpret zone, cite exact ISO clause from NVR record.',
    '4. RECOMMENDED ACTIONS — Immediate/Short-term/Long-term. Each must cite an ISO clause.',
    '5. MONITORING GUIDANCE — Interval and parameters. Cite ISO 13373-1 clause.',
    '6. RUL & PROGNOSTIC NOTE — Quote days and CI. Cite ISO 13381-1 clause. State limitations.',
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

// ══ FALLBACK REPORT ══
function buildFallback(d){
  const top=d.faults[0]||{name:'Unknown',pct:0,iso_reference:'ISO 13379-1:2012',freq_hz:null,harmonics_used:0};
  const mi=getMonitoringInterval(d.zoneRow.zone_label,d.trendRow.code);
  const allZ=getZonesForClass(selClassId);
  const zI=allZ.findIndex(z=>z.zone_label===d.zoneRow.zone_label);
  const urg=zI===allZ.length-1?'IMMEDIATE SHUTDOWN':zI===allZ.length-2?'URGENT — within 7 days':'PLANNED — within 90 days';
  const cq=top.pct>=60?'':'indicative of ';
  const fA=top.name.includes('BPFO')?'Spectral signature is '+cq+'outer race bearing defect (BPFO). CF ('+d.cf+') and Kurtosis ('+d.kurt+') '+(top.pct>=60?'confirm':'suggest')+' impacting behaviour. '+top.harmonics_used+' harmonic(s) at ~'+(top.freq_hz?top.freq_hz.toFixed(1):'est.')+' Hz. Per '+top.iso_reference+'.':top.name.includes('BPFI')?'Spectral signature is '+cq+'inner race bearing defect. Kurtosis ('+d.kurt+') provides supporting evidence. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.':top.name.includes('Imbalance')?'1× shaft frequency component is '+cq+'mechanical imbalance. '+top.harmonics_used+' harmonic(s) at ~'+(top.freq_hz?top.freq_hz.toFixed(1):'est.')+' Hz. Per '+top.iso_reference+'.':top.name.includes('Misalignment')?'2×/3× harmonic content is '+cq+'shaft misalignment. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.':top.name.includes('Looseness')?'Multiple harmonics are '+cq+'mechanical looseness. '+top.harmonics_used+' matched. Per '+top.iso_reference+'.':'Spectral signature is '+cq+top.name+'. '+top.harmonics_used+' harmonic(s) matched. Per '+top.iso_reference+'.';
  return '1. DIAGNOSTIC SUMMARY\nISO Zone '+d.zoneRow.zone_label+' ('+d.zoneRow.iso_clause_ref+'). RMS: '+d.rms+' '+d.cu+' on '+d.classRow.machine_type_desc+'.\n'+d.zoneRow.action_required+'\nDeviation: '+d.devSc+'σ ('+d.devRow.classification+', '+d.devRow.iso_reference+').\nTrend: '+d.trendRow.code+' — '+d.trendRow.description+' ('+d.trendRow.iso_reference+').\nNote: Single measurement file — trend direction cannot be established from one snapshot. Multiple readings over time required per '+d.trendRow.iso_reference+'.\n\n2. PRIMARY FAULT ANALYSIS ('+top.iso_reference+')\n'+top.name+' at '+top.pct+'% confidence.\n'+fA+(d.faults[1]?'\nSecondary: '+d.faults[1].name+' at '+d.faults[1].pct+'% ('+d.faults[1].iso_reference+').':'')+'\n\n3. SEVERITY ASSESSMENT\n'+allZ.map(z=>'Zone '+z.zone_label+': '+z.rms_lower_mm_s+'–'+(z.rms_upper_mm_s===99999?'∞':z.rms_upper_mm_s)+' mm/s — '+z.action_required+' ('+z.iso_clause_ref+')').join('\n')+'\nCurrent RMS '+d.rms+' '+d.cu+' → Zone '+d.zoneRow.zone_label+'.\nUrgency: '+urg+'\n\n4. RECOMMENDED ACTIONS\nImmediate:\n'+(zI===allZ.length-1?'• Controlled shutdown required. Do not restart without engineering authorisation. ('+d.zoneRow.iso_clause_ref+')':zI===allZ.length-2?'• Schedule maintenance within 7 days. ('+d.zoneRow.iso_clause_ref+')':'• Continue current schedule. Document per ISO 55001:2014 §7.5.')+'\nShort-term:\n• '+(top.name.includes('BPF')||top.name.includes('BSF')||top.name.includes('FTF')?'Inspect bearing. Verify lubrication per ISO 13373-1:2002 §6.2.':top.name.includes('Imbalance')?'Dynamic balance per ISO 1940-1.':top.name.includes('Misalignment')?'Precision alignment. Check soft-foot.':top.name.includes('Looseness')?'Inspect fasteners and connections.':'Address fault per '+top.iso_reference+'.')+'\nLong-term:\n• Re-baseline post-maintenance (ISO 13373-2:2016 §8.1).\n\n5. MONITORING GUIDANCE ('+mi.iso_reference+')\nInterval: '+mi.interval_desc+'.\nMeasure H/V/A at bearing housings (ISO 13373-1:2002 §5.2). Track RMS, CF, Kurtosis.\n\n6. RUL & PROGNOSTIC NOTE ('+d.rulR.iso_reference+')\nRUL: '+d.rulR.days+'d ± '+d.rulR.ci+'d CI ('+Math.round((1-CONFIG.rul_ci_fraction)*100)+'% confidence).\n'+(d.rulR.days<60?'Below 60 days — begin maintenance planning immediately.':'Continue trending to improve accuracy.')+'\nPer '+d.rulR.iso_reference+': this estimate must not be the sole criterion for maintenance deferral. Qualified engineering review required.';
}

async function typeText(el,text){el.textContent='';for(let i=0;i<text.length;i+=4){el.textContent+=text.slice(i,i+4);if(i%80===0)await new Promise(r=>setTimeout(r,5));}}

}); // end DOMContentLoaded
