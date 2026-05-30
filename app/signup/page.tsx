import type { Metadata } from "next";
import styles from "../page.module.css";
import { buildMetadata } from "@/lib/gtm/seo";
import { SignupForm } from "./signup-form";

// Tracked landing path for campaign traffic (e.g. YouTube). UTMs on the inbound
// link — `?utm_source=youtube&utm_medium=description&utm_campaign=<video-slug>` —
// are captured and persisted by the GTM module on load, then attached to the
// `signup` event the form fires. See docs/youtube-funnel.md.
export const metadata: Metadata = buildMetadata({
  title: "Sign up",
  description:
    "Get early access to Aldero. Sign up to follow along as we build.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Get early access</h1>
      <p className={styles.subtitle}>
        Drop your email and we&apos;ll keep you posted. Coming from a video?
        We&apos;ll know which one — so we can make more of what helps.
      </p>
      <SignupForm />
    </main>
  );
}
