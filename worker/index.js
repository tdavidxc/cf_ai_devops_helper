// worker/index.js
//
// This is the main entry point for your Cloudflare Worker.
// Every time someone makes a request to your app, this file runs first.
// Its job is to look at the URL and forward the request to the right place.
//
// Think of it like a receptionist:
//   - /chat/...    → send to the Durable Object for WebSocket chat
//   - /history/... → send to the Durable Object to get saved messages
//   - /clear/...   → send to the Durable Object to delete saved messages

// We need to import the ChatMemory class so Cloudflare knows it exists.
// Cloudflare requires the Durable Object class to be exported from
// the same file as the default export (this file).
import { ChatMemory } from "../durable-object/ChatMemory.js";

// Re-export it so Cloudflare can find and register it
export { ChatMemory };

// This is the main Worker. Cloudflare calls fetch() on every incoming request.
export default {

  async fetch(request, env) {

    // Parse the URL so we can look at the path (e.g. "/chat/abc123")
    var url = new URL(request.url);

    // CORS headers allow the browser to talk to this Worker from any domain.
    // Without these, browsers block requests from different origins.
    var corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Browsers send an OPTIONS "preflight" request before the real request
    // to check if CORS is allowed. We just say yes and return.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- Route: /chat/<sessionId> ---
    // This is the WebSocket chat endpoint.
    // Each user has a unique sessionId (a random ID generated in the browser).
    // We use that ID to find (or create) their personal Durable Object instance.
    if (url.pathname.startsWith("/chat/")) {

      // Split "/chat/abc123" by "/" to get ["", "chat", "abc123"]
      // Index 2 gives us "abc123" — the session ID
      var sessionId = url.pathname.split("/")[2];

      if (!sessionId) {
        return new Response("Missing session ID", { status: 400 });
      }

      // idFromName() turns the session ID string into a Durable Object ID.
      // If you call idFromName() with the same string, you always get the same ID.
      // This means the same user always gets the same Durable Object (same memory).
      var doId = env.CHAT_MEMORY.idFromName(sessionId);

      // get() gives us a "stub" — an object we can send requests to.
      // Cloudflare will route it to the correct Durable Object instance.
      var stub = env.CHAT_MEMORY.get(doId);

      // Forward the original request to the Durable Object
      return stub.fetch(request);
    }

    // --- Route: /history/<sessionId> ---
    // Returns the saved chat messages for a session as JSON.
    if (url.pathname.startsWith("/history/")) {

      var sessionId = url.pathname.split("/")[2];

      var doId = env.CHAT_MEMORY.idFromName(sessionId);
      var stub = env.CHAT_MEMORY.get(doId);

      // We create a new internal request pointing to "/history" on the DO
      var internalRequest = new Request("https://internal/history", { method: "GET" });
      var doResponse = await stub.fetch(internalRequest);

      // Read the response body as text, then send it back with CORS headers
      var body = await doResponse.text();
      return new Response(body, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    // --- Route: /clear/<sessionId> ---
    // Deletes all saved messages for a session.
    if (url.pathname.startsWith("/clear/")) {

      var sessionId = url.pathname.split("/")[2];

      var doId = env.CHAT_MEMORY.idFromName(sessionId);
      var stub = env.CHAT_MEMORY.get(doId);

      var internalRequest = new Request("https://internal/clear", { method: "POST" });
      var doResponse = await stub.fetch(internalRequest);

      var body = await doResponse.text();
      return new Response(body, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    // If no route matched, return a 404
    return new Response("Not found", { status: 404 });
  }
};