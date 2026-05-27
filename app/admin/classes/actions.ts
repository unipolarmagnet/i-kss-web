"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createClass(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const cls = await prisma.class.create({ data: { name } });
  await logAudit("class.create", { classId: cls.id, name });
  revalidatePath("/admin/classes");
}

export async function renameClass(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const before = await prisma.class.findUnique({ where: { id } });
  if (!before || before.name === name) return;
  await prisma.class.update({ where: { id }, data: { name } });
  await logAudit("class.rename", {
    classId: id,
    from: before.name,
    to: name,
  });
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}`);
}

export async function toggleEnrollment(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const open = formData.get("open") === "true";
  if (!id) return;
  await prisma.class.update({
    where: { id },
    data: { enrollmentOpen: open },
  });
  await logAudit("class.enrollment_set", { classId: id, open });
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}`);
}

export async function deleteClass(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, assignmentClasses: true } },
    },
  });
  if (!cls) return;
  if (cls._count.assignmentClasses > 0) {
    throw new Error(
      "Trieda je súčasťou priradenia tém — najprv ho zrušte v sekcii Priradenia.",
    );
  }
  await prisma.class.delete({ where: { id } });
  await logAudit("class.delete", {
    classId: id,
    name: cls.name,
    membersAtDelete: cls._count.members,
  });
  revalidatePath("/admin/classes");
}

export async function assignStudentToClass(formData: FormData) {
  await requireAdmin();
  const classId = Number(formData.get("classId"));
  const studentId = String(formData.get("studentId"));
  if (!classId || !studentId) return;

  const [cls, student] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.user.findUnique({ where: { id: studentId } }),
  ]);
  if (!cls) throw new Error("Trieda neexistuje");
  if (!student) throw new Error("Študent neexistuje");
  if (student.role !== "student") {
    throw new Error("Tento používateľ nie je študent");
  }
  if (student.classId) {
    throw new Error("Študent už je v triede — najprv ho vykopnite");
  }

  await prisma.user.update({
    where: { id: studentId },
    data: { classId },
  });

  await logAudit("class.admin_assign", {
    classId,
    className: cls.name,
    studentId,
    studentEmail: student.email,
  });

  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/admin/classes");
}

export async function kickStudent(formData: FormData) {
  await requireAdmin();
  const classId = Number(formData.get("classId"));
  const studentId = String(formData.get("studentId"));
  if (!classId || !studentId) return;
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });
  if (!student || student.classId !== classId) return;
  await prisma.user.update({
    where: { id: studentId },
    data: { classId: null },
  });
  await logAudit("class.kick", {
    classId,
    studentId,
    studentEmail: student.email,
  });
  revalidatePath(`/admin/classes/${classId}`);
}
