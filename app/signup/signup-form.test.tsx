import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SignupForm } from "./signup-form";
import { captureAttribution, clearAttribution } from "@/lib/gtm/attribution";

// Real-component evidence for the CMO's funnel-hop concern: render the actual
// form a visitor submits and prove a YouTube-attributed visit's signup keeps the
// originating campaign even after the visitor navigated through a UTM-less page.
describe("SignupForm — YouTube attribution survives the funnel hop", () => {
  beforeEach(() => clearAttribution());
  afterEach(() => {
    clearAttribution();
    cleanup();
    vi.restoreAllMocks();
  });

  test("signup fired on a later page still carries source=youtube + campaign", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    // 1. Visitor lands on /signup with YouTube UTMs (loader captures on load).
    captureAttribution(
      "?utm_source=youtube&utm_medium=description&utm_campaign=inbox-ai-agent",
    );
    // 2. Visitor navigates AWAY to a UTM-less page, then comes back to sign up.
    //    Re-running capture on the UTM-less URL must not clobber first-touch.
    captureAttribution("");

    // 3. Render the real form and submit it.
    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText(/get early access/i), {
      target: { value: "creator@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Evidence A — the event sent to analytics carries the campaign.
    expect(debug).toHaveBeenCalledWith(
      "[gtm] signup",
      expect.objectContaining({
        method: "email",
        source: "youtube",
        campaign: "inbox-ai-agent",
      }),
    );
    // Evidence B — the on-screen confirmation echoes the attribution (QA aid).
    expect(
      screen.getByText(/attributed to source=youtube, campaign=inbox-ai-agent/i),
    ).toBeInTheDocument();
  });

  test("direct visit (no UTMs) signs up with no campaign attribution", () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText(/get early access/i), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText(/no campaign attribution/i)).toBeInTheDocument();
  });
});
