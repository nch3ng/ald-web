import { describe, expect, it } from "vitest";
// Imported via the `@/` path alias (resolved by vite-tsconfig-paths in
// vitest.config.mts) to keep tests consistent with app import conventions.
import { GET } from "@/app/api/health/route";

// Tests real product code (the health endpoint used by deploy checks), not just
// the test harness. Keeps green/red tied to something that matters.
describe("GET /api/health", () => {
  it("responds 200 with an ok status payload", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({ status: "ok", service: "ald-web" });
    expect(typeof body.timestamp).toBe("string");
    // timestamp should be a valid ISO date
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
