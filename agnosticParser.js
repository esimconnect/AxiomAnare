/**
 * AxiomAnare — Agnostic Vibration Ingestion Engine v2.0
 * ======================================================
 * Zero assumptions. Reads any file from any vibration
 * collector and delivers normalised mm/s signals + metadata.
 *
 * Architecture: 5-layer pipeline
 *   1. Container detection  → route to correct parser
 *   2. Header/metadata scan → extract KV pairs, skip comments
 *   3. Column classification→ time / signal / scalar / meta
 *   4. Unit inference       → header → metadata → range → profile
 *   5. Fs resolution        → header → Δt column → wizard → profile
 *
 * Output: ParseResult — vendor-agnostic, always in mm/s
 */

'use strict';

// ─────────────────────────────────────────────────────────────────
// VENDOR PROFILES
// The single source of truth for known-collector behaviour.
// Applied only when auto-detection confidence < 75% OR
// when user explicitly selects a vendor from the hint dropdown.
// ─────────────────────────────────────────────────────────────────

const VENDOR_PROFILES = {

  // ── Route / Portable Collectors ──────────────────────────────
  skf_microlog: {
    label: 'SKF Microlog',
    category: 'Route / Portable',
    unit: 'mmps',
    fsOptions: [3200, 6400, 12800, 25600],
    fsDefault: 6400,
    exportNotes: 'Exports mm/s velocity. Fs comes from route config. Multi-point routes produce multi-column files — each column is a measurement point.',
    quirks: ['multi_column_points', 'metadata_header'],
  },
  emerson_csi: {
    label: 'Emerson CSI / AMS 2140',
    category: 'Route / Portable',
    unit: 'g',
    fsOptions: [6400, 12800, 25600, 51200],
    fsDefault: 12800,
    exportNotes: 'Exports g acceleration. Fs from route config. Excel export may have merged header rows — parser handles this via SheetJS.',
    quirks: ['acceleration_g', 'excel_merged_headers'],
  },
  fluke_810: {
    label: 'Fluke 810',
    category: 'Route / Portable',
    unit: 'inps',
    fsOptions: [25600],
    fsDefault: 25600,
    exportNotes: 'Always exports in/s. Fixed 25.6 kHz Fs. Single channel per file. Parser converts to mm/s automatically (× 25.4).',
    quirks: ['single_channel', 'fixed_fs'],
  },
  fluke_3550: {
    label: 'Fluke 3550 FC',
    category: 'Route / Portable',
    unit: 'mmps',
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Exports overall RMS scalars — not raw waveform. Columns are measurement points, rows are readings over time. Use scalar analysis mode.',
    quirks: ['scalar_only', 'no_waveform'],
  },
  pruftechnik: {
    label: 'Prüftechnik Vibscanner',
    category: 'Route / Portable',
    unit: 'mmps',
    fsOptions: [3200, 6400, 12800],
    fsDefault: 6400,
    exportNotes: 'Exports mm/s. Typical header includes asset name, route, measurement date. Multi-axis files labelled H/V/A.',
    quirks: ['metadata_header', 'hva_axis_labels'],
  },
  adash: {
    label: 'Adash A4400 / A4900',
    category: 'Route / Portable',
    unit: 'mmps',
    fsOptions: [6400, 12800, 25600],
    fsDefault: 12800,
    exportNotes: 'Exports mm/s. DDS or CSV format. CSV headers contain measurement point info.',
    quirks: ['metadata_header'],
  },
  commtest: {
    label: 'Commtest vb Series',
    category: 'Route / Portable',
    unit: 'mmps',
    fsOptions: [3200, 6400, 12800],
    fsDefault: 6400,
    exportNotes: 'Exports mm/s. Proprietary VBD format can be exported to CSV. Headers contain site/machine/point hierarchy.',
    quirks: ['metadata_header'],
  },
  erbessd: {
    label: 'Erbessd DigivibeMX',
    category: 'Route / Portable',
    unit: 'g',
    fsOptions: [3200, 6400, 12800, 25600],
    fsDefault: 6400,
    exportNotes: 'Triaxial accelerometer in g. CSV export has X, Y, Z columns. Fs in header.',
    quirks: ['triaxial_xyz', 'acceleration_g', 'metadata_header'],
  },

  // ── Online / Continuous Monitoring ───────────────────────────
  skf_imx: {
    label: 'SKF Multilog IMx',
    category: 'Online / Continuous',
    unit: 'mmps',
    fsOptions: [12800, 25600, 51200],
    fsDefault: 25600,
    exportNotes: 'Continuous monitoring system. CSV exports include timestamp column and multiple channel columns. Fs typically 25.6 kHz.',
    quirks: ['timestamp_column', 'multi_channel', 'metadata_header'],
  },
  emerson_mhm: {
    label: 'Emerson MHM / AMS 6500',
    category: 'Online / Continuous',
    unit: 'g',
    fsOptions: [12800, 25600, 51200],
    fsDefault: 25600,
    exportNotes: 'Online system. Exports g waveforms. Excel export from AMS Machinery Manager may have multi-row metadata block.',
    quirks: ['acceleration_g', 'excel_merged_headers', 'multi_channel'],
  },
  abb_ability: {
    label: 'ABB Ability / Dodge Optify',
    category: 'Online / Continuous',
    unit: 'mmps',
    fsOptions: [6400, 12800],
    fsDefault: 6400,
    exportNotes: 'May export pre-computed ISO zone results AND raw waveform. If file contains only scalars (RMS, zone), waveform is unavailable.',
    quirks: ['may_be_scalar_only', 'json_possible'],
  },
  ni_daq: {
    label: 'National Instruments DAQ',
    category: 'Online / Continuous',
    unit: 'g',
    fsOptions: [1000, 2000, 5000, 10000, 25600, 51200],
    fsDefault: 10000,
    exportNotes: 'LabVIEW / NI-DAQmx CSV: row 1 = channel names, row 2 = units, row 3+ = data. Fs is usually in a header comment or must be entered manually.',
    quirks: ['units_in_row2', 'acceleration_g', 'labview_header'],
  },
  hbk_pulse: {
    label: 'Brüel & Kjær PULSE / HBK',
    category: 'Online / Continuous',
    unit: 'g',
    fsOptions: [16384, 32768, 65536],
    fsDefault: 16384,
    exportNotes: 'CRITICAL: Check if columns are time samples OR frequency bins. If values in first column increase uniformly from 0 → Fmax, this is an FFT spectrum (frequency domain), not a time waveform. Spectral data cannot be re-analysed here.',
    quirks: ['may_be_fft_spectrum', 'acceleration_g'],
  },
  spm_intellinova: {
    label: 'SPM Intellinova',
    category: 'Online / Continuous',
    unit: 'mmps',
    fsOptions: [6400, 12800, 25600],
    fsDefault: 12800,
    exportNotes: 'Exports mm/s. SPM HD shock pulse data is separate from velocity waveform. Velocity CSV is compatible.',
    quirks: ['metadata_header'],
  },
  istec: {
    label: 'ISTec / Schenck',
    category: 'Online / Continuous',
    unit: 'mmps',
    fsOptions: [6400, 12800],
    fsDefault: 6400,
    exportNotes: 'Exports mm/s. Standard CSV with metadata header block.',
    quirks: ['metadata_header'],
  },

  // ── IoT / Wireless Sensors ────────────────────────────────────
  epson: {
    label: 'Epson M-A352AD / M-A352',
    category: 'IoT / Wireless',
    unit: 'g',
    fsOptions: [1000, 2000, 3000, 4000, 8000],
    fsDefault: 3000,
    exportNotes: 'Triaxial MEMS accelerometer. 3-column CSV: X, Y, Z in g. No metadata header — clean numeric data only. Fs set in device firmware (default 3 kHz).',
    quirks: ['triaxial_xyz', 'acceleration_g', 'no_header', 'clean_csv'],
  },
  ifm: {
    label: 'ifm VSE / VES / VSP',
    category: 'IoT / Wireless',
    unit: 'mmps',
    fsOptions: [6400, 12800],
    fsDefault: 6400,
    exportNotes: 'Exports mm/s RMS or waveform depending on model. VSP exports waveform; VSE typically exports scalars only.',
    quirks: ['may_be_scalar_only'],
  },
  imc: {
    label: 'IMC CRONOS / SPARTAN',
    category: 'IoT / Wireless',
    unit: 'g',
    fsOptions: [10000, 25600, 51200, 102400],
    fsDefault: 25600,
    exportNotes: 'High-speed DAQ. CSV or FAMOS format. High Fs typical. imc FAMOS files should be exported to CSV first.',
    quirks: ['acceleration_g', 'high_fs'],
  },
  petasense: {
    label: 'Petasense Mote / Atlas',
    category: 'IoT / Wireless',
    unit: 'g',
    fsOptions: [3200, 6400, 12800],
    fsDefault: 6400,
    exportNotes: 'Cloud-connected IIoT sensor. CSV export from Petasense platform includes timestamp, X, Y, Z columns in g.',
    quirks: ['triaxial_xyz', 'acceleration_g', 'timestamp_column'],
  },
  samsara: {
    label: 'Samsara VT400',
    category: 'IoT / Wireless',
    unit: 'g',
    fsOptions: [3200],
    fsDefault: 3200,
    exportNotes: 'Triaxial sensor, exports g. Fixed 3.2 kHz Fs. JSON or CSV format from Samsara cloud.',
    quirks: ['triaxial_xyz', 'acceleration_g', 'json_possible'],
  },

  // ── Generic / Research ────────────────────────────────────────
  matlab_csv: {
    label: 'MATLAB export (writematrix / csvwrite)',
    category: 'Generic / Research',
    unit: null,
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'No standard header. Fs must be entered manually. Units depend on sensor — check your MATLAB script. writematrix() produces clean numeric CSV.',
    quirks: ['no_header', 'clean_csv', 'unit_unknown'],
  },
  labview: {
    label: 'LabVIEW / NI Write to Spreadsheet',
    category: 'Generic / Research',
    unit: null,
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Tab-delimited by default. May have a single header row. Units in column names if you added them. Fs must be entered manually.',
    quirks: ['tab_delimited', 'unit_unknown'],
  },
  python_csv: {
    label: 'Python / pandas (to_csv)',
    category: 'Generic / Research',
    unit: null,
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Clean CSV with column headers. Row index often exported as first column — parser auto-detects and skips it. Fs and units from your acquisition script.',
    quirks: ['pandas_index_col', 'unit_unknown'],
  },
  generic_accel_g: {
    label: 'Generic accelerometer output (g)',
    category: 'Generic / Research',
    unit: 'g',
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Parser will integrate acceleration → velocity using trapezoidal method + 2 Hz high-pass filter. Fs is required for accurate integration — enter below.',
    quirks: ['acceleration_g', 'unit_unknown'],
  },
  generic_vel_mmps: {
    label: 'Generic velocimeter (mm/s)',
    category: 'Generic / Research',
    unit: 'mmps',
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Already in ISO 10816 native units. No conversion needed. Fs still required for FFT fault classification.',
    quirks: ['no_conversion'],
  },
  other: {
    label: 'Other / not listed',
    category: 'Generic / Research',
    unit: null,
    fsOptions: [],
    fsDefault: null,
    exportNotes: 'Parser will use full heuristic detection. If results look wrong, override unit and Fs manually using the fields above.',
    quirks: [],
  },
};

