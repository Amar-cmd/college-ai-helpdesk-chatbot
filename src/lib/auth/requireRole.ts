import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser } from "./getCurrentUser";
import type { UserRole } from "@/types/database";

export async function requireUser(redirectBackTo: string = ROUTES.chat) {
  const result = await getCurrentUser();

  if (!result.user || !result.profile) {
    redirect(`${ROUTES.login}?redirect=${encodeURIComponent(redirectBackTo)}`);
  }

  return {
    user: result.user,
    profile: result.profile,
  };
}

export async function requireRole(
  allowedRoles: UserRole[],
  redirectBackTo: string = ROUTES.chat
) {
  const result = await requireUser(redirectBackTo);

  if (!allowedRoles.includes(result.profile.role)) {
    redirect(`${ROUTES.chat}?access=denied`);
  }

  return result;
}

export async function requireAdmin() {
  return requireRole(["admin"], ROUTES.adminKnowledge);
}