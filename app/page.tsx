import type { Metadata } from "next";
import styles from "./page.module.css";
import { buildMetadata, softwareAppJsonLd } from "@/lib/gtm/seo";
import { JsonLd } from "@/lib/gtm/JsonLd";
import { CtaButton } from "./cta-button";

// Plain <a> tags are NOT auto-prefixed with Next's basePath, so we build the
// health link explicitly. Empty on a Node host; "/ald-web" in the Pages export.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const healthHref = `${basePath}/api/health`;

// Page-level metadata: unique title + description, canonical for "/". Spreads
// the GTM-ready baseline from buildMetadata().
export const metadata: Metadata = buildMetadata({
  title: "The Aldero web foundation",
  description:
    "A fast, observable Next.js + TypeScript starter that ships GTM-ready — SEO, OpenGraph, structured data, and a shared analytics event model — from day one.",
  path: "/",
});

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Per-page structured data demonstrating the product surface. */}
      <JsonLd
        data={softwareAppJsonLd({
          name: "ald-web",
          description:
            "The Aldero web application foundation — a GTM-ready Next.js starter.",
          applicationCategory: "DeveloperApplication",
        })}
      />
      <h1 className={styles.title}>Hello, world 👋</h1>
      <p className={styles.subtitle}>
        The app is running. This is the thin foundation slice — edit{" "}
        <code className={styles.code}>app/page.tsx</code> to start building.
      </p>
      <p>
        <CtaButton ctaId="hero_get_started" href={healthHref}>
          Check it&apos;s alive →
        </CtaButton>
      </p>
      <p className={styles.health}>
        Health check: <a href={healthHref}>{healthHref}</a>
      </p>
    </main>
  );
}
