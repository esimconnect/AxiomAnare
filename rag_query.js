/**
 * rag_query.js — AxiomAnare RAG Runtime Query Module
 * ====================================================
 * Generates a query embedding from the current diagnostic context,
 * calls the Supabase pgvector similarity search RPC, and returns
 * formatted context blocks for injection into the Claude system prompt.
 *
 * Usage (in app.js, before the Claude API call):
 *
 *   const ragContext = await RagQuery.getContext(diagnosticSummary);
 *   // ragContext is a string ready to append to the Claude system prompt
 *
 * Dependencies: Supabase JS client (already loaded in index.html)
 * Embedding: Anthropic voyage-3 via /v1/embeddings proxy
 *
 * Pattern: IIFE exposing window.RagQuery — matches window.Auth pattern.
 */

(function () {
  "use strict";

  const SUPABASE_URL = "https://zjfhxutcvjxootoekade.supabase.co";
  const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY || "";  // set in index.html

  const TOP_K = 3;           // chunks returned per query
  const EMBED_MODEL = "voyage-3";

  // --------------------------------------------------------------------------
  // Embed query text via Anthropic API
  // --------------------------------------------------------------------------

  async function _embedQuery(text) {
    // Calls the Supabase Edge Function proxy — ANTHROPIC_API_KEY stays server-side.
    // Edge Function: supabase/functions/rag-embed/index.ts
    const EDGE_URL = `${SUPABASE_URL}/functions/v1/rag-embed`;

    const response = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Embedding Edge Function failed: ${err}`);
    }

    const data = await response.json();
    if (!data.embedding) throw new Error("No embedding returned from Edge Function");
    return data.embedding;
  }

  // --------------------------------------------------------------------------
  // Supabase RPC — match_knowledge_chunks
  // Defined in: supabase/functions/sql/match_knowledge_chunks.sql
  // --------------------------------------------------------------------------

  async function _searchChunks(embedding) {
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await sb.rpc("match_knowledge_chunks", {
      query_embedding: embedding,
      match_count:     TOP_K,
    });

    if (error) throw new Error(`pgvector search failed: ${error.message}`);
    return data || [];
  }

  // --------------------------------------------------------------------------
  // Format chunks for Claude system prompt injection
  // --------------------------------------------------------------------------

  function _formatContext(chunks) {
    if (!chunks || chunks.length === 0) return "";

    const lines = [
      "--- KNOWLEDGE BASE CONTEXT ---",
      "The following reference material has been retrieved from the AxiomAnare",
      "knowledge base and is relevant to this diagnostic case. Use it to ground",
      "your analysis. Do not contradict it without explicit justification.",
      "",
    ];

    chunks.forEach((chunk, i) => {
      lines.push(`[KB-${i + 1}] Source: ${chunk.source_label}`);
      lines.push(`Category: ${chunk.category}`);
      lines.push(`Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
      lines.push("");
      lines.push(chunk.content.trim());
      lines.push("");
      lines.push("---");
      lines.push("");
    });

    return lines.join("\n");
  }

  // --------------------------------------------------------------------------
  // Build the diagnostic query string from available signal data
  // This is what gets embedded — richer = better retrieval.
  // --------------------------------------------------------------------------

  function _buildQueryText(diagnosticSummary) {
    // diagnosticSummary is the object already computed in app.js
    // Expected keys (all optional — gracefully degrades):
    //   isoZone, primaryFault, faultScores, rmsVelocity, peakG,
    //   dominantFreq, machineType, rpm, channelLabel
    const parts = [];

    if (diagnosticSummary.isoZone) {
      parts.push(`ISO 10816-3 zone: ${diagnosticSummary.isoZone}`);
    }
    if (diagnosticSummary.primaryFault) {
      parts.push(`Primary fault classification: ${diagnosticSummary.primaryFault}`);
    }
    if (diagnosticSummary.faultScores) {
      const scores = Object.entries(diagnosticSummary.faultScores)
        .filter(([, v]) => v > 0.1)
        .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
        .join(", ");
      if (scores) parts.push(`Fault probability scores: ${scores}`);
    }
    if (diagnosticSummary.rmsVelocity) {
      parts.push(`RMS velocity: ${diagnosticSummary.rmsVelocity} mm/s`);
    }
    if (diagnosticSummary.peakG) {
      parts.push(`Peak acceleration: ${diagnosticSummary.peakG} g`);
    }
    if (diagnosticSummary.dominantFreq) {
      parts.push(`Dominant frequency: ${diagnosticSummary.dominantFreq} Hz`);
    }
    if (diagnosticSummary.machineType) {
      parts.push(`Machine type: ${diagnosticSummary.machineType}`);
    }
    if (diagnosticSummary.rpm) {
      parts.push(`Operating speed: ${diagnosticSummary.rpm} RPM`);
    }

    return parts.join(". ") || "vibration diagnostic analysis rotating machinery";
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * RagQuery.getContext(diagnosticSummary)
   *
   * @param {Object} diagnosticSummary — diagnostic results from app.js pipeline
   * @returns {Promise<string>} — formatted context string for Claude system prompt
   *
   * Returns empty string on any failure (RAG is enhancement, not critical path).
   */
  async function getContext(diagnosticSummary) {
    try {
      const queryText = _buildQueryText(diagnosticSummary);
      const embedding = await _embedQuery(queryText);
      const chunks    = await _searchChunks(embedding);
      return _formatContext(chunks);
    } catch (err) {
      console.warn("[RagQuery] Context retrieval failed (non-fatal):", err.message);
      return "";
    }
  }

  /**
   * RagQuery.getContextDirect(queryText)
   *
   * Alternative entry point — pass raw query text directly.
   * Useful for multi-channel or custom diagnostic prompts.
   *
   * @param {string} queryText
   * @returns {Promise<string>}
   */
  async function getContextDirect(queryText) {
    try {
      const embedding = await _embedQuery(queryText);
      const chunks    = await _searchChunks(embedding);
      return _formatContext(chunks);
    } catch (err) {
      console.warn("[RagQuery] Direct context retrieval failed (non-fatal):", err.message);
      return "";
    }
  }

  window.RagQuery = { getContext, getContextDirect };

})();
