import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/common/BrandMark";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.aside}>
        <BrandMark inverse />

        <div className={styles.asideCopy}>
          <p className={styles.eyebrow}>Student services, simplified</p>
          <h1>One place to ask. One clear answer.</h1>
          <p>
            Sign in to get support grounded in college-managed information,
            from academic rules to campus services.
          </p>
        </div>

        <p className={styles.asideFooter}>
          Institute of Management Studies, Ghaziabad
          <br />
          Secure access for students and administrators
        </p>
      </section>

      <section className={styles.formPanel}>
        <Suspense fallback={<p className="text-muted">Loading login...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
