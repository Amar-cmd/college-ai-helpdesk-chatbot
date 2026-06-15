import Link from "next/link";
import { AdminDiagnostics } from "@/components/admin/AdminDiagnostics";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PageHeader } from "@/components/common/PageHeader";
import { requireAdmin } from "@/lib/auth/requireRole";
import { getRecentProviderLogs } from "@/lib/db/providerLogs";
import { getRecentRateLimitLogs } from "@/lib/db/rateLimitLogs";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import styles from "../AdminPage.module.css";

export default async function AdminDiagnosticsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [providerLogsResult, rateLimitLogsResult] = await Promise.all([
    getRecentProviderLogs(supabase, 30),
    getRecentRateLimitLogs(supabase, 30),
  ]);

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.stack}>
          <PageHeader
            eyebrow="Admin Area"
            title="Diagnostics"
            description="Review recent provider activity, fallback behavior, and rate-limit events."
            meta={`Signed in as ${profile.email}`}
            actions={
              <>
                <Link href={ROUTES.chat}>Student Chat</Link>
                <Link href={ROUTES.adminKnowledge}>Knowledge Base</Link>
                <SignOutButton />
              </>
            }
          />

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
