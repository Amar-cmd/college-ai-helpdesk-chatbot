import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "./env";

const PROTECTED_PREFIXES = ["/chat", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const { supabaseUrl, supabaseKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const { data, error } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims && !error);

  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/login" && isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/chat";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}