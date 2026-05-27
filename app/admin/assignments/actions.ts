"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { runDistribution } from "@/lib/distribution";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createAssignment(formData: FormData) {
  await requireAdmin();

  const listId = Number(formData.get("listId"));
  const classIds = formData
    .getAll("classIds")
    .map((v) => Number(v))
    .filter(Boolean);
  const mode =
    formData.get("mode") === "separate" ? "separate" : "shared";

  if (!listId) throw new Error("Vyberte topic list");
  if (classIds.length === 0) throw new Error("Vyberte aspoň jednu triedu");

  const list = await prisma.topicList.findUnique({
    where: { id: listId },
    include: { _count: { select: { topics: true } } },
  });
  if (!list) throw new Error("Topic list neexistuje");
  if (list._count.topics === 0) {
    throw new Error("Topic list nemá žiadne témy — najprv ich pridajte");
  }

  const existing = await prisma.assignmentClass.findMany({
    where: { classId: { in: classIds } },
    include: { class: { select: { name: true } } },
  });
  if (existing.length > 0) {
    const names = existing.map((e) => e.class.name).join(", ");
    throw new Error(
      `Tieto triedy už majú aktívne priradenie: ${names}. Zrušte ho najprv.`,
    );
  }

  if (mode === "shared") {
    const a = await prisma.assignment.create({
      data: {
        listId,
        mode: "shared",
        classes: {
          create: classIds.map((classId) => ({ classId })),
        },
      },
    });
    await logAudit("assignment.create", {
      assignmentId: a.id,
      listId,
      listName: list.name,
      mode: "shared",
      classIds,
    });
  } else {
    for (const classId of classIds) {
      const a = await prisma.assignment.create({
        data: {
          listId,
          mode: "separate",
          classes: { create: { classId } },
        },
      });
      await logAudit("assignment.create", {
        assignmentId: a.id,
        listId,
        listName: list.name,
        mode: "separate",
        classIds: [classId],
      });
    }
  }

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/topics");
  redirect("/admin/assignments");
}

export async function deleteAssignment(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: {
      list: { select: { name: true } },
      classes: { select: { classId: true } },
      _count: { select: { preferences: true, results: true } },
    },
  });
  if (!a) return;
  await prisma.assignment.delete({ where: { id } });
  await logAudit("assignment.delete", {
    assignmentId: id,
    listId: a.listId,
    listName: a.list.name,
    mode: a.mode,
    classIds: a.classes.map((c) => c.classId),
    preferencesAtDelete: a._count.preferences,
    resultsAtDelete: a._count.results,
  });
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/topics");
}

export async function runAssignmentDistribution(formData: FormData) {
  await requireAdmin();
  const assignmentId = Number(formData.get("assignmentId"));
  const phase =
    formData.get("phase") === "reopen" ? "reopen" : "initial";
  if (!assignmentId) return;

  const existingCount = await prisma.assignmentResult.count({
    where: { assignmentId, phase },
  });
  if (existingCount > 0) {
    throw new Error(
      `Rozdelenie pre fázu "${phase}" už bolo spustené. Najprv ho resetnite.`,
    );
  }

  if (phase === "reopen") {
    const a = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!a?.reopenedAt) {
      throw new Error(
        "Druhé kolo nie je otvorené. Najprv stlačte 'Otvoriť 2. kolo'.",
      );
    }
  }

  const result = await runDistribution(assignmentId, phase);

  for (const r of result.perRound) {
    await logAudit("assignment.round_topic", {
      assignmentId,
      phase,
      round: r.round,
      topicId: r.topicId,
      topicName: r.topicName,
      capacity: r.capacity,
      remainingBefore: r.remainingBefore,
      studentsInRunning: r.studentsInRunning.map((s) => s.email),
      chosen: r.chosen.map((s) => s.email),
      notChosen: r.notChosen.map((s) => s.email),
      ...(r.reason ? { reason: r.reason } : {}),
    });
  }
  await logAudit("assignment.distribute", {
    assignmentId,
    phase,
    studentsTotal: result.studentsTotal,
    studentsWithPrefs: result.studentsWithPrefs,
    assigned: result.assigned,
    unassigned: result.unassigned,
  });

  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
}

export async function reopenAssignment(formData: FormData) {
  await requireAdmin();
  const assignmentId = Number(formData.get("assignmentId"));
  if (!assignmentId) return;

  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!a) throw new Error("Priradenie neexistuje");
  if (a.reopenedAt) throw new Error("Druhé kolo už bolo otvorené");

  const initialResults = await prisma.assignmentResult.count({
    where: { assignmentId, phase: "initial" },
  });
  if (initialResults === 0) {
    throw new Error("Najprv spustite rozdelenie 1. kola.");
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { reopenedAt: new Date() },
  });

  await logAudit("assignment.reopen", { assignmentId });

  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
}

export async function closeReopen(formData: FormData) {
  await requireAdmin();
  const assignmentId = Number(formData.get("assignmentId"));
  if (!assignmentId) return;

  await prisma.$transaction([
    prisma.preference.deleteMany({
      where: { assignmentId, phase: "reopen" },
    }),
    prisma.assignmentResult.deleteMany({
      where: { assignmentId, phase: "reopen" },
    }),
    prisma.assignment.update({
      where: { id: assignmentId },
      data: { reopenedAt: null },
    }),
  ]);

  await logAudit("assignment.close_reopen", { assignmentId });
  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
}

export async function resetDistribution(formData: FormData) {
  await requireAdmin();
  const assignmentId = Number(formData.get("assignmentId"));
  const phase =
    formData.get("phase") === "reopen" ? "reopen" : "initial";
  if (!assignmentId) return;

  if (phase === "initial") {
    // Resetting initial cascades: also clear reopen results + reopenedAt
    await prisma.$transaction([
      prisma.assignmentResult.deleteMany({
        where: { assignmentId, phase: "reopen" },
      }),
      prisma.assignmentResult.deleteMany({
        where: { assignmentId, phase: "initial" },
      }),
      prisma.preference.deleteMany({
        where: { assignmentId, phase: "reopen" },
      }),
      prisma.assignment.update({
        where: { id: assignmentId },
        data: { reopenedAt: null },
      }),
    ]);
  } else {
    await prisma.assignmentResult.deleteMany({
      where: { assignmentId, phase: "reopen" },
    });
  }

  await logAudit("assignment.reset_distribution", {
    assignmentId,
    phase,
  });

  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/assignments");
  revalidatePath("/dashboard");
}
