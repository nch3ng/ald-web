// Lightweight liveness/readiness endpoint. Used by deployment health checks.
// Returns 200 with basic status JSON.
//
// This handler reads nothing from the request, so it is statically renderable on
// every host — Node server, Docker, Vercel, and the GitHub Pages static export
// alike. We intentionally do NOT set `dynamic = "force-dynamic"`: that is
// incompatible with `output: export` (it must be a static literal, and the export
// build rejects a forced-dynamic route). The `timestamp` therefore reflects
// build/deploy time and doubles as a "last deployed at" marker. If a future
// readiness check needs live per-request data (e.g. DB ping), add a separate
// server-only endpoint then.
export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "ald-web",
    timestamp: new Date().toISOString(),
  });
}
