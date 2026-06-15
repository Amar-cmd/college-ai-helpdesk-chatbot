import { KnowledgeForm } from "@/components/admin/KnowledgeForm";
import { KnowledgeTable } from "@/components/admin/KnowledgeTable";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/auth/requireRole";
import { getKnowledgeBaseItems } from "@/lib/db/knowledgeBase";
import { createClient } from "@/lib/supabase/server";

export default async function AdminKnowledgePage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const knowledgeResult = await getKnowledgeBaseItems(supabase);

  return (
    <section className="page-section">
      <div className="container">
        <div style={{ display: "grid", gap: "24px" }}>
          <div className="card" style={{ padding: "28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "center",
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
                    fontSize: "30px",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Knowledge Base Management
                </h1>
                <p className="text-muted" style={{ margin: "8px 0 0" }}>
                  Signed in as {profile.email}
                </p>
              </div>

              <SignOutButton />
            </div>
          </div>

          <KnowledgeForm />

          {knowledgeResult.ok ? (
            <KnowledgeTable items={knowledgeResult.data} />
          ) : (
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ marginTop: 0 }}>Knowledge base could not be loaded</h2>
              <p className="text-muted" style={{ marginBottom: 0 }}>
                Please refresh the page or try again later.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}