import { requireUser } from "@/lib/auth/requireRole";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { APP_CONFIG } from "@/config/app";
import { ROUTES } from "@/lib/routes";

export default async function ChatPage() {
  const { profile } = await requireUser(ROUTES.chat);

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
                {APP_CONFIG.name}
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  letterSpacing: "-0.03em",
                }}
              >
                Chat page protected
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
              Logged in as: {profile.email}
            </p>
            <p className="text-muted" style={{ margin: 0 }}>
              Role: {profile.role}. The real chat interface will be built here
              in the next step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
