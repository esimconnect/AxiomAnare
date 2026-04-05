/**
 * AxiomAnare — Anthropic API Proxy
 * Cloudflare Worker: restless-tree-eac8.kairosventure-io.workers.dev
 * Kairos Ventures Pte Ltd
 *
 * - Injects ANTHROPIC_API_KEY secret (never exposed to client)
 * - Adds CORS headers so browser can call from GitHub Pages
 * - Supports streaming (text/event-stream) and standard JSON responses
 */

const ALLOWED_ORIGIN = "https://esimconnect.github.io";
const ANTHROPIC_API_BASE = "https://api.anthropic.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, anthropic-version",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    // ── Preflight ────────────────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Origin guard ─────────────────────────────────────────────────────────
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    // ── Only allow POST ──────────────────────────────────────────────────────
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // ── Build upstream URL ───────────────────────────────────────────────────
    const url = new URL(request.url);
    // Strip the worker's own host; forward the path to Anthropic
    // e.g. /v1/messages → https://api.anthropic.com/v1/messages
    const upstreamURL = ANTHROPIC_API_BASE + url.pathname;

    // ── Forward headers, inject API key ─────────────────────────────────────
    const upstreamHeaders = new Headers();
    upstreamHeaders.set("Content-Type", "application/json");
    upstreamHeaders.set("x-api-key", env.ANTHROPIC_API_KEY);
    upstreamHeaders.set(
      "anthropic-version",
      request.headers.get("anthropic-version") || "2023-06-01"
    );

    // ── Proxy the request body ───────────────────────────────────────────────
    const body = await request.text();

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamURL, {
        method: "POST",
        headers: upstreamHeaders,
        body,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed", detail: err.message }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // ── Return response with CORS headers ────────────────────────────────────
    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(k, v);
    }

    // Streaming passthrough — don't buffer if it's SSE
    const contentType = upstreamResponse.headers.get("Content-Type") || "";
    if (contentType.includes("text/event-stream")) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    }

    // Standard JSON response
    const responseBody = await upstreamResponse.text();
    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  },
};