// ─────────────────────────────────────────────────────────────────
// DETECTION PATTERNS
// ─────────────────────────────────────────────────────────────────

const UNIT_PATTERNS = {
  mmps:  /\b(mm\s*\/\s*s|mm\/sec|millimetre[s]?\s*\/\s*s|velocity|vel)\b/i,
  inps:  /\b(in\s*\/\s*s|in\/sec|inch(es)?\s*\/\s*s|ips)\b/i,
  cmps:  /\b(cm\s*\/\s*s|cm\/sec)\b/i,
  g:     /\b(g[s]?|grav(ity|ities)?|accel(eration)?)\b(?!\s*\/\s*s)/i,
  mps2:  /\b(m\s*\/\s*s[²2]|m\/s\^2|ms-2)\b/i,
  mum:   /\b(µm|um|micron[s]?|micrometre[s]?|displacement)\b/i,
  mm:    /\b(mm|millimetre[s]?)\b(?!\s*\/\s*s)/i,
  db:    /\b(d[bB]|decibel[s]?)\b/i,
};

const METADATA_KEYS = {
  fs:    /\b(fs|f_?s|sampling.?rate|sample.?freq|s.?rate|sps|samplerate)\b/i,
  rpm:   /\b(rpm|speed|shaft.?speed|rot(ation)?.?speed|rev.?per.?min|n\b)\b/i,
  unit:  /\b(unit[s]?|measure(ment)?|quantity|eng.?unit)\b/i,
  date:  /\b(date|time(stamp)?|measured.?on|recorded|collected)\b/i,
  asset: /\b(asset|machine|equipment|tag|point.?id|location|route|id|name)\b/i,
  fmax:  /\b(f.?max|max.?freq|bandwidth|bw)\b/i,
};

