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
const MC_MAX_CHANNELS = 6;

// ── ISO 13373-1 Cross-Axis Confidence Rules ───────────────────
// Keys are fault categories; each rule boosts confidence when
// the same fault appears on multiple axes.
const MC_CROSS_AXIS_RULES = [
  {
    id: 'ca_imbalance',
    label: 'Rotational Imbalance — Cross-Axis Confirmation',
    clause: 'ISO 13373-1:2002 §6.3.2',
    category: 'imbalance',
    // Imbalance dominates X and Y but is low in Z
    // Confirmed when: 2+ orthogonal axes show the fault
    requiredAxes: 2,
    boostPct: 15,
    note: 'Imbalance confirmed on ≥2 orthogonal axes — confidence elevated',
  },
  {
    id: 'ca_misalignment',
    label: 'Misalignment — Axial Confirmation',
    clause: 'ISO 13373-1:2002 §6.3.3',
    category: 'misalignment',
    // Misalignment shows strongly in axial (Z) direction
    requiredAxes: 2,
    boostPct: 20,
    note: 'Misalignment confirmed across radial + axial — confidence elevated',
  },
  {
    id: 'ca_bearing',
    label: 'Bearing Fault — Multi-Axis Presence',
    clause: 'ISO 13373-1:2002 §6.3.5',
    category: 'bearing',
    // Bearing faults appear on all 3 axes near the defective bearing
    requiredAxes: 2,
    boostPct: 18,
    note: 'Bearing fault confirmed on multiple axes — confidence elevated',
  },
  {
    id: 'ca_looseness',
    label: 'Mechanical Looseness — Cross-Axis Signature',
    clause: 'ISO 13373-1:2002 §6.3.6',
    category: 'looseness',
    requiredAxes: 2,
    boostPct: 12,
    note: 'Looseness confirmed on ≥2 axes — confidence elevated',
  },
];

