import { ChatWindow } from "@/components/chat/ChatWindow";
import { getSessionMessages } from "@/lib/db/chatMessages";
import { getOrCreateDefaultChatSession } from "@/lib/db/chatSessions";
import { requireUser } from "@/lib/auth/requireRole";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import styles from "./ChatPage.module.css";

export default async function ChatPage() {
  const { profile } = await requireUser(ROUTES.chat);
  const supabase = await createClient();

  const sessionResult = await getOrCreateDefaultChatSession(supabase, profile.id);

  if (!sessionResult.ok) {
    return (
      <section className={styles.chatPage}>
        <div className={styles.chatContainer}>
          <div className="card" style={{ padding: "24px" }}>
            <h1 style={{ marginTop: 0 }}>Chat is temporarily unavailable</h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              We could not prepare your chat session. Please refresh the page or
              try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const messagesResult = await getSessionMessages(
    supabase,
    sessionResult.data.id,
    profile.id
  );

  return (
    <section className={styles.chatPage}>
      <div className={styles.chatContainer}>
        <ChatWindow
          userEmail={profile.email}
          userRole={profile.role}
          sessionId={sessionResult.data.id}
          initialMessages={messagesResult.ok ? messagesResult.data : []}
          initialError={
            messagesResult.ok
              ? null
              : "Your saved messages could not be loaded. New messages can still be sent."
          }
        />
      </div>
    </section>
  );
}