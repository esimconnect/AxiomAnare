// ============================================================
// AxiomAnare — Multi-Channel Engine  (multiChannel.js)
// Up to 6 channels  |  2 locations × 3 axes  |  ISO 13373-1
// ============================================================

// ── State ────────────────────────────────────────────────────
window.MC = {
  enabled:   false,          // toggled by wizard switch
  mapping:   [],             // [{col, location, axis}]  user-assigned
  results:   [],             // per-channel NVR results after pipeline
  rawTable:  null,           // parsed rows (all columns) from parseData
};

// ── Constants ─────────────────────────────────────────────────
const MC_LOCATIONS = [
  'Drive End', 'Fan End',
  'Gearbox Input', 'Gearbox Output',
  'Bearing 1', 'Bearing 2', 'Bearing 3',
  'Bearing 4', 'Bearing 5', 'Bearing 6',
];
const MC_AXES = ['X', 'Y', 'Z'];
// MC_MAX_CHANNELS now from window.CONFIG.mc_max_channels

// ── ISO 13373-1 Cross-Axis Confidence Rules ───────────────────
// Keys are fault categories; each rule boosts confidence when
// the same fault appears on multiple axes.
// Cross-axis rules loaded from CONFIG at runtime (see app.js mc_cross_axis_rules)
// Accessor — always reads live from window.CONFIG so rules stay in sync
function mcGetCrossAxisRules() {
  return window.CONFIG?.mc_cross_axis_rules || [];
}

// ── Detect numeric columns that look like signal channels ─────
// Returns array of column names (excludes time/index/sample)
function mcDetectSignalColumns(parsedResult) {
  if (!parsedResult) return [];
  const allHeaders = parsedResult.allHeaders || [];

  // Columns to always exclude — not raw vibration signals
  const excludePatterns = [
    // Time / index
    'time','timestamp','t','date','seconds','ms','index','sample','i','n',
    // Metadata / descriptive
    'machine','sensor','location','unit','tag','id','name','label','type',
    'equipment','asset','point','channel','description','comment','note',
    // Derived / processed (not raw signals)
    'severity','zone','iso_zone','status','grade','class','category',
    'day','hour','minute','hour_of_day','shift','period',
    'rms','peak','cf','crest','kurtosis','skew','deviation','sigma',
    'health','score','index','indicator','flag','alert','alarm',
    // Environmental / process
    'temperature','temp','humidity','pressure','flow','speed','load',
    'power','current','voltage','frequency','rpm','hz',
    // Phase / trigger
    'phase','spike_phase','trigger','tach','key',
    // Displacement (derived from velocity/accel)
    'displacement','disp',
  ];

  // Patterns that positively indicate a vibration signal column
  const signalPatterns = [
    'accel','acc','acceleration','vibration','vib','velocity','vel',
    'amplitude','amp','signal','ch','chan','axis',
    '_x','_y','_z','_h','_v','_a',
    'g_rms','mm_s','mm/s','in_s',
  ];

  return allHeaders.filter(h => {
    const hl = h.toLowerCase();

    // Hard exclude if matches any exclusion pattern
    if (excludePatterns.some(ex =>
      hl === ex || hl.startsWith(ex + '_') || hl.endsWith('_' + ex) ||
      hl.includes('_' + ex + '_')
    )) return false;

    // Accept if matches a signal pattern
    if (signalPatterns.some(sig => hl.includes(sig))) return true;

    // Otherwise: only accept if it's a short generic column name
    // (e.g. 'ch1', 'x', 'y', 'z') and not a known non-signal type
    if (/^(ch\d+|channel\d+|[xyz]\d*|axis\d*)$/i.test(hl)) return true;

    // Default: reject ambiguous columns — better to miss one than false-positive
    return false;
  });
}

// ── Extract values for a specific column from raw CSV string ──
function mcExtractColumn(raw, colName) {
  const result = typeof Papa !== 'undefined'
    ? Papa.parse(raw.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true })
    : null;
  if (result?.data?.length > 5) {
    const values = result.data.map(r => r[colName]).filter(v => typeof v === 'number' && isFinite(v));
    // Detect unit from column name
    const cl = colName.toLowerCase();
    let unit = 'g';
    if (cl.includes('velocity') || cl.includes('vel_') || cl === 'vel') unit = 'mm/s';
    else if (cl.includes('mm_s') || cl === 'mm/s') unit = 'mm/s';
    else if (cl.includes('m/s2') || cl.includes('ms2')) unit = 'm/s2';
    else if (cl.includes('mg') && !cl.includes('img')) unit = 'mg';
    return { values, unit };
  }
  return { values: [], unit: 'g' };
}

