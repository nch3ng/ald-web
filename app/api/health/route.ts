// Lightweight liveness/readiness endpoint. Used by deployment health checks
// (see ALD child tasks for CI/CD). Returns 200 with basic status JSON.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "ald-web",
    timestamp: new Date().toISOString(),
  });
}
