import Link from "next/link";
import { BrandMark } from "@/components/common/BrandMark";
import { ROUTES } from "@/lib/routes";
import styles from "./HomePage.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <BrandMark />
        <div className={styles.navActions}>
          <Link href={ROUTES.chat} className={styles.textLink}>
            Open AI Buddy
          </Link>
          <Link href={ROUTES.login} className={styles.primaryLink}>
            Student access
          </Link>
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>AI-powered student support</p>
          <h1>Ask AI Buddy about college information.</h1>
          <p className={styles.heroDescription}>
            A direct line to verified information about academics, exams,
            library services, fees, placements, and campus systems.
          </p>

          <div className={styles.heroActions}>
            <Link href={ROUTES.login} className={styles.heroPrimary}>
              Start chatting
            </Link>
            <Link href={ROUTES.chat} className={styles.heroSecondary}>
              Preview AI Buddy
            </Link>
          </div>

          <p className={styles.trustLine}>
            <span>College-managed knowledge</span>
            <span>Available around the clock</span>
            <span>Clear source context</span>
          </p>
        </div>

        <aside className={styles.preview} aria-label="AI Buddy preview">
          <div className={styles.previewHeader}>
            <BrandMark compact inverse />
            <span>AI Buddy</span>
          </div>
          <div className={styles.previewBody}>
            <h2>What do you need help with today?</h2>
            <p>Ask in your own words. Start with one of these common topics.</p>
            <div className={styles.questionList}>
              <span>Attendance requirements</span>
              <span>Exam form process</span>
              <span>Library and LMS access</span>
            </div>
            <div className={styles.previewFooter}>
              Responses are grounded in information maintained by the college
              administration.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}