// ── Apply cross-axis confidence rules ─────────────────────────
// Input: array of per-channel NVR result objects (each has .axis, .faults)
// Returns: array of cross-axis findings with boosted confidence
function mcApplyCrossAxisRules(channelResults) {
  const findings = [];
  for (const rule of mcGetCrossAxisRules()) {
    // Group 1: channels sharing the same location
    const byLocation = {};
    for (const ch of channelResults) {
      const loc = ch.location || 'Unknown';
      if (!byLocation[loc]) byLocation[loc] = [];
      byLocation[loc].push(ch);
    }
    // Group 2: all channels together (same machine, different measurement points)
    // This catches imbalance/misalignment which appear across all axes regardless of location
    const allGroup = { '__all__': channelResults };
    const groups = { ...byLocation, ...allGroup };

    for (const [loc, channels] of Object.entries(groups)) {
      if (channels.length < rule.requiredAxes) continue;
      // Find channels where this fault has meaningful confidence
      const faultThreshold = window.CONFIG?.mc_cross_axis_fault_threshold_pct ?? 10;
      const axesWithFault = channels.filter(ch => {
        const top = (ch.faults || []).find(f => {
          if (f.locked || f.pct < faultThreshold) return false;
          if (rule.faultName) return f.name === rule.faultName;
          return f.category === rule.category;
        });
        return !!top;
      });
      if (axesWithFault.length >= rule.requiredAxes) {
        const avgPct = axesWithFault.reduce((s, ch) => {
          const f = (ch.faults || []).find(f =>
            rule.faultName ? f.name === rule.faultName : f.category === rule.category
          );
          return s + (f?.pct || 0);
        }, 0) / axesWithFault.length;
        const displayLoc = loc === '__all__' ? 'All Channels' : loc;
        // Skip if already captured by a more specific location group
        const alreadyFound = findings.some(f =>
          f.rule.id === rule.id && f.axes.join() === axesWithFault.map(ch => ch.axis).join()
        );
        if (!alreadyFound) {
          findings.push({
            rule,
            location: displayLoc,
            axes: axesWithFault.map(ch => ch.axis),
            basePct: avgPct,
            boostedPct: Math.min(98, avgPct + rule.boostPct),
            confirmed: true,
          });
        }
      }
    }
  }
  return findings;
}

// ── Build a summary verdict across all channels ───────────────
function mcBuildCombinedVerdict(channelResults, crossAxisFindings) {
  if (!channelResults.length) return null;

  // Worst zone across all channels
  const zoneOrder = ['A', 'B', 'C', 'D'];
  const worstZone = channelResults.reduce((worst, ch) => {
    const zi = zoneOrder.indexOf(ch.zoneRow?.zone_label);
    const wi = zoneOrder.indexOf(worst);
    return zi > wi ? ch.zoneRow.zone_label : worst;
  }, 'A');

  // Highest fault confidence (boosted by cross-axis where applicable)
  let topFault = null;
  let topPct = 0;
  for (const f of crossAxisFindings) {
    if (f.boostedPct > topPct) {
      topPct = f.boostedPct;
      topFault = { name: f.rule.label, pct: f.boostedPct, crossAxis: true, clause: f.rule.clause, location: f.location, axes: f.axes };
    }
  }
  for (const ch of channelResults) {
    const cf = (ch.faults || []).find(f => !f.locked);
    if (cf && cf.pct > topPct) {
      topPct = cf.pct;
      topFault = { ...cf, location: ch.location, axis: ch.axis, crossAxis: false };
    }
  }

  // ── Fault-adjusted zone override (ISO 13379-1:2012 §5.4) ──────────────
  // Frequency-domain fault findings override RMS-based zone when confidence
  // is high enough — same policy as single-channel applyFaultOverride().
  // This prevents a false "Zone A green" when significant faults are developing.
  let adjustedZone = worstZone;
  let zoneOverrideReason = null;
  const cfg = window.CONFIG;
  const bearingOverridePct  = cfg?.fault_zone_override?.bearing_threshold  ?? 60;
  const elevatedOverridePct = cfg?.fault_zone_override?.elevated_threshold ?? 40;

  if (topPct >= bearingOverridePct && (worstZone === 'A' || worstZone === 'B')) {
    // Strong confirmed fault — escalate to C
    adjustedZone = worstZone === 'A' ? 'C' : 'C';
    zoneOverrideReason = `Fault confidence ${topPct.toFixed(0)}% overrides RMS zone — ISO 13379-1:2012 §5.4`;
  } else if (topPct >= elevatedOverridePct && worstZone === 'A') {
    // Elevated fault in Zone A — escalate to B (caution)
    adjustedZone = 'B';
    zoneOverrideReason = `Fault confidence ${topPct.toFixed(0)}% indicates developing fault in Zone A — monitor closely`;
  }

  // Worst RUL
  const minRUL = Math.min(...channelResults.map(ch => ch.rulR?.days || 999));

  // Overall health index (average, weighted toward worst)
  const hiVals = channelResults.map(ch => {
    const h = ch.healthIdx;
    return typeof h === 'object' ? (h?.score ?? 50) : (h ?? 100);
  }).sort((a, b) => a - b);
  const weightedHI = hiVals.length > 1
    ? (hiVals[0] * 2 + hiVals.slice(1).reduce((s, v) => s + v, 0)) / (hiVals.length + 1)
    : hiVals[0];

  return {
    worstZone: adjustedZone,
    worstZoneRMS: worstZone,
    zoneOverrideReason,
    topFault,
    minRUL,
    healthIdx: Math.round(weightedHI),
    channelCount: channelResults.length,
    crossAxisFindings,
  };
}

