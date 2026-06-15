import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <section className="page-section">
      <div
        className="container"
        style={{
          display: "grid",
          minHeight: "calc(100vh - 96px)",
          placeItems: "center",
        }}
      >
        <Suspense fallback={<p className="text-muted">Loading login...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}