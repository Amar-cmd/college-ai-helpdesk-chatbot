import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <section className="page-section">
      <div className="container">
        <div
          className="card"
          style={{
            padding: "40px",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              color: "var(--color-primary)",
              fontWeight: 700,
            }}
          >
            {APP_CONFIG.collegeName}
          </p>

          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(32px, 6vw, 56px)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            {APP_CONFIG.name}
          </h1>

          <p
            className="text-muted"
            style={{
              margin: "0 0 28px",
              fontSize: "18px",
              lineHeight: 1.7,
            }}
          >
            A clean, college-specific AI helpdesk chatbot for student support,
            academic FAQs, LMS help, notices, and admin-managed knowledge base.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={ROUTES.login}
              className="focus-ring"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "44px",
                padding: "0 18px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-primary)",
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              Go to Login
            </Link>

            <Link
              href={ROUTES.chat}
              className="focus-ring"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "44px",
                padding: "0 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontWeight: 700,
              }}
            >
              Preview Chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}