// ── Detect numeric columns that look like signal channels ─────
// Returns array of column names (excludes time/index/sample)
function mcDetectSignalColumns(parsedResult) {
  if (!parsedResult) return [];
  const tsNames = ['time','timestamp','t','date','seconds','ms','index','sample','i','n'];
  const allHeaders = parsedResult.allHeaders || [];
  // Re-parse to get all columns, not just the one parseData picked
  return allHeaders.filter(h =>
    !tsNames.some(ts => h.toLowerCase() === ts || h.toLowerCase().startsWith(ts + '_'))
  );
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
  for (const rule of MC_CROSS_AXIS_RULES) {
    // Group channels that share the same location
    const byLocation = {};
    for (const ch of channelResults) {
      const loc = ch.location || 'Unknown';
      if (!byLocation[loc]) byLocation[loc] = [];
      byLocation[loc].push(ch);
    }
    for (const [loc, channels] of Object.entries(byLocation)) {
      // Find channels where this fault category has meaningful confidence
      const faultThreshold = 25; // minimum pct to count
      const axesWithFault = channels.filter(ch => {
        const top = (ch.faults || []).find(f =>
          !f.locked && f.category === rule.category && f.pct >= faultThreshold
        );
        return !!top;
      });
      if (axesWithFault.length >= rule.requiredAxes) {
        const avgPct = axesWithFault.reduce((s, ch) => {
          const f = (ch.faults || []).find(f => f.category === rule.category);
          return s + (f?.pct || 0);
        }, 0) / axesWithFault.length;
        findings.push({
          rule,
          location: loc,
          axes: axesWithFault.map(ch => ch.axis),
          basePct: avgPct,
          boostedPct: Math.min(98, avgPct + rule.boostPct),
          confirmed: true,
        });
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
  // Check cross-axis boosted faults first
  for (const f of crossAxisFindings) {
    if (f.boostedPct > topPct) {
      topPct = f.boostedPct;
      topFault = { name: f.rule.label, pct: f.boostedPct, crossAxis: true, clause: f.rule.clause, location: f.location, axes: f.axes };
    }
  }
  // Then per-channel top faults
  for (const ch of channelResults) {
    const cf = (ch.faults || []).find(f => !f.locked);
    if (cf && cf.pct > topPct) {
      topPct = cf.pct;
      topFault = { ...cf, location: ch.location, axis: ch.axis, crossAxis: false };
    }
  }

  // Worst RUL
  const minRUL = Math.min(...channelResults.map(ch => ch.rulR?.days || 999));

  // Overall health index (average, weighted toward worst)
  const hiVals = channelResults.map(ch => ch.healthIdx || 100).sort((a, b) => a - b);
  const weightedHI = hiVals.length > 1
    ? (hiVals[0] * 2 + hiVals.slice(1).reduce((s, v) => s + v, 0)) / (hiVals.length + 1)
    : hiVals[0];

  return {
    worstZone,
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
  const cols = signalColumns.slice(0, MC_MAX_CHANNELS);

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
    const sr = window.machineParams?.declaredSampleRate || CONFIG.default_sample_rate_hz;
    const cu = CONFIG.unit_conversion_factors.find(r => r.canonical_flag === 1).to_unit;

    // Convert units
    let vals;
    if (['g', 'm/s2', 'mg'].includes(unit)) {
      const rf = computeFFT(values, sr);
      const hz = detectShaft(rf);
      vals = values.map(v => toCanonicalUnit(v, unit, hz));
    } else {
      vals = values.map(v => toCanonicalUnit(v, unit, null));
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
    const zoneRow  = lookupZone(rms, window.selClassId);
    const classRow = CONFIG.iso_machine_classes.find(c => c.class_id === window.selClassId);
    const fftR = computeFFT(vals, sr);
    fftR._rawSignal = vals;
    if (window.machineParams?.shaftHz > 0) fftR._shaftHz = window.machineParams.shaftHz;
    const dataTypes = detectDataTypes([ch.col]);
    const allFaults = classifyFaults(fftR, cf, kurt, dataTypes, window.machineParams || {});
    const faults = [...allFaults.filter(f => !f.locked), ...allFaults.filter(f => f.locked)];

    // Deviation score (no baseline per-channel — uses signal self-stats)
    const devSc  = (rms - mean) / std;
    const devRow = classifyDeviation(Math.abs(devSc));

    // Trend (DDU — single file, multi-channel rarely has history per-channel)
    const trendRow = CONFIG.trend_state_rules.find(r => r.code === 'DDU');

    // Override + RUL
    const override = applyFaultOverride(zoneRow, calcRUL(zoneRow.zone_label, trendRow.code), faults, kurt, cf, classRow);
    const rulR = override.rulR;
    const finalZoneRow = override.zoneRow;

    const topBearingFault = faults.find(f => !f.locked && f.category === 'bearing');
    const healthIdx = calcHealthIndex(rms, kurt, cf, finalZoneRow.zone_label,
      topBearingFault ? topBearingFault.pct : 0, Math.abs(devSc), classRow);

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

  // Render results
  if (procScreen) procScreen.style.display = 'none';
  document.getElementById('results-screen').style.display = 'block';
  mcRenderResults(MC.results, combined, filename);

  // Stream Claude summary for multi-channel
  mcStreamClaude(MC.results, combined, filename);
}

// ── Render multi-channel results ─────────────────────────────
function mcRenderResults(channelResults, combined, filename) {
  const container = document.getElementById('multiChannelResults');
  if (!container) return;

  // Hide single-channel results layout
  const sc = document.getElementById('single-channel-results');
  if (sc) sc.style.display = 'none';

  const zoneColors = { A: '#22c55e', B: '#f59e0b', C: '#f97316', D: '#ef4444' };
  const hiColor = h => h >= 75 ? '#22c55e' : h >= 50 ? '#f59e0b' : h >= 25 ? '#f97316' : '#ef4444';

  container.innerHTML = `
    <!-- ── Combined Verdict Card ── -->
    <div class="mc-combined-card">
      <div class="mc-combined-header">
        <span class="mc-combined-icon">&#128202;</span>
        <div>
          <div class="mc-combined-title">Multi-Channel Combined Assessment</div>
          <div class="mc-combined-sub">${filename} · ${channelResults.length} channel${channelResults.length !== 1 ? 's' : ''} · ISO 13373-1</div>
        </div>
        <div class="mc-combined-zone" style="background:${zoneColors[combined?.worstZone] || '#555'}20;border-color:${zoneColors[combined?.worstZone] || '#555'};color:${zoneColors[combined?.worstZone] || '#555'}">
          Zone ${combined?.worstZone || '—'}
        </div>
      </div>
      <div class="mc-combined-metrics">
        <div class="mc-metric-box">
          <div class="mc-metric-val" style="color:${hiColor(combined?.healthIdx || 0)}">${combined?.healthIdx ?? '—'}</div>
          <div class="mc-metric-label">Health Index</div>
        </div>
        <div class="mc-metric-box">
          <div class="mc-metric-val">${combined?.minRUL ?? '—'}<span class="mc-metric-unit">d</span></div>
          <div class="mc-metric-label">Min RUL</div>
        </div>
        <div class="mc-metric-box">
          <div class="mc-metric-val">${channelResults.filter(r => !r.error).length}</div>
          <div class="mc-metric-label">Channels OK</div>
        </div>
        <div class="mc-metric-box">
          <div class="mc-metric-val">${combined?.crossAxisFindings?.length ?? 0}</div>
          <div class="mc-metric-label">Cross-Axis Confirmed</div>
        </div>
      </div>
      ${combined?.topFault ? `
      <div class="mc-top-fault">
        <span class="mc-fault-icon">&#9888;</span>
        <div>
          <div class="mc-fault-name">${combined.topFault.name}${combined.topFault.crossAxis ? ' <span class="mc-xaxis-badge">Cross-Axis</span>' : ''}</div>
          <div class="mc-fault-meta">
            ${combined.topFault.location ? combined.topFault.location : ''}${combined.topFault.axes ? ' · Axes: ' + combined.topFault.axes.join(', ') : combined.topFault.axis ? ' · Axis: ' + combined.topFault.axis : ''}
            · ${combined.topFault.pct?.toFixed(0)}% confidence
            ${combined.topFault.clause ? `<span class="mc-iso-ref">${combined.topFault.clause}</span>` : ''}
          </div>
        </div>
        <div class="mc-fault-pct-bar"><div style="width:${combined.topFault.pct}%;background:${faultIndicatorColor ? faultIndicatorColor(combined.topFault.pct) : '#f59e0b'}"></div></div>
      </div>` : ''}
    </div>

    <!-- ── Cross-Axis Findings ── -->
    ${combined?.crossAxisFindings?.length ? `
    <div class="mc-section-header">
      <span>&#128279; Cross-Axis Fault Confirmation</span>
      <span class="mc-section-clause">ISO 13373-1:2002 §6.3</span>
    </div>
    <div class="mc-cross-axis-grid">
      ${combined.crossAxisFindings.map(f => `
        <div class="mc-cross-card">
          <div class="mc-cross-loc">${f.location}</div>
          <div class="mc-cross-axes">${f.axes.join(' + ')} axes</div>
          <div class="mc-cross-name">${f.rule.label}</div>
          <div class="mc-cross-pct">${f.boostedPct.toFixed(0)}% <span class="mc-boost-tag">+${f.rule.boostPct}% boosted</span></div>
          <div class="mc-cross-note">${f.rule.note}</div>
          <div class="mc-iso-ref">${f.rule.clause}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- ── Per-Channel Breakdown ── -->
    <div class="mc-section-header">
      <span>&#128312; Per-Channel Breakdown</span>
      <span class="mc-section-clause">Independent pipeline per axis</span>
    </div>
    <div class="mc-channels-grid">
      ${channelResults.map((ch, i) => ch.error
        ? `<div class="mc-ch-card mc-ch-error">
             <div class="mc-ch-card-header"><span class="mc-ch-loc">${ch.location}</span><span class="mc-ch-axis">${ch.axis}</span></div>
             <div class="mc-ch-col">${ch.col}</div>
             <div style="color:var(--red);font-size:11px;margin-top:6px;">&#10007; ${ch.error}</div>
           </div>`
        : `<div class="mc-ch-card">
             <div class="mc-ch-card-header">
               <span class="mc-ch-loc">${ch.location}</span>
               <span class="mc-ch-axis">${ch.axis}</span>
               <span class="mc-ch-zone" style="color:${zoneColors[ch.zoneRow?.zone_label] || '#888'}">Zone ${ch.zoneRow?.zone_label || '?'}</span>
             </div>
             <div class="mc-ch-col">${ch.col}</div>
             <div class="mc-ch-metrics">
               <div class="mc-ch-met"><div class="mc-ch-met-val">${ch.rms}</div><div class="mc-ch-met-lbl">RMS mm/s</div></div>
               <div class="mc-ch-met"><div class="mc-ch-met-val">${ch.cf}</div><div class="mc-ch-met-lbl">Crest F.</div></div>
               <div class="mc-ch-met"><div class="mc-ch-met-val">${ch.kurt}</div><div class="mc-ch-met-lbl">Kurtosis</div></div>
               <div class="mc-ch-met"><div class="mc-ch-met-val" style="color:${hiColor(ch.healthIdx)}">${ch.healthIdx}</div><div class="mc-ch-met-lbl">Health</div></div>
             </div>
             <div class="mc-ch-faults">
               ${(ch.faults || []).filter(f => !f.locked && f.pct >= (CONFIG.minimum_fault_confidence_pct || 15)).slice(0, 3).map(f => `
                 <div class="mc-ch-fault-row">
                   <span class="mc-ch-fault-name">${f.name}</span>
                   <div class="mc-ch-fault-bar"><div style="width:${f.pct}%;background:${faultIndicatorColor ? faultIndicatorColor(f.pct) : '#f59e0b'}"></div></div>
                   <span class="mc-ch-fault-pct">${f.pct.toFixed(0)}%</span>
                 </div>
               `).join('') || '<div style="font-size:10px;color:var(--muted);margin-top:4px;">No significant faults detected</div>'}
             </div>
             <div class="mc-ch-rul">RUL: <strong>${ch.rulR?.days ?? '—'}d</strong> ±${ch.rulR?.ci ?? '—'}d · ${ch.trendRow?.code || 'DDU'}</div>
           </div>`
      ).join('')}
    </div>

    <!-- ── AI Summary placeholder ── -->
    <div class="mc-ai-section" id="mc-ai-section">
      <div class="mc-ai-header">
        <span class="mc-ai-icon">&#129504;</span>
        <span class="mc-ai-title">AI Multi-Channel Analysis</span>
        <span class="mc-ai-badge">Claude AI · Streaming</span>
      </div>
      <div class="mc-ai-body" id="mc-ai-body">
        <span style="color:var(--muted)">Generating multi-channel diagnostic summary…</span>
      </div>
    </div>
  `;
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

  const prompt = `You are an ISO-certified vibration analyst reviewing a multi-channel machine health report.

File: ${filename}
Channels analysed: ${channelResults.filter(r=>!r.error).length}
Combined worst zone: ${combined?.worstZone}
Combined health index: ${combined?.healthIdx}
Min RUL across channels: ${combined?.minRUL} days

Per-channel summary:
${chSummary}

Cross-axis confirmed faults (ISO 13373-1):
${crossSummary || '  None confirmed.'}

Write a concise multi-channel diagnostic summary (3-4 paragraphs). Cover:
1. Overall machine condition and worst-case channel
2. Cross-axis fault interpretation and confidence
3. Recommended inspection priority and timeline
4. Any channel-specific concerns

Use precise technical language appropriate for a maintenance engineer. Reference ISO standards where applicable. Do not use markdown headers.`;

  try {
    bodyEl.textContent = '';
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, stream: true }),
    });
    if (!response.ok) throw new Error('Worker returned ' + response.status);
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
          const t = ev?.delta?.text || ev?.choices?.[0]?.delta?.content || '';
          if (t) bodyEl.textContent += t;
        } catch {}
      }
    }
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
