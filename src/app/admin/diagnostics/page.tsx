import Link from "next/link";
import { AdminDiagnostics } from "@/components/admin/AdminDiagnostics";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/auth/requireRole";
import { getRecentProviderLogs } from "@/lib/db/providerLogs";
import { getRecentRateLimitLogs } from "@/lib/db/rateLimitLogs";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDiagnosticsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [providerLogsResult, rateLimitLogsResult] = await Promise.all([
    getRecentProviderLogs(supabase, 30),
    getRecentRateLimitLogs(supabase, 30),
  ]);

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
                  Diagnostics
                </h1>
                <p className="text-muted" style={{ margin: "8px 0 0" }}>
                  Signed in as {profile.email}
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href={ROUTES.adminKnowledge}>Knowledge Base</Link>
                <SignOutButton />
              </div>
            </div>
          </div>

          {!providerLogsResult.ok || !rateLimitLogsResult.ok ? (
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ marginTop: 0 }}>Diagnostics could not be loaded</h2>
              <p className="text-muted" style={{ marginBottom: 0 }}>
                Please refresh the page or try again later.
              </p>
            </div>
          ) : (
            <AdminDiagnostics
              providerLogs={providerLogsResult.data}
              rateLimitLogs={rateLimitLogsResult.data}
            />
          )}
        </div>
      </div>
    </section>
  );
}