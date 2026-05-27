"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { getEffectiveSession } from "@/lib/session";

export async function joinClass(formData: FormData) {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role !== "student") {
    throw new Error("Forbidden");
  }
  if (sess.effective.classId) {
    redirect("/dashboard");
  }

  const classId = Number(formData.get("classId"));
  if (!classId) return;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new Error("Trieda neexistuje");
  if (!cls.enrollmentOpen) {
    throw new Error("Prihlasovanie do tejto triedy je uzavreté");
  }

  await prisma.user.update({
    where: { id: sess.effective.id },
    data: { classId },
  });

  await logAudit("class.join", {
    classId,
    className: cls.name,
    studentId: sess.effective.id,
    studentEmail: sess.effective.email,
  });

  redirect("/dashboard");
}
