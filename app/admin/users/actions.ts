"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { IMPERSONATE_COOKIE } from "@/lib/session";

async function requireRealAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function startImpersonation(formData: FormData) {
  const session = await requireRealAdmin();
  const targetId = String(formData.get("targetId"));
  if (!targetId) return;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
  });
  if (!target) throw new Error("Cieľový používateľ neexistuje");
  if (target.role === "admin") {
    throw new Error("Iného admina nemožno impersonovať");
  }
  if (target.id === session.user!.id) {
    throw new Error("Nemôžete impersonovať seba");
  }

  const c = await cookies();
  c.set(IMPERSONATE_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  await logAudit("admin.impersonate_start", {
    targetId: target.id,
    targetEmail: target.email,
    targetName: target.name,
  });

  redirect("/dashboard");
}

export async function stopImpersonation() {
  await requireRealAdmin();
  const c = await cookies();
  const wasId = c.get(IMPERSONATE_COOKIE)?.value;
  c.delete(IMPERSONATE_COOKIE);
  if (wasId) {
    await logAudit("admin.impersonate_stop", { wasTargetId: wasId });
  }
  redirect("/admin");
}
