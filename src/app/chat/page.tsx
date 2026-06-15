import { ChatWindow } from "@/components/chat/ChatWindow";
import { requireUser } from "@/lib/auth/requireRole";
import { ROUTES } from "@/lib/routes";

export default async function ChatPage() {
  const { profile } = await requireUser(ROUTES.chat);

  return (
    <section className="page-section">
      <div className="container">
        <ChatWindow userEmail={profile.email} userRole={profile.role} />
      </div>
    </section>
  );
}