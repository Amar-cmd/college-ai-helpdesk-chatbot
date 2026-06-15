import Link from "next/link";
import { KnowledgeForm } from "@/components/admin/KnowledgeForm";
import { KnowledgeTable } from "@/components/admin/KnowledgeTable";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PageHeader } from "@/components/common/PageHeader";
import { requireAdmin } from "@/lib/auth/requireRole";
import { getKnowledgeBaseItems } from "@/lib/db/knowledgeBase";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import styles from "../AdminPage.module.css";

export default async function AdminKnowledgePage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const knowledgeResult = await getKnowledgeBaseItems(supabase);

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.stack}>
          <PageHeader
            eyebrow="Admin Area"
            title="Knowledge Base Management"
            description="Add and maintain verified college information used by the chatbot."
            meta={`Signed in as ${profile.email}`}
            actions={
              <>
                <Link href={ROUTES.chat}>Student Chat</Link>
                <Link href={ROUTES.adminDiagnostics}>Diagnostics</Link>
                <SignOutButton />
              </>
            }
          />

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