// ── Render the channel mapping UI ────────────────────────────
function mcRenderMappingUI(signalColumns) {
  const container = document.getElementById('mc-mapping-container');
  if (!container) return;

  // Limit to MC_MAX_CHANNELS
  const cols = signalColumns.slice(0, window.CONFIG?.mc_max_channels || 6);

  // Initialise MC.mapping if needed
  if (!MC.mapping.length || MC.mapping.length !== cols.length) {
    MC.mapping = cols.map((col, i) => ({
      col,
      location: MC_LOCATIONS[i] || MC_LOCATIONS[0],
      axis: MC_AXES[i % 3],
      enabled: true,
    }));
  }

  container.innerHTML = `
    <div class="mc-mapping-header">
      <span class="mc-mapping-title">&#128290; Channel Mapping</span>
      <span class="mc-mapping-sub">${cols.length} signal column${cols.length !== 1 ? 's' : ''} detected · assign location + axis</span>
    </div>
    <div class="mc-channel-grid">
      ${cols.map((col, i) => `
        <div class="mc-channel-row" id="mc-ch-${i}">
          <div class="mc-ch-col-label" title="${col}">${col}</div>
          <label class="mc-ch-enable">
            <input type="checkbox" id="mc-en-${i}" ${MC.mapping[i]?.enabled !== false ? 'checked' : ''}
              onchange="mcToggleChannel(${i}, this.checked)">
            <span>Active</span>
          </label>
          <select class="mc-select" id="mc-loc-${i}" onchange="mcUpdateMapping(${i})">
            ${MC_LOCATIONS.map(l => `<option value="${l}" ${MC.mapping[i]?.location === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
          <select class="mc-select mc-select-axis" id="mc-ax-${i}" onchange="mcUpdateMapping(${i})">
            ${MC_AXES.map(a => `<option value="${a}" ${MC.mapping[i]?.axis === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
      `).join('')}
    </div>
  `;
}

window.mcToggleChannel = function(i, enabled) {
  if (MC.mapping[i]) MC.mapping[i].enabled = enabled;
  const row = document.getElementById('mc-ch-' + i);
  if (row) row.classList.toggle('mc-ch-disabled', !enabled);
};

window.mcUpdateMapping = function(i) {
  if (!MC.mapping[i]) return;
  const loc = document.getElementById('mc-loc-' + i);
  const ax  = document.getElementById('mc-ax-' + i);
  if (loc) MC.mapping[i].location = loc.value;
  if (ax)  MC.mapping[i].axis = ax.value;
};

// ── Run pipeline for each active channel ─────────────────────
// Called from app.js instead of single-channel runPipeline when MC.enabled
async function runMultiChannelPipeline(raw, filename) {
  MC.results = [];
  const activeChannels = MC.mapping.filter(m => m.enabled);
  if (!activeChannels.length) {
    alert('No channels enabled. Please enable at least one channel.');
    return;
  }

  // Show processing screen
  const procScreen = document.getElementById('processing-screen');
  if (procScreen) procScreen.style.display = 'flex';
  document.getElementById('results-screen').style.display = 'none';

  for (let i = 0; i < activeChannels.length; i++) {
    const ch = activeChannels[i];
    const label = `[${ch.location} · ${ch.axis}]`;
    if (typeof setNote === 'function') setNote(`Channel ${i+1}/${activeChannels.length} — ${label}`);

    // Extract this column's values from raw
    const { values, unit } = mcExtractColumn(raw, ch.col);
    if (values.length < 10) {
      MC.results.push({ col: ch.col, location: ch.location, axis: ch.axis, error: 'Insufficient data' });
      continue;
    }

    // Build a mini-raw string with just this column for compatibility with runPipeline internals
    // But we run computations directly to avoid UI side-effects
    const sr = window.machineParams?.declaredSampleRate || window.CONFIG.default_sample_rate_hz;
    const cu = window.CONFIG.unit_conversion_factors.find(r => r.canonical_flag === 1).to_unit;
    const currentClassId = (window.__getSelClassId && window.__getSelClassId()) || window.selClassId;

    // Convert units
    let vals;
    if (['g', 'm/s2', 'mg'].includes(unit)) {
      const rf = window.computeFFT(values, sr);
      const hz = window.detectShaft(rf);
      vals = values.map(v => window.toCanonicalUnit(v, unit, hz));
    } else {
      vals = values.map(v => window.toCanonicalUnit(v, unit, null));
    }

    // Core statistics
    const n    = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n) || 1;
    const rms  = Math.sqrt(vals.reduce((s, v) => s + v * v, 0) / n);
    let peak = 0;
    for (let j = 0; j < vals.length; j++) { const a = Math.abs(vals[j]); if (a > peak) peak = a; }
    const cf   = peak / (rms || 1);
    const kurt = vals.reduce((s, v) => s + ((v - mean) / std) ** 4, 0) / n;

    // Zone / fault / RUL
    const zoneRow  = window.lookupZone(rms, currentClassId);
    const classRow = window.CONFIG.iso_machine_classes.find(c => c.class_id === currentClassId);
    const fftR = window.computeFFT(vals, sr);
    fftR._rawSignal = vals;
    if (window.machineParams?.shaftHz > 0) fftR._shaftHz = window.machineParams.shaftHz;
    const dataTypes = window.detectDataTypes([ch.col]);
    const allFaults = window.classifyFaults(fftR, cf, kurt, dataTypes, window.machineParams || {});
    const faults = [...allFaults.filter(f => !f.locked), ...allFaults.filter(f => f.locked)];

    // Deviation score (no baseline per-channel — uses signal self-stats)
    const devSc  = (rms - mean) / std;
    const devRow = window.classifyDeviation(Math.abs(devSc));

    // Trend (DDU — single file, multi-channel rarely has history per-channel)
    const trendRow = window.CONFIG.trend_state_rules.find(r => r.code === 'DDU');

    // Override + RUL
    const override = window.applyFaultOverride(zoneRow, window.calcRUL(zoneRow.zone_label, trendRow.code), faults, kurt, cf, classRow);
    const rulR = override.rulR;
    const finalZoneRow = override.zoneRow;

    const topBearingFault = faults.find(f => !f.locked && f.category === 'bearing');
    const healthIdxObj = window.calcHealthIndex(rms, kurt, cf, finalZoneRow.zone_label,
      topBearingFault ? topBearingFault.pct : 0, Math.abs(devSc), classRow);
    const healthIdx = healthIdxObj?.score ?? healthIdxObj ?? 50;

    MC.results.push({
      col: ch.col,
      location: ch.location,
      axis: ch.axis,
      rms: rms.toFixed(3),
      peak: peak.toFixed(3),
      cf: cf.toFixed(2),
      kurt: kurt.toFixed(2),
      devSc: devSc.toFixed(2),
      devRow,
      zoneRow: finalZoneRow,
      trendRow,
      faults,
      fftR,
      rulR,
      healthIdx,
      sr,
      cu,
      n,
      classRow,
    });
  }

  // Cross-axis analysis
  const crossAxisFindings = mcApplyCrossAxisRules(MC.results.filter(r => !r.error));
  const combined = mcBuildCombinedVerdict(MC.results.filter(r => !r.error), crossAxisFindings);

  // Render MC combined verdict
  if (procScreen) procScreen.style.display = 'none';
  document.getElementById('results-screen').style.display = 'block';
  mcRenderResults(MC.results, combined, filename);

  // Render worst channel through single-channel pipeline for FFT/radar/trend charts
  // Find worst channel by zone then RMS
  const zoneOrder = ['A','B','C','D'];
  const worstCh = MC.results.filter(r => !r.error).sort((a, b) => {
    const zi = zoneOrder.indexOf(b.zoneRow?.zone_label) - zoneOrder.indexOf(a.zoneRow?.zone_label);
    return zi !== 0 ? zi : parseFloat(b.rms) - parseFloat(a.rms);
  })[0];

  if (worstCh && window.nvr !== undefined) {
    // Inject worst channel data into nvr so renderResults/buildFFT/buildRadar work
    window.nvr = {
      filename: `${filename} — ${worstCh.location} (${worstCh.axis}) [worst channel]`,
      rms: worstCh.rms, peak: worstCh.peak, cf: worstCh.cf, kurt: worstCh.kurt,
      devSc: worstCh.devSc, devRow: worstCh.devRow,
      zoneRow: worstCh.zoneRow, trendRow: worstCh.trendRow,
      faults: worstCh.faults, fftR: worstCh.fftR, rulR: worstCh.rulR,
      healthIdx: (() => {
        const score = worstCh.healthIdx;
        const thr = (window.CONFIG?.health_thresholds || [{min:75,label:'Good',color:'var(--green)'},{min:50,label:'Monitor',color:'#f59e0b'},{min:0,label:'Critical',color:'var(--red)'}]);
        const t = [...thr].sort((a,b)=>b.min-a.min).find(t=>score>=t.min) || thr[thr.length-1];
        return { score, label: t.label, color: t.color, breakdown: [] };
      })(),
      n: worstCh.n, sr: worstCh.sr, cu: worstCh.cu, classRow: worstCh.classRow,
      dataTypes: { vibration: true }, dataBanner: '',
      earlyWarn: false, override: { overrideActive: false },
      singleFile: true, historyCount: 0, _history: [],
      shaftHz: window.machineParams?.shaftHz || 0,
      machineParams: window.machineParams || {},
      assetName: null,
    };
    // Update results meta label
    const metaEl = document.getElementById('results-meta');
    if (metaEl) metaEl.textContent = `Multi-Channel · ${MC.results.filter(r=>!r.error).length} channels · Worst: ${worstCh.location} (${worstCh.axis})`;
    // Run single-channel render for charts
    if (typeof renderResults === 'function') renderResults();
  }

  // Stream Claude multi-channel AI summary
  mcStreamClaude(MC.results, combined, filename);
}

// ── Channel colour palette ────────────────────────────────────
const MC_CH_COLORS = [
  { line: '#4d9de0', fill: 'rgba(77,157,224,0.15)',  label: 'X' },
  { line: '#e15759', fill: 'rgba(225,87,89,0.15)',   label: 'Y' },
  { line: '#59a14f', fill: 'rgba(89,161,79,0.15)',   label: 'Z' },
  { line: '#f28e2b', fill: 'rgba(242,142,43,0.15)',  label: 'Ch4' },
  { line: '#b07aa1', fill: 'rgba(176,122,161,0.15)', label: 'Ch5' },
  { line: '#76b7b2', fill: 'rgba(118,183,178,0.15)', label: 'Ch6' },
];

// ── MC chart instances ────────────────────────────────────────
let mcRadarInst = null, mcFftInst = null;
// Expose to window so app.js beforeprint handler can redraw them
Object.defineProperty(window, 'mcRadarInst', { get: () => mcRadarInst, configurable: true });
Object.defineProperty(window, 'mcFftInst',   { get: () => mcFftInst,   configurable: true });

// ── Render multi-channel results ─────────────────────────────
function mcRenderResults(channelResults, combined, filename) {
  const container = document.getElementById('multiChannelResults');
  if (!container) return;

  // Hide single-channel charts; MC has its own
  const scr = document.getElementById('single-channel-results');
  if (scr) scr.style.display = 'none';

  const zoneColors = { A: '#22c55e', B: '#f59e0b', C: '#f97316', D: '#ef4444' };
  const zoneBg     = { A: 'rgba(34,197,94,0.1)', B: 'rgba(245,158,11,0.12)', C: 'rgba(249,115,22,0.15)', D: 'rgba(239,68,68,0.15)' };
  const cardBorder = combined?.worstZone === 'D' ? 'rgba(239,68,68,0.5)'
                   : combined?.worstZone === 'C' ? 'rgba(249,115,22,0.4)'
                   : combined?.worstZone === 'B' ? 'rgba(245,158,11,0.35)'
                   : 'rgba(77,157,224,0.35)';
  const hiColor = h => h >= 75 ? '#22c55e' : h >= 50 ? '#f59e0b' : h >= 25 ? '#f97316' : '#ef4444';
  const ok = channelResults.filter(r => !r.error);

  container.innerHTML = `
    <div class="mc-combined-card" style="border-color:${cardBorder}">
      <div class="mc-combined-header">
        <span class="mc-combined-icon">&#128202;</span>
        <div>
          <div class="mc-combined-title">Multi-Channel Combined Assessment</div>
          <div class="mc-combined-sub">${filename} &middot; ${channelResults.length} channel${channelResults.length!==1?'s':''} &middot; ISO 13373-1${combined?.zoneOverrideReason ? `<br><span style="color:${zoneColors[combined?.worstZone]||'#f59e0b'};font-size:9px;">&#9888; Zone escalated from ${combined.worstZoneRMS} (RMS) &mdash; ${combined.zoneOverrideReason}</span>` : ''}</div>
        </div>
        <div class="mc-combined-zone" style="background:${zoneBg[combined?.worstZone]||'rgba(85,85,85,0.1)'};border-color:${zoneColors[combined?.worstZone]||'#555'};color:${zoneColors[combined?.worstZone]||'#555'}">
          Zone ${combined?.worstZone||'&mdash;'}
        </div>
      </div>
      <div class="mc-ch-score-row">
        ${ok.map((ch,i)=>{const col=MC_CH_COLORS[i]||MC_CH_COLORS[0];return`<div class="mc-ch-score-cell"><div class="mc-ch-score-dot" style="background:${col.line}"></div><div class="mc-ch-score-loc">${ch.location}<br><span class="mc-ch-score-axis">${ch.axis}</span></div><div class="mc-ch-score-hi" style="color:${hiColor(ch.healthIdx)}">${ch.healthIdx}</div><div class="mc-ch-score-zone" style="color:${zoneColors[ch.zoneRow?.zone_label]||'#888'}">Zone ${ch.zoneRow?.zone_label||'?'}</div><div class="mc-ch-score-rms">${ch.rms} mm/s</div></div>`;}).join('')}
      </div>
      <div class="mc-combined-metrics">
        <div class="mc-metric-box"><div class="mc-metric-val" style="color:${hiColor(combined?.healthIdx||0)}">${combined?.healthIdx??'&mdash;'}</div><div class="mc-metric-label">Combined Health</div></div>
        <div class="mc-metric-box"><div class="mc-metric-val">${combined?.minRUL??'&mdash;'}<span class="mc-metric-unit">d</span></div><div class="mc-metric-label">Min RUL</div></div>
        <div class="mc-metric-box"><div class="mc-metric-val">${ok.length}</div><div class="mc-metric-label">Channels OK</div></div>
        <div class="mc-metric-box"><div class="mc-metric-val">${combined?.crossAxisFindings?.length??0}</div><div class="mc-metric-label">Cross-Axis</div></div>
      </div>
      ${combined?.topFault?`<div class="mc-top-fault"><span class="mc-fault-icon">&#9888;</span><div style="flex:1"><div class="mc-fault-name">${combined.topFault.name}${combined.topFault.crossAxis?'<span class="mc-xaxis-badge">Cross-Axis</span>':''}</div><div class="mc-fault-meta">${combined.topFault.location||''}${combined.topFault.axes?' &middot; Axes: '+combined.topFault.axes.join(', '):combined.topFault.axis?' &middot; '+combined.topFault.axis:''} &middot; ${combined.topFault.pct?.toFixed(0)}% confidence${combined.topFault.clause?'<span class="mc-iso-ref">'+combined.topFault.clause+'</span>':''}</div></div><div class="mc-fault-pct-bar"><div style="width:${combined.topFault.pct}%;background:${window.faultIndicatorColor?window.faultIndicatorColor(combined.topFault.pct):'#f59e0b'}"></div></div></div>`:''}
    </div>

    ${combined?.crossAxisFindings?.length?`<div class="mc-section-header"><span>&#128279; Cross-Axis Fault Confirmation</span><span class="mc-section-clause">ISO 13373-1:2002 &sect;6.3</span></div><div class="mc-cross-axis-grid">${combined.crossAxisFindings.map(f=>`<div class="mc-cross-card"><div class="mc-cross-loc">${f.location}</div><div class="mc-cross-axes">${f.axes.join(' + ')} axes</div><div class="mc-cross-name">${f.rule.label}</div><div class="mc-cross-pct">${f.boostedPct.toFixed(0)}% <span class="mc-boost-tag">+${f.rule.boostPct}% boosted</span></div><div class="mc-cross-note">${f.rule.note}</div><div class="mc-iso-ref">${f.rule.clause}</div></div>`).join('')}</div>`:''}

    <div class="mc-charts-row">
      <div class="mc-chart-card">
        <div class="mc-chart-header"><span class="mc-chart-title">Fault Severity Radar &mdash; All Channels</span><span class="mc-section-clause">ISO 13379-1</span></div>
        <div class="mc-chart-legend" id="mc-radar-legend"></div>
        <div style="position:relative;height:250px;padding:6px"><canvas id="mc-radarChart"></canvas></div>
      </div>
      <div class="mc-chart-card">
        <div class="mc-chart-header"><span class="mc-chart-title">FFT Frequency Spectrum &mdash; All Channels</span><span class="mc-section-clause">ISO 13373-2</span></div>
        <div class="mc-chart-legend" id="mc-fft-legend"></div>
        <div style="position:relative;height:250px;padding:6px"><canvas id="mc-fftChart"></canvas></div>
      </div>
    </div>

    <div class="mc-section-header"><span>&#128312; Per-Channel Breakdown</span><span class="mc-section-clause">Independent pipeline per axis</span></div>
    <div class="mc-channels-grid">
      ${channelResults.map((ch,i)=>{const col=MC_CH_COLORS[i]||MC_CH_COLORS[0];return ch.error?`<div class="mc-ch-card mc-ch-error" style="border-left:3px solid ${col.line}"><div class="mc-ch-card-header"><span class="mc-ch-loc">${ch.location}</span><span class="mc-ch-axis">${ch.axis}</span></div><div class="mc-ch-col">${ch.col}</div><div style="color:var(--red);font-size:11px;margin-top:6px;">&#10007; ${ch.error}</div></div>`:`<div class="mc-ch-card" style="border-left:3px solid ${col.line}"><div class="mc-ch-card-header"><div class="mc-ch-color-dot" style="background:${col.line}"></div><span class="mc-ch-loc">${ch.location}</span><span class="mc-ch-axis">${ch.axis}</span><span class="mc-ch-zone" style="color:${zoneColors[ch.zoneRow?.zone_label]||'#888'}">Zone ${ch.zoneRow?.zone_label||'?'}</span></div><div class="mc-ch-col">${ch.col}</div><div class="mc-ch-metrics"><div class="mc-ch-met"><div class="mc-ch-met-val">${ch.rms}</div><div class="mc-ch-met-lbl">RMS mm/s</div></div><div class="mc-ch-met"><div class="mc-ch-met-val">${ch.cf}</div><div class="mc-ch-met-lbl">Crest F.</div></div><div class="mc-ch-met"><div class="mc-ch-met-val">${ch.kurt}</div><div class="mc-ch-met-lbl">Kurtosis</div></div><div class="mc-ch-met"><div class="mc-ch-met-val" style="color:${hiColor(ch.healthIdx)}">${ch.healthIdx}</div><div class="mc-ch-met-lbl">Health</div></div></div><div class="mc-ch-faults">${(ch.faults||[]).filter(f=>!f.locked&&f.pct>=(window.CONFIG?.minimum_fault_confidence_pct||10)).slice(0,3).map(f=>`<div class="mc-ch-fault-row"><span class="mc-ch-fault-name">${f.name}</span><div class="mc-ch-fault-bar"><div style="width:${f.pct}%;background:${window.faultIndicatorColor?window.faultIndicatorColor(f.pct):'#f59e0b'}"></div></div><span class="mc-ch-fault-pct">${f.pct.toFixed(0)}%</span></div>`).join('')||'<div style="font-size:10px;color:var(--muted);margin-top:4px;">No significant faults detected</div>'}</div><div class="mc-ch-rul">RUL: <strong>${ch.rulR?.days??'&mdash;'}d</strong> &plusmn;${ch.rulR?.ci??'&mdash;'}d &middot; ${ch.trendRow?.code||'DDU'}</div></div>`;}).join('')}
    </div>

    <div class="mc-ai-section" id="mc-ai-section">
      <div class="mc-ai-header">
        <span class="mc-ai-icon">&#129504;</span>
        <span class="mc-ai-title">AI Multi-Channel Analysis</span>
        <span class="mc-ai-badge">Claude AI &middot; Streaming</span>
      </div>
      <div class="mc-ai-body" id="mc-ai-body">
        <span style="color:var(--muted)">Generating multi-channel diagnostic summary&hellip;</span>
      </div>
      <div class="disclaimer-last" style="display:none;">AxiomAnare &middot; AI-assisted diagnostic report &middot; Not a certified engineering determination</div>
    </div>
  `;

  requestAnimationFrame(() => { mcBuildRadar(ok); mcBuildFFT(ok); });
}

// ── MC Radar Chart ────────────────────────────────────────────
function mcBuildRadar(channelResults) {
  if (mcRadarInst) { mcRadarInst.destroy(); mcRadarInst = null; }
  const canvas = document.getElementById('mc-radarChart');
  if (!canvas || !channelResults.length) return;

  const faultMap = {};
  channelResults.forEach(ch => (ch.faults||[]).filter(f=>!f.locked).forEach(f => {
    if (!faultMap[f.name] || faultMap[f.name] < f.pct) faultMap[f.name] = f.pct;
  }));
  const sorted = Object.entries(faultMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const labels     = sorted.map(([n])=>n.split(' - ').pop().trim().split(' ').slice(0,3).join(' '));
  const faultNames = sorted.map(([n])=>n);

  // Dynamic scale: set max to highest score rounded up to next 10, minimum ceiling of 40
  // Apply a display floor: remap scores so even low values show spread across the chart.
  // Floor lifts all non-zero scores to at least 15% of the scale for visibility.
  const maxScore = Math.max(...Object.values(faultMap), 1);
  const scaleMax = Math.max(40, Math.ceil(maxScore / 10) * 10 + 10);
  const floor = scaleMax * 0.12; // minimum visible radius for any non-zero value

  const remap = pct => pct > 0 ? Math.max(floor, pct) : 0;

  const datasets = channelResults.map((ch, i) => {
    const col = MC_CH_COLORS[i] || MC_CH_COLORS[0];
    const data = faultNames.map(n => {
      const f = (ch.faults||[]).find(f => f.name === n);
      return f ? remap(f.pct) : 0;
    });
    return {
      label: `${ch.location} (${ch.axis})`,
      data,
      backgroundColor: col.fill,
      borderColor: col.line,
      borderWidth: 2,
      pointBackgroundColor: col.line,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    };
  });

  // Tooltip shows real pct, not remapped value
  const realPct = (datasetIndex, dataIndex) => {
    const ch = channelResults[datasetIndex];
    if (!ch) return 0;
    const f = (ch.faults||[]).find(f => f.name === faultNames[dataIndex]);
    return f ? f.pct : 0;
  };

  const stepSize = scaleMax <= 40 ? 10 : scaleMax <= 60 ? 10 : 20;

  mcRadarInst = new Chart(canvas.getContext('2d'), {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a2030', borderColor: '#4d9de0', borderWidth: 1,
          callbacks: {
            label: c => ` ${c.dataset.label}: ${realPct(c.datasetIndex, c.dataIndex).toFixed(0)}%`,
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: scaleMax,
          ticks: {
            stepSize,
            backdropColor: 'rgba(26,36,53,0.8)',
            color: '#7f93aa',
            font: { size: 9 },
            callback: v => v + '%',
          },
          grid:        { color: 'rgba(77,157,224,0.2)' },
          angleLines:  { color: 'rgba(77,157,224,0.25)' },
          pointLabels: { color: '#e8edf5', font: { size: 9, weight: 'bold' } },
        }
      }
    }
  });

  const leg = document.getElementById('mc-radar-legend');
  if (leg) leg.innerHTML = channelResults.map((ch, i) => {
    const col = MC_CH_COLORS[i] || MC_CH_COLORS[0];
    return `<div class="mc-legend-item"><div class="mc-legend-dot" style="background:${col.line}"></div>${ch.location} (${ch.axis})</div>`;
  }).join('');
}

// ── MC FFT Chart — overlaid spectra ──────────────────────────
function mcBuildFFT(channelResults) {
  if (mcFftInst) { mcFftInst.destroy(); mcFftInst = null; }
  const canvas = document.getElementById('mc-fftChart');
  if (!canvas || !channelResults.length) return;
  const sr = channelResults[0].sr;
  const fftRef = channelResults[0].fftR;
  if (!fftRef?.freqs?.length) return;
  const maxFreq = sr * 0.45;
  const step = Math.max(1, Math.floor(fftRef.freqs.length / 300));
  const freqLabels = [];
  for (let i=0; i<fftRef.freqs.length && fftRef.freqs[i]<maxFreq; i+=step) freqLabels.push(fftRef.freqs[i].toFixed(1));
  const datasets = channelResults.map((ch,i)=>{
    const col = MC_CH_COLORS[i]||MC_CH_COLORS[0];
    const data = [];
    for (let j=0; j<ch.fftR.freqs.length && ch.fftR.freqs[j]<maxFreq; j+=step) data.push(parseFloat(ch.fftR.mags[j].toFixed(5)));
    return { label:`${ch.location} (${ch.axis})`, data, borderColor:col.line, backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, pointHoverRadius:4, tension:0.1, fill:false };
  });
  mcFftInst = new Chart(canvas.getContext('2d'), { type:'line', data:{labels:freqLabels,datasets},
    options:{ responsive:true, maintainAspectRatio:false, animation:{duration:300},
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{display:false}, tooltip:{
        backgroundColor:'#1a2030', borderColor:'#4d9de0', borderWidth:1,
        callbacks:{
          title: items => items[0]?.label + ' Hz',
          label: c => ` ${c.dataset.label}: ${parseFloat(c.raw).toFixed(4)}`,
        }
      }},
      scales:{ x:{grid:{display:false},ticks:{maxTicksLimit:12,color:'#7f93aa',font:{size:9},callback:(v,i)=>parseFloat(freqLabels[i])%50<3?freqLabels[i]+'Hz':''}}, y:{grid:{color:'rgba(77,157,224,0.1)'},ticks:{color:'#7f93aa',font:{size:9}},min:0} } } });
  const leg = document.getElementById('mc-fft-legend');
  if (leg) leg.innerHTML = channelResults.map((ch,i)=>{const col=MC_CH_COLORS[i]||MC_CH_COLORS[0];return`<div class="mc-legend-item"><div class="mc-legend-line" style="background:${col.line}"></div>${ch.location} (${ch.axis})</div>`;}).join('');
}

// ── Stream Claude for multi-channel ──────────────────────────
async function mcStreamClaude(channelResults, combined, filename) {
  const bodyEl = document.getElementById('mc-ai-body');
  if (!bodyEl) return;

  const WORKER_URL = 'https://restless-tree-eac8.kairosventure-io.workers.dev';

  // Build a compact prompt
  const chSummary = channelResults.filter(r => !r.error).map(ch =>
    `  • ${ch.location} (${ch.axis}): Zone ${ch.zoneRow?.zone_label}, RMS=${ch.rms} mm/s, CF=${ch.cf}, Kurt=${ch.kurt}, HI=${ch.healthIdx}, Top fault: ${(ch.faults||[]).find(f=>!f.locked)?.name || 'None'} (${(ch.faults||[]).find(f=>!f.locked)?.pct?.toFixed(0)||0}%)`
  ).join('\n');

  const crossSummary = (combined?.crossAxisFindings || []).map(f =>
    `  • ${f.rule.label} at ${f.location} (${f.axes.join('+')}): ${f.boostedPct.toFixed(0)}% confidence [${f.rule.clause}]`
  ).join('\n');

  // Build diagnostic flags — same policy as single-channel
  const ok = channelResults.filter(r => !r.error);
  const topFaultPct = Math.max(...ok.map(ch => (ch.faults||[]).find(f=>!f.locked)?.pct || 0));
  const crossMaxPct = Math.max(...(combined?.crossAxisFindings||[]).map(f => f.boostedPct), 0);
  const rmsZone = combined?.worstZoneRMS || combined?.worstZone;  // use pre-override RMS zone
  const displayZone = combined?.worstZone;
  const flags = [];

  if (combined?.zoneOverrideReason) {
    flags.push(`ZONE_OVERRIDE_ACTIVE: RMS zone is ${rmsZone} but displayed zone is ${displayZone} due to fault confidence. ${combined.zoneOverrideReason}. YOU MUST reflect this in your assessment — do NOT write a "healthy" or "Zone A" summary.`);
  }
  if ((rmsZone === 'A' || rmsZone === 'B') && (topFaultPct >= 40 || crossMaxPct >= 40)) {
    flags.push('EARLY_WARNING: RMS is low but fault confidence is significant. FORBIDDEN: do not use words like "excellent", "optimal", "normal operation", or "no immediate action". Fault indicators require scheduled intervention per ISO 13373-1:2002 §6.3.');
  }
  if (topFaultPct < 40 && crossMaxPct < 40) {
    flags.push('LOW_CONFIDENCE: Top fault below 40% — use indicative language only.');
  }
  if (crossMaxPct >= 60) {
    flags.push('CROSS_AXIS_CONFIRMED: Cross-axis fault confidence ≥60% — this is a CONFIRMED fault, not indicative. Report it as requiring corrective action.');
  }

  const prompt = `You are AxiomAssist — an ISO-certified vibration analyst. Provide a concise multi-channel diagnostic summary (3 paragraphs).

File: ${filename} | Channels: ${ok.length} | Displayed Zone: ${displayZone} | RMS Zone: ${rmsZone} | Combined Health: ${combined?.healthIdx} | Min RUL: ${combined?.minRUL}d

Per-channel data:
${chSummary}

Cross-axis confirmed faults (ISO 13373-1):
${crossSummary || '  None confirmed.'}

=== CRITICAL FLAGS — MUST OBEY ===
${flags.length ? flags.map(f => '(!) ' + f).join('\n') : '  No flags.'}

=== RULES ===
1. Base your condition assessment on the DISPLAYED ZONE (${displayZone}), not the RMS zone.
2. If cross-axis faults are confirmed at ≥40%, they are a priority finding — not optional.
3. FORBIDDEN words when EARLY_WARNING or ZONE_OVERRIDE_ACTIVE flag is set: "excellent", "optimal", "no immediate action", "continued operation without intervention", "normal operation".
4. Use indicative language only for faults below 40% confidence.
5. Always cite ISO standards. Paragraph 1: condition + zone assessment. Paragraph 2: cross-axis interpretation. Paragraph 3: inspection priority.`;

  try {
    bodyEl.innerHTML = '<span style="color:var(--muted)">Connecting to AI…</span>';
    let fullText = '';

    // Retry up to 2 times — Worker may cold-start on first attempt
    let response;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
      try {
        response = await fetch('https://restless-tree-eac8.kairosventure-io.workers.dev', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: window.CONFIG?.chatbot_config?.model_version || 'claude-sonnet-4-20250514',
            max_tokens: window.CONFIG?.chatbot_config?.max_output_tokens || 1000,
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        clearTimeout(timeout);
        if (response.ok) break; // success — exit retry loop
        const errText = await response.text();
        if (attempt === 2) throw new Error('Worker returned ' + response.status + ': ' + errText);
        // Wait 2s before retry
        await new Promise(r => setTimeout(r, 2000));
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (attempt === 2) throw fetchErr;
        bodyEl.innerHTML = '<span style="color:var(--muted)">Retrying AI connection…</span>';
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    bodyEl.innerHTML = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const ev = JSON.parse(data);
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            fullText += ev.delta.text;
            bodyEl.innerHTML = window.mdToHtml ? window.mdToHtml(fullText) : fullText;
          }
        } catch {}
      }
    }
    bodyEl.innerHTML = window.mdToHtml ? window.mdToHtml(fullText) : fullText;
  } catch (err) {
    bodyEl.textContent = 'AI summary unavailable: ' + err.message;
  }
}

// ── Toggle multi-channel mode ─────────────────────────────────
window.mcSetEnabled = function(enabled) {
  MC.enabled = enabled;
  const mapSection = document.getElementById('mc-mapping-section');
  if (mapSection) mapSection.style.display = enabled ? 'block' : 'none';
  // Update run button label
  const runBtn = document.getElementById('run-btn');
  if (runBtn) runBtn.innerHTML = enabled
    ? '&#9889; Run Multi-Channel Analysis'
    : '&#9889; Run Analysis';
};

// ── Show multi-channel suggestion banner after file parse ─────
window.mcShowSuggestion = function(signalColumns) {
  const el = document.getElementById('multiChannelSuggestion');
  if (!el) return;
  if (signalColumns.length <= 1) { el.style.display = 'none'; return; }

  el.style.display = 'flex';
  el.innerHTML = `
    <span>&#128290; <strong>${signalColumns.length} signal columns detected</strong> — enable multi-channel to analyse each axis independently</span>
    <button onclick="mcActivate(${JSON.stringify(signalColumns).replace(/"/g, '&quot;')})"
      style="flex-shrink:0;padding:5px 14px;background:var(--accent);color:var(--bg);border:none;border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;font-weight:700;">
      Enable &#8594;
    </button>
  `;
};

window.mcActivate = function(columns) {
  // Enable the toggle in step 2
  const toggle = document.getElementById('mc-mode-toggle');
  if (toggle) { toggle.checked = true; mcSetEnabled(true); }
  mcRenderMappingUI(columns);
  // Scroll to mapping
  const ms = document.getElementById('mc-mapping-section');
  if (ms) ms.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Called by modified stageFile after file is read ───────────
window.mcOnFileReady = function(raw, parsedResult) {
  MC.rawData = raw;
  const sigCols = mcDetectSignalColumns(parsedResult);
  const toggle = document.getElementById('mc-mode-toggle');
  if (MC.enabled || (toggle && toggle.checked)) {
    mcRenderMappingUI(sigCols);
  }
  mcShowSuggestion(sigCols);
};
