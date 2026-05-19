"use server";

import { headers } from "next/headers";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth/dal";
import { extractClientIp, logAccess } from "@/lib/auth/log";

export async function logout() {
  const user = await getCurrentUser();
  if (user) {
    const headersList = await headers();
    await logAccess({
      userId: user.id,
      action: "logout",
      ip: extractClientIp(headersList),
      userAgent: headersList.get("user-agent"),
    });
  }
  await signOut({ redirectTo: "/login" });
}
