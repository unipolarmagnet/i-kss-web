import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";

const ALLOWED_HD = process.env.ALLOWED_HD ?? "stuba.sk";

function adminEmailSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;
      if (!profile?.email) return false;
      if (profile.email_verified !== true) return false;

      const hd = (profile as { hd?: string }).hd;
      if (hd !== ALLOWED_HD) return false;

      const email = profile.email.toLowerCase();
      if (!email.endsWith(`@${ALLOWED_HD}`)) return false;

      const role = adminEmailSet().has(email) ? "admin" : "student";

      await prisma.user.upsert({
        where: { email },
        update: {
          name: user?.name ?? undefined,
          image: user?.image ?? undefined,
          role,
        },
        create: {
          email,
          name: user?.name ?? null,
          image: user?.image ?? null,
          role,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (!email) return token;
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        token.userId = dbUser.id;
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.classId = dbUser.classId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? session.user.id;
        session.user.role = (token.role as "admin" | "student") ?? "student";
        session.user.classId = (token.classId as number | null) ?? null;
      }
      return session;
    },
  },
});
