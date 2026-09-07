// THE SIGNAL ENGINE — scheduler. Fires every 2 hours and hands the real work to the
// background writer (signal-writer-background) so nothing hits the 10-second function limit.
// Needs env var ANTHROPIC_API_KEY (Netlify -> Site configuration -> Environment variables).
import { internalToken, SITE } from "./lib/store.mjs";

export default async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("SIGNAL ENGINE idle: set ANTHROPIC_API_KEY in Netlify env vars.");
    return new Response("idle", { status: 200 });
  }
  const base = (process.env.URL || SITE).replace(/\/$/, "");
  const r = await fetch(base + "/.netlify/functions/signal-writer-background", {
    method: "POST",
    headers: { "content-type": "application/json", "x-signal-token": internalToken() },
    body: JSON.stringify({ count: "auto" })   // 1 per run; one per beat on the very first run
  });
  console.log("SIGNAL ENGINE triggered writer:", r.status);
  return new Response("triggered " + r.status, { status: 200 });
};

export const config = { schedule: "17 */2 * * *" };
