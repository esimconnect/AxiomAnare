/**
 * AxiomAnare — API Proxy
 * Cloudflare Worker: restless-tree-eac8.kairosventure-io.workers.dev
 * Kairos Ventures Pte Ltd
 *
 * Routes:
 *   POST /v1/messages        → Anthropic Claude API (streaming supported)
 *   POST /embed              → Voyage AI embeddings  (VOYAGE_API_KEY secret)
 *   POST /rag                → Supabase match_knowledge_chunks RPC
 *                              (SUPABASE_URL + SUPABASE_SERVICE_KEY secrets)
 *
 * All API keys injected server-side — never exposed to client.
 */

const ALLOWED_ORIGIN   = "https://esimconnect.github.io";
const ANTHROPIC_API_BASE = "https://api.anthropic.com";
const VOYAGE_API_BASE    = "https://api.voyageai.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, anthropic-version",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errResponse(msg, status = 500) {
  return jsonResponse({ error: msg }, status);
}

export default {
  async fetch(request, env) {

    // ── Preflight ─────────────────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Origin guard ──────────────────────────────────────────────────────────
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url      = new URL(request.url);
    const pathname = url.pathname;

    // ══════════════════════════════════════════════════════════════════════════
    // ROUTE: /embed  — Voyage AI text embedding
    // Body: { text: string }
    // Returns: { embedding: number[1024] }
    // ══════════════════════════════════════════════════════════════════════════
    if (pathname === "/embed") {
      let body;
      try { body = await request.json(); } catch {
        return errResponse("Invalid JSON body", 400);
      }
      const text = (body.text || "").trim();
      if (!text) return errResponse("text field required", 400);

      let voyageRes;
      try {
        voyageRes = await fetch(`${VOYAGE_API_BASE}/v1/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.VOYAGE_API_KEY}`,
          },
          body: JSON.stringify({ model: "voyage-3", input: [text] }),
        });
      } catch (err) {
        return errResponse("Voyage fetch failed: " + err.message, 502);
      }

      if (!voyageRes.ok) {
        const detail = await voyageRes.text();
        return errResponse("Voyage API error: " + detail, voyageRes.status);
      }

      const vData = await voyageRes.json();
      const embedding = vData?.data?.[0]?.embedding;
      if (!embedding) return errResponse("No embedding returned from Voyage", 502);

      return jsonResponse({ embedding });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ROUTE: /rag  — Supabase match_knowledge_chunks RPC
    // Body: { query_embedding: number[1024], match_count?: number }
    // Returns: chunk[]  (array of knowledge chunk rows with similarity)
    // Uses service key — bypasses RLS so all chunks are searchable
    // ══════════════════════════════════════════════════════════════════════════
    if (pathname === "/rag") {
      let body;
      try { body = await request.json(); } catch {
        return errResponse("Invalid JSON body", 400);
      }
      if (!body.query_embedding || !Array.isArray(body.query_embedding)) {
        return errResponse("query_embedding array required", 400);
      }

      const supabaseUrl = env.SUPABASE_URL;
      const serviceKey  = env.SUPABASE_SERVICE_KEY;
      if (!supabaseUrl || !serviceKey) {
        return errResponse("Supabase env vars not configured", 500);
      }

      let rpcRes;
      try {
        rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_knowledge_chunks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey":        serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            query_embedding: body.query_embedding,
            match_count:     body.match_count || 5,
          }),
        });
      } catch (err) {
        return errResponse("Supabase fetch failed: " + err.message, 502);
      }

      if (!rpcRes.ok) {
        const detail = await rpcRes.text();
        return errResponse("Supabase RPC error: " + detail, rpcRes.status);
      }

      const chunks = await rpcRes.json();
      return jsonResponse(chunks);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ROUTE: /v1/messages (and any /v1/* path)  — Anthropic Claude API
    // Pass-through proxy with API key injection. Supports SSE streaming.
    // ══════════════════════════════════════════════════════════════════════════
    const upstreamURL = ANTHROPIC_API_BASE + pathname;

    const upstreamHeaders = new Headers();
    upstreamHeaders.set("Content-Type", "application/json");
    upstreamHeaders.set("x-api-key", env.ANTHROPIC_API_KEY);
    upstreamHeaders.set(
      "anthropic-version",
      request.headers.get("anthropic-version") || "2023-06-01"
    );

    const body = await request.text();

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamURL, {
        method: "POST",
        headers: upstreamHeaders,
        body,
      });
    } catch (err) {
      return errResponse("Upstream fetch failed: " + err.message, 502);
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(k, v);
    }

    // SSE streaming passthrough
    const contentType = upstreamResponse.headers.get("Content-Type") || "";
    if (contentType.includes("text/event-stream")) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    }

    const responseBody = await upstreamResponse.text();
    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  },
};