const COMMENT_PREFIXES = ['#', '//', ';', '!', '%'];
const TIME_COL = /\b(time|t\b|timestamp|sec(ond)?s?|ms|elapsed|index|sample|n\b|#)\b/i;
const SCALAR_COL = /\b(rms|peak|overall|average|mean|max|min|std|kurtosis|crest|cf|amplitude|level|severity|overall)\b/i;
const PANDAS_INDEX = /^(unnamed.*0|index|\s*)$/i;

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

async function parseVibrationFile(file, vendorHint = null) {
  const ext = file.name.split('.').pop().toLowerCase();
  let result;

  if (['csv', 'tsv', 'txt'].includes(ext)) {
    const text = await readAsText(file);
    result = parseText(text, ext, file.name);
  } else if (['xlsx', 'xls'].includes(ext)) {
    const buf = await readAsBuffer(file);
    result = parseExcel(buf, file.name);
  } else if (ext === 'json') {
    const text = await readAsText(file);
    result = parseJSON(text, file.name);
  } else if (ext === 'mat') {
    throw new ParseError(
      'MATLAB .mat files must be exported to CSV first.\n' +
      'In MATLAB: writematrix(yourData, "data.csv")',
      'MAT_UNSUPPORTED'
    );
  } else {
    // Try as text — catches .dat, .asc, .prn, .out etc.
    const text = await readAsText(file);
    result = parseText(text, 'csv', file.name);
  }

  // Apply vendor profile if provided (hint overrides or supplements heuristics)
  if (vendorHint) {
    result = applyVendorProfile(result, vendorHint);
  }

  // Compute final parse confidence
  result.parseConfidence = scoreConfidence(result);
  result.warnings = buildWarnings(result);

  return result;
}

/**
 * Re-apply a vendor profile after initial parse.
 * Called when user selects from the hint dropdown.
 */
function rerunWithVendorHint(existingResult, vendorKey) {
  const profile = VENDOR_PROFILES[vendorKey];
  if (!profile) return existingResult;

  const updated = applyVendorProfile(existingResult, vendorKey);
  updated.parseConfidence = scoreConfidence(updated);
  updated.warnings = buildWarnings(updated);
  return updated;
}

// ─────────────────────────────────────────────────────────────────
// TEXT PARSER  (CSV / TSV / TXT)
// ─────────────────────────────────────────────────────────────────

function parseText(text, ext, filename) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const { headerLines, dataLines, metaKV } = splitHeaderFromData(lines);
  const delim = detectDelimiter(dataLines.slice(0, 15).join('\n'), ext);
  const { colNames, dataStart } = extractColNames(headerLines, dataLines, delim);
  const rows = parseRows(dataLines.slice(dataStart), delim, colNames.length);

  if (rows.length < 5) throw new ParseError(
    `Only ${rows.length} data rows found. Need at least 5 for any meaningful analysis.`,
    'INSUFFICIENT_DATA'
  );

  const cols = classifyCols(colNames, rows, metaKV);
  const meta = extractMeta(metaKV, cols, rows);
  return buildResult(cols, rows, meta, filename, 'text');
}

// ─── Split header block from data block ──────────────────────────

