import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Hello, world 👋</h1>
      <p className={styles.subtitle}>
        The app is running. This is the thin foundation slice — edit{" "}
        <code className={styles.code}>app/page.tsx</code> to start building.
      </p>
      <p className={styles.health}>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
