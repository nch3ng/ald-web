import styles from "./page.module.css";

// Plain <a> tags are NOT auto-prefixed with Next's basePath, so we build the
// health link explicitly. Empty on a Node host; "/ald-web" in the Pages export.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const healthHref = `${basePath}/api/health`;

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Hello, world 👋</h1>
      <p className={styles.subtitle}>
        The app is running. This is the thin foundation slice — edit{" "}
        <code className={styles.code}>app/page.tsx</code> to start building.
      </p>
      <p className={styles.health}>
        Health check: <a href={healthHref}>{healthHref}</a>
      </p>
    </main>
  );
}
