import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { extractClientIp, logAccess } from "@/lib/auth/log";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const TWELVE_HOURS_SECONDS = 12 * 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: TWELVE_HOURS_SECONDS,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const ip = extractClientIp(request.headers);
        const userAgent = request.headers.get("user-agent");

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = rows[0];
        if (!user || !user.actif) {
          await logAccess({
            userId: user?.id ?? null,
            action: "login_failed",
            ip,
            userAgent,
            details: {
              email,
              reason: !user ? "user_not_found" : "inactive",
            },
          });
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await logAccess({
            userId: user.id,
            action: "login_failed",
            ip,
            userAgent,
            details: { email, reason: "wrong_password" },
          });
          return null;
        }

        await logAccess({
          userId: user.id,
          action: "login",
          ip,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
