import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  captureAttribution,
  clearAttribution,
  getAttribution,
  parseUtmParams,
} from "./attribution";
import { track } from "./analytics";

const YT_QUERY =
  "?utm_source=youtube&utm_medium=description&utm_campaign=inbox-ai-agent&utm_content=endcard";

describe("parseUtmParams", () => {
  test("maps utm_* params to attribution fields", () => {
    expect(parseUtmParams(YT_QUERY)).toEqual({
      source: "youtube",
      medium: "description",
      campaign: "inbox-ai-agent",
      content: "endcard",
    });
  });

  test("ignores non-utm params and drops empties", () => {
    expect(parseUtmParams("?ref=hn&utm_source=&utm_campaign=x")).toEqual({
      campaign: "x",
    });
  });

  test("returns {} for an empty query string", () => {
    expect(parseUtmParams("")).toEqual({});
  });
});

describe("captureAttribution (first-touch, per visit)", () => {
  beforeEach(() => clearAttribution());
  afterEach(() => clearAttribution());

  test("captures and persists UTMs from the landing URL", () => {
    const captured = captureAttribution(YT_QUERY);
    expect(captured).toMatchObject({ source: "youtube", campaign: "inbox-ai-agent" });
    // Persisted for later events in the same visit.
    expect(getAttribution()).toEqual(captured);
    expect(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toContain(
      "youtube",
    );
  });

  test("first-touch wins: a later UTM-less or different page does not clobber it", () => {
    captureAttribution(YT_QUERY);
    // Navigating to a page with different UTMs must NOT overwrite the original.
    const after = captureAttribution("?utm_source=twitter&utm_campaign=other");
    expect(after.source).toBe("youtube");
    expect(after.campaign).toBe("inbox-ai-agent");
  });

  test("no UTMs and nothing stored → empty attribution", () => {
    expect(captureAttribution("?foo=bar")).toEqual({});
  });
});

describe("signup event carries YouTube attribution", () => {
  beforeEach(() => clearAttribution());
  afterEach(() => {
    clearAttribution();
    vi.restoreAllMocks();
  });

  test("dispatch merges stored attribution into the signup event params", () => {
    // dev (NODE_ENV !== production) logs the *enriched* params via console.debug,
    // which is the exact object handed to gtag — so we assert the merge there.
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    captureAttribution(YT_QUERY);
    track("signup", { method: "email" });

    expect(debug).toHaveBeenCalledWith(
      "[gtm] signup",
      expect.objectContaining({
        method: "email",
        source: "youtube",
        medium: "description",
        campaign: "inbox-ai-agent",
        content: "endcard",
      }),
    );
  });

  test("explicit params win over attribution on key collision", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    captureAttribution("?utm_source=youtube&utm_campaign=inbox-ai-agent");
    // An explicit `source` passed to track must override the stored one.
    track("cta_click", { cta_id: "x", source: "override" } as never);

    expect(debug).toHaveBeenCalledWith(
      "[gtm] cta_click",
      expect.objectContaining({ source: "override", campaign: "inbox-ai-agent" }),
    );
  });
});
