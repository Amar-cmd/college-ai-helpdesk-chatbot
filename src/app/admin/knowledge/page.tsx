import { requireAdmin } from "@/lib/auth/requireRole";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AdminKnowledgePage() {
  const { profile } = await requireAdmin();

  return (
    <section className="page-section">
      <div className="container">
        <div
          className="card"
          style={{
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  color: "var(--color-primary)",
                  fontWeight: 800,
                }}
              >
                Admin Area
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  letterSpacing: "-0.03em",
                }}
              >
                Knowledge Base Management
              </h1>
            </div>

            <SignOutButton />
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
              Admin logged in: {profile.email}
            </p>
            <p className="text-muted" style={{ margin: 0 }}>
              The FAQ add and edit form will be built here in the next admin step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}