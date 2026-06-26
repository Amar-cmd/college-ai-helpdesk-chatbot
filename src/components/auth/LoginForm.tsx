"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";

type AuthMode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    return searchParams.get("redirect") || "/chat";
  }, [searchParams]);

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setErrorMessage("Full name is required to create an account.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        setStatusMessage("Login completed. You can now open AI Buddy.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      setStatusMessage(
        "Account created. If email confirmation is enabled, please verify your email before logging in."
      );
      setMode("login");
    } catch {
      setErrorMessage("Authentication failed. Please check the Supabase configuration.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Secure access</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Use your registered email to continue to AI Buddy."
            : "Register with your college details to access AI Buddy."}
        </p>
      </div>

      <div className={styles.switcher} aria-label="Authentication mode">
        <button
          type="button"
          className={mode === "login" ? styles.activeSwitch : ""}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? styles.activeSwitch : ""}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className={styles.field}>
            <span>Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@college.edu"
            type="email"
            autoComplete="email"
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : mode === "login"
              ? "Sign in to AI Buddy"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}