function splitHeaderFromData(lines) {
  const headerLines = [], dataLines = [];
  const metaKV = {};
  let inData = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const isComment = COMMENT_PREFIXES.some(p => line.startsWith(p));
    if (isComment) {
      parseKVLine(line.replace(/^[#\/;!%]+\s*/, ''), metaKV);
      headerLines.push(line);
      continue;
    }

    // Key: Value or Key = Value pattern (not numeric on left)
    const kv = line.match(/^([^,;\t:=\d][^,;\t:=]{0,40})[:\s=]+([^\n]{1,80})$/);
    if (kv && !hasNumbers(line.split(/[,;\t]/)[0])) {
      parseKVLine(line, metaKV);
      headerLines.push(line);
      continue;
    }

    if (rowHasNumbers(line)) inData = true;
    (inData ? dataLines : headerLines).push(line);
  }
  return { headerLines, dataLines, metaKV };
}

function parseKVLine(line, kv) {
  const m = line.match(/^([^:=]+)[:\s=]+(.+)$/);
  if (m) kv[m[1].trim().toLowerCase()] = m[2].trim();
}

function rowHasNumbers(line) {
  return line.split(/[,\t;|]+/).some(p => !isNaN(parseFloat(p.trim())) && p.trim() !== '');
}

function hasNumbers(s) {
  return /\d/.test(s);
}

// ─── Delimiter detection ──────────────────────────────────────────

function detectDelimiter(sample, ext) {
  if (ext === 'tsv') return '\t';
  const cands = [',', '\t', ';', '|'];
  return cands.reduce((best, d) => {
    const n = (sample.match(new RegExp('\\' + d === '|' ? '\\|' : d, 'g')) || []).length;
    return n > best.count ? { d, count: n } : best;
  }, { d: ',', count: 0 }).d;
}

// ─── Column name extraction ───────────────────────────────────────

function extractColNames(headerLines, dataLines, delim) {
  const dataWidth = splitRow(dataLines[0] || '', delim).length;
  const firstParts = splitRow(dataLines[0] || '', delim);
  const firstAllText = firstParts.every(p => isNaN(parseFloat(p.trim())) || p.trim() === '');

  if (firstAllText && dataLines.length > 1) {
    return {
      colNames: firstParts.map(p => p.trim().replace(/["']/g, '') || `col_${firstParts.indexOf(p) + 1}`),
      dataStart: 1,
    };
  }

  // Search backwards through header block for a row matching data width
  for (let i = headerLines.length - 1; i >= 0; i--) {
    const parts = splitRow(headerLines[i], delim);
    if (parts.length >= dataWidth && parts.every(p => isNaN(parseFloat(p.trim())) || p.trim() === '')) {
      const names = parts.map((p, j) => p.trim().replace(/["']/g, '') || `col_${j + 1}`);
      return { colNames: normaliseColNames(names, dataWidth), dataStart: 0 };
    }
  }

  // No header found — synthesise names
  return {
    colNames: Array.from({ length: dataWidth }, (_, i) => `col_${i + 1}`),
    dataStart: 0,
  };
}

function normaliseColNames(names, width) {
  while (names.length < width) names.push(`col_${names.length + 1}`);
  return names.slice(0, width);
}

// ─── Data row parsing ─────────────────────────────────────────────

function parseRows(lines, delim, width) {
  const rows = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || COMMENT_PREFIXES.some(p => line.startsWith(p))) continue;
    const parts = splitRow(line, delim);
    const row = parts.slice(0, width).map(p => {
      const v = parseFloat(p.trim());
      return isNaN(v) ? null : v;
    });
    if (row.some(v => v !== null)) rows.push(row);
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────
// COLUMN CLASSIFICATION
// ─────────────────────────────────────────────────────────────────

function classifyCols(colNames, rows, metaKV) {
  return colNames.map((name, idx) => {
    const vals = rows.map(r => r[idx]).filter(v => v !== null && isFinite(v));
    if (vals.length < 3) return { index: idx, name, type: 'unknown', unit: null, values: [] };

    const stats = colStats(vals);
    const unitHint = inferUnitFromName(name);
    const type = classifyType(name, stats, idx, colNames);

    return { index: idx, name, type, unit: unitHint, unitHint, values: vals, stats };
  });
}

function classifyType(name, stats, idx, allNames) {
  if (PANDAS_INDEX.test(name) && idx === 0) return 'index';
  if (TIME_COL.test(name)) return 'time';
  if (stats.isMonotonic && stats.range > 0 && stats.std / (stats.mean || 1) < 0.5) return 'time';
  if (SCALAR_COL.test(name)) return 'scalar';
  if (stats.uniqueCount < 8 && stats.uniqueCount < stats.n * 0.03) return 'meta';
  if (stats.n > 20) return 'signal';
  return 'unknown';
}

function inferUnitFromName(name) {
  for (const [unit, pat] of Object.entries(UNIT_PATTERNS)) {
    if (pat.test(name)) return unit;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// METADATA EXTRACTION  — Fs, RPM, units, vendor
// ─────────────────────────────────────────────────────────────────

function extractMeta(metaKV, cols, rows) {
  const m = {
    fs: null, fsSource: null,
    rpm: null, rpmSource: null,
    unit: null,
    date: null, assetId: null,
    vendor: null, vendorKey: null,
  };

  // Fs — priority 1: explicit KV in header
  for (const [k, v] of Object.entries(metaKV)) {
    if (METADATA_KEYS.fs.test(k)) {
      const hz = parseFloat(v.replace(/[^\d.]/g, ''));
      if (hz > 10 && hz < 2e6) { m.fs = hz; m.fsSource = 'file_header'; break; }
    }
  }

  // Fs — priority 2: time column Δt
  if (!m.fs) {
    const tCol = cols.find(c => c.type === 'time');
    if (tCol && tCol.values.length > 20) {
      const deltas = tCol.values.slice(1, 51).map((v, i) => v - tCol.values[i]).filter(d => d > 0);
      if (deltas.length > 5) {
        const med = deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)];
        for (const mult of [1, 1000, 0.001]) {
          const hz = mult / med;
          if (hz > 10 && hz < 2e6) { m.fs = Math.round(hz); m.fsSource = 'time_col_delta'; break; }
        }
      }
    }
  }

  // RPM
  for (const [k, v] of Object.entries(metaKV)) {
    if (METADATA_KEYS.rpm.test(k)) {
      const rpm = parseFloat(v.replace(/[^\d.]/g, ''));
      if (rpm > 30 && rpm < 200000) { m.rpm = rpm; m.rpmSource = 'file_header'; break; }
    }
  }

  // Units — blanket declaration
  for (const [k, v] of Object.entries(metaKV)) {
    if (METADATA_KEYS.unit.test(k)) { m.unit = inferUnitFromStr(v); break; }
  }

  // Date
  for (const [k, v] of Object.entries(metaKV)) {
    if (METADATA_KEYS.date.test(k)) { m.date = v; break; }
  }

  // Asset ID
  for (const [k, v] of Object.entries(metaKV)) {
    if (METADATA_KEYS.asset.test(k)) { m.assetId = v; break; }
  }

  // Vendor fingerprint
  const kvStr = Object.entries(metaKV).map(([k, v]) => `${k}=${v}`).join(' ');
  const colStr = cols.map(c => c.name).join(' ');
  m.vendor = fingerprint(kvStr + ' ' + colStr);
  m.vendorKey = m.vendor ? vendorNameToKey(m.vendor) : null;

  // Per-column unit resolution
  const sigCols = cols.filter(c => c.type === 'signal');
  for (const col of sigCols) {
    if (!col.unit && m.unit) col.unit = m.unit;
    if (!col.unit) col.unit = inferUnitFromRange(col.stats);
  }

  return m;
}

function inferUnitFromStr(str) {
  for (const [u, p] of Object.entries(UNIT_PATTERNS)) {
    if (p.test(str)) return u;
  }
  return null;
}

function inferUnitFromRange(stats) {
  if (!stats) return 'mmps';
  const absMax = Math.max(Math.abs(stats.min), Math.abs(stats.max));
  // Acceleration in g: typically small values, centred near zero
  if (absMax < 100 && stats.std < 20 && Math.abs(stats.mean) < 5) return 'g';
  // Velocity mm/s: moderate values
  if (absMax <= 200) return 'mmps';
  // Displacement µm: large values
  return 'mum';
}

function fingerprint(str) {
  const s = str.toLowerCase();
  if (/skf|@ptitude|microlog|aptitude/.test(s)) return 'SKF @ptitude';
  if (/emerson|ams\b|mhm|csi/.test(s)) return 'Emerson AMS';
  if (/bruel|kjaer|bksv|pulse|hbk/.test(s)) return 'Brüel & Kjær / HBK';
  if (/fluke|vibcheck/.test(s)) return 'Fluke';
  if (/abb|ability|dodge|optify/.test(s)) return 'ABB Ability';
  if (/national instruments|ni_|labview/.test(s)) return 'National Instruments';
  if (/epson|seiko/.test(s)) return 'Epson';
  if (/prüftechnik|pruftechnik|vibscanner/.test(s)) return 'Prüftechnik';
  if (/adash/.test(s)) return 'Adash';
  if (/commtest|vbseries/.test(s)) return 'Commtest';
  if (/spm|intellinova/.test(s)) return 'SPM';
  if (/petasense/.test(s)) return 'Petasense';
  if (/samsara/.test(s)) return 'Samsara';
  if (/ifm/.test(s)) return 'ifm';
  if (/imc|cronos|spartan/.test(s)) return 'IMC';
  return null;
}

function vendorNameToKey(name) {
  const map = {
    'SKF @ptitude': 'skf_microlog', 'Emerson AMS': 'emerson_csi',
    'Brüel & Kjær / HBK': 'hbk_pulse', 'Fluke': 'fluke_810',
    'ABB Ability': 'abb_ability', 'National Instruments': 'ni_daq',
    'Epson': 'epson', 'Prüftechnik': 'pruftechnik',
    'Adash': 'adash', 'Commtest': 'commtest',
    'SPM': 'spm_intellinova', 'Petasense': 'petasense',
    'Samsara': 'samsara', 'ifm': 'ifm', 'IMC': 'imc',
  };
  return map[name] || null;
}

// ─────────────────────────────────────────────────────────────────
// VENDOR PROFILE APPLICATION
// ─────────────────────────────────────────────────────────────────

function applyVendorProfile(result, vendorKey) {
  const profile = VENDOR_PROFILES[vendorKey];
  if (!profile) return result;

  result.vendorKey = vendorKey;
  result.vendorLabel = profile.label;
  result.vendorProfileApplied = true;
  result.vendorNotes = profile.exportNotes;

  // Apply Fs default if still unknown
  if (!result.fs && profile.fsDefault) {
    result.fs = profile.fsDefault;
    result.fsSource = 'vendor_profile_default';
  }

  // Apply unit to all signal channels that don't have one
  if (profile.unit) {
    for (const ch of result.channels) {
      if (!ch.rawUnit || ch.rawUnit === 'unknown') {
        ch.rawUnit = profile.unit;
        ch.unitLabel = unitLabel(profile.unit);
      }
    }
  }

  // Handle special quirks
  if (profile.quirks.includes('may_be_fft_spectrum')) {
    result.warnings.push({
      code: 'POSSIBLE_FFT_SPECTRUM',
      severity: 'critical',
      message: 'Brüel & Kjær files may contain FFT spectra (frequency domain) rather than time waveforms. If the first column increases uniformly from 0 to ~Fmax Hz, this is a spectrum — not suitable for re-analysis here.',
    });
  }
  if (profile.quirks.includes('scalar_only')) {
    result.warnings.push({
      code: 'SCALAR_ONLY_VENDOR',
      severity: 'warning',
      message: `${profile.label} typically exports overall RMS scalars, not raw waveforms. FFT and fault frequency analysis will not be available.`,
    });
  }
  if (profile.quirks.includes('pandas_index_col')) {
    // Strip the index column if present
    result.channels = result.channels.filter(ch => !PANDAS_INDEX.test(ch.name));
  }

  // Re-run conversion with updated units + Fs
  if (result.fs) {
    result.channels = result.channels.map(ch => {
      const conv = convertToMmps(ch._rawValues || ch.converted, ch.rawUnit, result.fs);
      return { ...ch, converted: conv.signal, conversionMethod: conv.method, wasConverted: conv.method !== 'identity' };
    });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// BUILD FINAL PARSE RESULT
// ─────────────────────────────────────────────────────────────────

function buildResult(cols, rows, meta, filename, format) {
  const sigCols = cols.filter(c => c.type === 'signal');
  const scalarCols = cols.filter(c => c.type === 'scalar');

  if (sigCols.length === 0) {
    // Fall back: treat all numeric non-time columns as signal
    cols.filter(c => c.type === 'unknown' && c.values.length > 5)
        .forEach(c => { c.type = 'signal'; sigCols.push(c); });
  }

  const channels = sigCols.map((col, i) => {
    const rawUnit = col.unit || 'unknown';
    const conv = convertToMmps(col.values, rawUnit, meta.fs);
    return {
      index: col.index,
      name: col.name,
      rawUnit,
      unitLabel: unitLabel(rawUnit),
      _rawValues: col.values,
      converted: conv.signal,
      conversionMethod: conv.method,
      wasConverted: conv.method !== 'identity',
      conversionApprox: conv.approx || false,
      suggestedLocation: suggestLocation(col.name, i),
      suggestedAxis: suggestAxis(col.name, i),
      location: null,
      axis: null,
    };
  });

  return {
    filename,
    format,
    vendor: meta.vendor || null,
    vendorKey: meta.vendorKey || null,
    vendorLabel: meta.vendor || 'Unknown format',
    vendorProfileApplied: false,
    vendorNotes: null,
    channels,
    channelCount: channels.length,
    extractedScalars: scalarCols.map(c => ({ name: c.name, values: c.values })),
    fs: meta.fs,
    fsSource: meta.fsSource,
    fsMissing: !meta.fs,
    rpm: meta.rpm,
    date: meta.date,
    assetId: meta.assetId,
    sampleCount: rows.length,
    durationSeconds: meta.fs ? +(rows.length / meta.fs).toFixed(2) : null,
    parseConfidence: 0,
    warnings: [],
    _cols: cols,
    _meta: meta,
  };
}

// ─────────────────────────────────────────────────────────────────
// UNIT CONVERSION ENGINE
// ─────────────────────────────────────────────────────────────────

function convertToMmps(signal, unit, fs) {
  if (!signal || signal.length === 0) return { signal: [], method: 'empty', approx: false };

  switch (unit) {
    case 'mmps':
      return { signal, method: 'identity', approx: false };

    case 'inps':
      return { signal: signal.map(v => v * 25.4), method: 'scale_inps×25.4', approx: false };

    case 'cmps':
      return { signal: signal.map(v => v * 10), method: 'scale_cmps×10', approx: false };

    case 'g':
      if (fs) return integrateGToMmps(signal, fs);
      // No Fs: approximate scaling — flag as approx
      return { signal: signal.map(v => v * 9810 / (2 * Math.PI * 50)), method: 'scale_g_approx_no_fs', approx: true };

    case 'mps2':
      if (fs) return integrateGToMmps(signal.map(v => v / 9.81), fs);
      return { signal: signal.map(v => v * 1000 / (2 * Math.PI * 50)), method: 'scale_mps2_approx_no_fs', approx: true };

    case 'mum':
      // Displacement µm → velocity: v ≈ ω·d, rough for broadband
      return { signal: signal.map(v => v * 0.001), method: 'scale_µm_passthrough', approx: true };

    case 'db':
      // dB re 1 µm/s → linear mm/s
      return { signal: signal.map(v => Math.pow(10, v / 20) * 1e-6), method: 'antilog_db_re_1µm/s', approx: false };

    default:
      return { signal, method: 'passthrough_unknown', approx: true };
  }
}

function integrateGToMmps(gSignal, fs) {
  const mmps2 = gSignal.map(v => v * 9810); // g → mm/s²
  const dt = 1 / fs;

  // Trapezoidal integration
  const vel = new Float64Array(mmps2.length);
  for (let i = 1; i < mmps2.length; i++) {
    vel[i] = vel[i - 1] + 0.5 * (mmps2[i] + mmps2[i - 1]) * dt;
  }

  // High-pass IIR filter — removes DC drift from integration
  // 1st-order Butterworth, fc = 2 Hz
  const fc = 2;
  const rc = 1 / (2 * Math.PI * fc);
  const alpha = rc / (rc + dt);
  const hp = new Float64Array(vel.length);
  for (let i = 1; i < vel.length; i++) {
    hp[i] = alpha * (hp[i - 1] + vel[i] - vel[i - 1]);
  }

  return { signal: Array.from(hp), method: 'integrate_g→mm/s_HP2Hz', approx: false };
}

function unitLabel(unit) {
  return { mmps: 'mm/s', inps: 'in/s', cmps: 'cm/s', g: 'g', mps2: 'm/s²', mum: 'µm', db: 'dB', unknown: '?' }[unit] || (unit || '?');
}

// ─────────────────────────────────────────────────────────────────
// LOCATION / AXIS SUGGESTIONS
// ─────────────────────────────────────────────────────────────────

function suggestLocation(name, i) {
  const n = name.toLowerCase();
  if (/drive.?end|de\b|d\.e/.test(n)) return 'Drive End';
  if (/fan.?end|fe\b|nde\b|non.?drive|f\.e/.test(n)) return 'Fan End';
  if (/gear.?in|gb.?in|input/.test(n)) return 'Gearbox Input';
  if (/gear.?out|gb.?out|output/.test(n)) return 'Gearbox Output';
  const bm = n.match(/bearing[_\s]?(\d)/);
  if (bm) return `Bearing ${bm[1]}`;
  // Cycle DE → DE → DE → FE → FE → FE for 6-channel triaxial pairs
  return ['Drive End','Drive End','Drive End','Fan End','Fan End','Fan End'][i] || 'Drive End';
}

function suggestAxis(name, i) {
  const n = name.toLowerCase();
  if (/\bx\b|horiz|\bh\b/.test(n)) return 'X';
  if (/\by\b|vert|\bv\b/.test(n)) return 'Y';
  if (/\bz\b|axial|\ba\b/.test(n)) return 'Z';
  return ['X', 'Y', 'Z'][i % 3];
}

// ─────────────────────────────────────────────────────────────────
// CONFIDENCE SCORE & WARNINGS
// ─────────────────────────────────────────────────────────────────

function scoreConfidence(result) {
  let score = 100;
  if (!result.fs)                                score -= 25;
  if (result.channelCount === 0)                 score -= 40;
  if (result.channels.some(c => !c.rawUnit || c.rawUnit === 'unknown')) score -= 15;
  if (result.channels.some(c => c.conversionApprox)) score -= 10;
  if (!result.vendor)                            score -= 5;
  if (!result.vendorProfileApplied && !result.vendor) score -= 5;
  return Math.max(0, score);
}

function buildWarnings(result) {
  const w = [];
  if (!result.fs) w.push({ code: 'FS_MISSING', severity: 'critical', message: 'Sampling rate not found. Enter it in the wizard or select your data collector below.' });
  if (result.channelCount === 0) w.push({ code: 'NO_SIGNALS', severity: 'critical', message: 'No signal columns detected. The file may be a scalar summary rather than a raw waveform.' });
  result.channels?.forEach(ch => {
    if (!ch.rawUnit || ch.rawUnit === 'unknown') w.push({ code: 'UNIT_UNKNOWN', severity: 'warning', message: `Column "${ch.name}": unit unknown. Treated as mm/s — verify before analysis.`, channel: ch.name });
    if (ch.conversionApprox) w.push({ code: 'CONVERSION_APPROX', severity: 'info', message: `Column "${ch.name}": unit conversion used approximation (${ch.conversionMethod}). Enter Fs for accurate integration.`, channel: ch.name });
  });
  return w;
}

// ─────────────────────────────────────────────────────────────────
// EXCEL PARSER
// ─────────────────────────────────────────────────────────────────

function parseExcel(buffer, filename) {
  if (typeof XLSX === 'undefined') throw new ParseError('SheetJS not loaded. Refresh and try again.', 'XLSX_MISSING');
  const wb = XLSX.read(buffer, { type: 'array' });

  // Pick sheet with most numeric content
  let best = null, bestCount = 0;
  for (const name of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    const n = (csv.match(/[-\d.]+/g) || []).length;
    if (n > bestCount) { best = csv; bestCount = n; }
  }

  if (!best) throw new ParseError('No usable data in Excel file.', 'EXCEL_EMPTY');
  return parseText(best, 'csv', filename);
}

// ─────────────────────────────────────────────────────────────────
// JSON PARSER
// ─────────────────────────────────────────────────────────────────

function parseJSON(text, filename) {
  let data;
  try { data = JSON.parse(text); } catch { throw new ParseError('Not valid JSON.', 'JSON_PARSE_ERROR'); }

  // Array of objects: [{t:0, x:1.2}, ...]
  if (Array.isArray(data) && typeof data[0] === 'object') {
    const keys = Object.keys(data[0]);
    const rows = data.map(obj => keys.map(k => parseFloat(obj[k]) ?? 0));
    const cols = classifyCols(keys, rows, {});
    const meta = extractMeta({}, cols, rows);
    return buildResult(cols, rows, meta, filename, 'json_array');
  }

  // Object of arrays: {x:[...], y:[...], fs:3000}
  if (typeof data === 'object' && !Array.isArray(data)) {
    const metaKV = {}, sigKeys = [];
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v) && v.length > 5 && typeof v[0] === 'number') sigKeys.push(k);
      else if (typeof v !== 'object') metaKV[k.toLowerCase()] = String(v);
    }
    if (sigKeys.length === 0) throw new ParseError('No signal arrays in JSON.', 'JSON_NO_SIGNALS');
    const maxLen = Math.max(...sigKeys.map(k => data[k].length));
    const rows = Array.from({ length: maxLen }, (_, i) => sigKeys.map(k => data[k][i] ?? 0));
    const cols = classifyCols(sigKeys, rows, metaKV);
    const meta = extractMeta(metaKV, cols, rows);
    return buildResult(cols, rows, meta, filename, 'json_object');
  }

  throw new ParseError('Unrecognised JSON structure.', 'JSON_UNKNOWN');
}

// ─────────────────────────────────────────────────────────────────
// COLUMN STATS
// ─────────────────────────────────────────────────────────────────

function colStats(vals) {
  const n = vals.length;
  const mean = vals.reduce((s, v) => s + v, 0) / n;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const sorted = [...vals].sort((a, b) => a - b);
  const min = sorted[0], max = sorted[n - 1];

  let isMonotonic = true;
  for (let i = 1; i < Math.min(n, 100); i++) {
    if (vals[i] < vals[i - 1]) { isMonotonic = false; break; }
  }

  return {
    n, mean, std, min, max,
    range: max - min,
    isMonotonic,
    uniqueCount: new Set(vals.slice(0, 200).map(v => v.toFixed(4))).size,
  };
}

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

function splitRow(line, delim) {
  if (delim !== ',') return line.split(delim);
  // Quoted CSV
  const out = []; let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function readAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = () => rej(new ParseError('Cannot read file.', 'FILE_READ_ERROR'));
    r.readAsText(file);
  });
}

function readAsBuffer(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = () => rej(new ParseError('Cannot read file.', 'FILE_READ_ERROR'));
    r.readAsArrayBuffer(file);
  });
}

class ParseError extends Error {
  constructor(msg, code) { super(msg); this.code = code; this.name = 'ParseError'; }
}

// ─────────────────────────────────────────────────────────────────
// APP INTEGRATION  — drop-in replacement for your file handler
// ─────────────────────────────────────────────────────────────────

async function handleFile(file, vendorHint = null) {
  setParseUI('loading', 'Detecting format…');

  try {
    const result = await parseVibrationFile(file, vendorHint);

    // Stash on global state
    window.appState = window.appState || {};
    appState.parseResult = result;

    // Auto-fill wizard fields — only if user hasn't already set them
    autofillWizard(result);

    // Render the confidence card
    renderParseCard(result);

    // Suggest multi-channel if needed
    if (result.channelCount > 1) suggestMultiChannel(result.channelCount);

    // Feed into existing channel mapping logic
    appState.detectedColumns = result.channels.map(ch => ({
      index: ch.index,
      name: ch.name,
      isNumeric: true,
      unitLabel: ch.unitLabel,
      suggestedLocation: ch.suggestedLocation,
      suggestedAxis: ch.suggestedAxis,
    }));

    if (typeof buildChannelMappingPanel === 'function') {
      buildChannelMappingPanel(appState.detectedColumns, result);
    }

    setParseUI('done');
    return result;

  } catch (err) {
    const msg = err instanceof ParseError
      ? `${err.message} (${err.code})`
      : `Unexpected error: ${err.message}`;
    setParseUI('error', msg);
    return null;
  }
}

function autofillWizard(result) {
  // Sampling rate
  if (result.fs) {
    const fsEl = document.getElementById('samplingRateInput');
    if (fsEl && !fsEl.value) fsEl.value = result.fs;
    if (typeof appState !== 'undefined' && !appState.samplingRate) appState.samplingRate = result.fs;
  }
  // RPM
  if (result.rpm) {
    const rpmEl = document.getElementById('rpmInput') || document.getElementById('nameplate-rpm');
    if (rpmEl && !rpmEl.value) rpmEl.value = result.rpm;
  }
  // Asset name
  if (result.assetId) {
    const nameEl = document.getElementById('assetNameInput') || document.getElementById('asset-name');
    if (nameEl && !nameEl.value) nameEl.value = result.assetId;
  }
  // Measurement date
  if (result.date) {
    const dateEl = document.getElementById('measurementDate');
    if (dateEl && !dateEl.value) dateEl.value = result.date;
  }
}

function setParseUI(state, msg = '') {
  const prog = document.getElementById('parseProgress');
  const err  = document.getElementById('parseError');
  if (prog) { prog.textContent = msg; prog.style.display = state === 'loading' ? 'block' : 'none'; }
  if (err)  { err.innerHTML = msg; err.style.display = state === 'error' ? 'block' : 'none'; }
}

function suggestMultiChannel(count) {
  const el = document.getElementById('multiChannelSuggestion');
  if (!el) return;
  el.innerHTML = `
    <span>${count} signal channels detected in this file.</span>
    <button onclick="setChannelMode('multi');this.closest('#multiChannelSuggestion').style.display='none'">
      Switch to multi-channel →
    </button>`;
  el.style.display = 'flex';
}

// ─────────────────────────────────────────────────────────────────
// PARSE CONFIDENCE CARD  (rendered into #parseConfidenceCard)
// ─────────────────────────────────────────────────────────────────

function renderParseCard(result) {
  const el = document.getElementById('parseConfidenceCard');
  if (!el) return;
  el.innerHTML = buildParseCardHTML(result);
  el.style.display = 'block';
}

function buildParseCardHTML(result) {
  const { vendor, vendorLabel, vendorProfileApplied, channels, channelCount,
          fs, fsSource, fsMissing, rpm, date, assetId, sampleCount,
          parseConfidence, warnings, vendorNotes } = result;

  const confColour = parseConfidence >= 80 ? 'var(--color-ok,#51cf66)'
    : parseConfidence >= 55 ? 'var(--color-warn,#ffd43b)'
    : 'var(--color-danger,#ff4444)';

  const showHint = parseConfidence < 75 || !vendor;

  const warnRows = warnings.map(w => `
    <div class="pcc-warn pcc-warn--${w.severity}">
      <span class="pcc-warn-icon">${w.severity === 'critical' ? '⚠' : w.severity === 'warning' ? '!' : 'i'}</span>
      <span>${w.message}</span>
    </div>`).join('');

  const chRows = channels.map(ch => `
    <div class="pcc-ch-row">
      <span class="pcc-ch-name">${ch.name}</span>
      <span class="pcc-ch-unit">${ch.unitLabel} → mm/s</span>
      <span class="pcc-ch-method">${ch.conversionMethod}${ch.conversionApprox ? ' ⚠' : ''}</span>
      <span class="pcc-ch-map">${ch.suggestedLocation} / ${ch.suggestedAxis}</span>
    </div>`).join('');

  // Vendor hint dropdown — only when confidence < 75% or vendor unknown
  const hintHTML = showHint ? buildVendorHintHTML(vendor, vendorLabel) : '';

  return `
<div class="pcc">
  <div class="pcc-top">
    <div class="pcc-vendor-block">
      <span class="pcc-vendor-name">${vendorLabel || 'Unknown format'}</span>
      ${vendorProfileApplied
        ? '<span class="pcc-badge pcc-badge--profile">profile applied</span>'
        : vendor
          ? '<span class="pcc-badge pcc-badge--auto">auto-detected</span>'
          : '<span class="pcc-badge pcc-badge--unknown">unrecognised</span>'}
    </div>
    <span class="pcc-conf" style="color:${confColour}">${parseConfidence}% confidence</span>
  </div>

  <div class="pcc-grid">
    <div class="pcc-cell"><div class="pcc-cell-label">Channels</div><div class="pcc-cell-val">${channelCount}</div></div>
    <div class="pcc-cell"><div class="pcc-cell-label">Sampling rate</div>
      <div class="pcc-cell-val ${fsMissing ? 'pcc-missing' : 'pcc-ok'}">
        ${fsMissing ? 'Not found' : fs.toLocaleString() + ' Hz'}
        ${fsSource ? `<span class="pcc-src">${fsSourceLabel(fsSource)}</span>` : ''}
      </div>
    </div>
    <div class="pcc-cell"><div class="pcc-cell-label">RPM in file</div><div class="pcc-cell-val">${rpm ? rpm.toLocaleString() : '—'}</div></div>
    <div class="pcc-cell"><div class="pcc-cell-label">Samples</div><div class="pcc-cell-val">${sampleCount.toLocaleString()}</div></div>
    <div class="pcc-cell"><div class="pcc-cell-label">Asset ID</div><div class="pcc-cell-val">${assetId || '—'}</div></div>
    <div class="pcc-cell"><div class="pcc-cell-label">Date</div><div class="pcc-cell-val">${date || '—'}</div></div>
  </div>

  ${channelCount > 0 ? `
  <div class="pcc-section-label">Signal channels</div>
  <div class="pcc-ch-table">
    <div class="pcc-ch-head"><span>Column</span><span>Unit</span><span>Conversion</span><span>Suggested mapping</span></div>
    ${chRows}
  </div>` : ''}

  ${vendorNotes ? `<div class="pcc-vendor-notes">${vendorNotes}</div>` : ''}
  ${warnRows}
  ${hintHTML}
</div>`;
}

function buildVendorHintHTML(autoVendor, autoLabel) {
  // Build grouped options
  const groups = {};
  for (const [key, p] of Object.entries(VENDOR_PROFILES)) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push({ key, label: p.label });
  }

  const optionsHTML = Object.entries(groups).map(([cat, items]) => `
    <optgroup label="${cat}">
      ${items.map(i => `<option value="${i.key}"${autoVendor && i.label === autoLabel ? ' selected' : ''}>${i.label}</option>`).join('')}
    </optgroup>`).join('');

  return `
<div class="pcc-hint-box">
  <div class="pcc-hint-label">
    Which data collector exported this file?
    <span class="pcc-hint-optional">Optional — helps resolve unit and sampling rate defaults.</span>
  </div>
  <div class="pcc-hint-row">
    <select id="vendorHintSelect" onchange="onVendorHintChange(this.value)">
      <option value="">— Select collector (optional) —</option>
      ${optionsHTML}
    </select>
  </div>
  <div id="vendorHintNotes" class="pcc-hint-notes" style="display:none"></div>
  <div id="vendorHintFsRow" class="pcc-hint-fs-row" style="display:none">
    <label class="pcc-fs-label">Sampling rate (Hz):</label>
    <select id="vendorFsSelect" onchange="onVendorFsSelect(this.value)"></select>
    <input type="number" id="vendorFsCustom" placeholder="or enter manually" min="10" max="2000000"
           oninput="onVendorFsCustom(this.value)" style="width:160px">
  </div>
</div>`;
}

function fsSourceLabel(src) {
  return { file_header: 'from file header', time_col_delta: 'from time column Δt',
           vendor_profile_default: 'vendor profile default' }[src] || src;
}

// ─────────────────────────────────────────────────────────────────
// VENDOR HINT CALLBACKS  (called from inline onchange handlers)
// ─────────────────────────────────────────────────────────────────

function onVendorHintChange(key) {
  if (!key) return;
  const profile = VENDOR_PROFILES[key];
  if (!profile) return;

  // Show notes
  const notesEl = document.getElementById('vendorHintNotes');
  if (notesEl) {
    notesEl.textContent = profile.exportNotes;
    notesEl.style.display = 'block';
  }

  // Show Fs selector if profile has options or no Fs found yet
  const fsRow = document.getElementById('vendorHintFsRow');
  const fsSelect = document.getElementById('vendorFsSelect');
  if (fsRow && fsSelect) {
    if (profile.fsOptions.length > 0 || !appState?.parseResult?.fs) {
      fsSelect.innerHTML = profile.fsOptions.length > 0
        ? profile.fsOptions.map(f => `<option value="${f}" ${f === profile.fsDefault ? 'selected' : ''}>${f.toLocaleString()} Hz</option>`).join('')
        : '<option value="">Enter manually →</option>';
      fsRow.style.display = 'flex';
    }
  }

  // Re-run parse with this profile applied
  if (appState?.parseResult) {
    const updated = rerunWithVendorHint(appState.parseResult, key);
    appState.parseResult = updated;
    renderParseCard(updated);
    autofillWizard(updated);
  }
}

function onVendorFsSelect(val) {
  const hz = parseFloat(val);
  if (!isNaN(hz) && hz > 0) applyFsOverride(hz);
}

function onVendorFsCustom(val) {
  const hz = parseFloat(val);
  if (!isNaN(hz) && hz > 10) applyFsOverride(hz);
}

function applyFsOverride(hz) {
  if (!appState?.parseResult) return;
  appState.parseResult.fs = hz;
  appState.parseResult.fsSource = 'user_manual';
  appState.parseResult.fsMissing = false;
  appState.samplingRate = hz;

  // Re-convert channels that needed Fs (g, mps2)
  appState.parseResult.channels = appState.parseResult.channels.map(ch => {
    if (['g', 'mps2'].includes(ch.rawUnit)) {
      const conv = convertToMmps(ch._rawValues, ch.rawUnit, hz);
      return { ...ch, converted: conv.signal, conversionMethod: conv.method, conversionApprox: conv.approx };
    }
    return ch;
  });

  // Update wizard field
  const fsEl = document.getElementById('samplingRateInput');
  if (fsEl) fsEl.value = hz;

  // Re-score and re-render
  appState.parseResult.parseConfidence = scoreConfidence(appState.parseResult);
  appState.parseResult.warnings = buildWarnings(appState.parseResult);
  renderParseCard(appState.parseResult);
}

// Expose for existing app code to call extractColumn from parse result
function getChannelSignal(colIndex) {
  const ch = appState?.parseResult?.channels?.find(c => c.index === colIndex);
  return ch?.converted || null;
}

// Module export — no-op in browser
if (typeof module !== 'undefined') module.exports = {
  parseVibrationFile, rerunWithVendorHint, handleFile,
  convertToMmps, VENDOR_PROFILES, ParseError, getChannelSignal,
};
