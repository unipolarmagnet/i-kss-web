"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { getEffectiveSession } from "@/lib/session";

export async function submitPreferences(formData: FormData) {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role !== "student") throw new Error("Forbidden");
  if (!sess.effective.classId) {
    throw new Error("Nemáte priradenú triedu");
  }

  const ac = await prisma.assignmentClass.findFirst({
    where: { classId: sess.effective.classId },
    include: {
      assignment: {
        include: {
          list: {
            include: { topics: { select: { id: true, capacity: true } } },
          },
          results: {
            select: { studentId: true, topicId: true, phase: true },
          },
        },
      },
    },
  });
  if (!ac) throw new Error("Trieda nemá priradený topic list");
  const assignment = ac.assignment;

  // Determine current accepting phase
  const initialDistributed = assignment.results.some(
    (r) => r.phase === "initial",
  );
  const reopenDistributed = assignment.results.some(
    (r) => r.phase === "reopen",
  );

  let currentPhase: "initial" | "reopen";
  if (reopenDistributed) {
    throw new Error("Rozdelenie je dokončené, preferencie sa nedajú meniť");
  } else if (assignment.reopenedAt) {
    const myInitial = assignment.results.find(
      (r) =>
        r.studentId === sess.effective.id && r.phase === "initial",
    );
    if (myInitial?.topicId) {
      throw new Error(
        "Bola vám pridelená téma v 1. kole, 2. kola sa nezúčastňujete",
      );
    }
    currentPhase = "reopen";
  } else if (initialDistributed) {
    throw new Error(
      "Rozdelenie 1. kola už bolo spustené, preferencie sa nedajú meniť",
    );
  } else {
    currentPhase = "initial";
  }

  const r1 = Number(formData.get("rank1"));
  const r2 = Number(formData.get("rank2"));
  const r3 = Number(formData.get("rank3"));
  const picks = [r1, r2, r3];

  if (picks.some((p) => !p)) {
    throw new Error("Vyberte 3 témy");
  }
  if (new Set(picks).size < 3) {
    throw new Error("Témy musia byť rôzne");
  }

  const topicIdsInList = new Set(assignment.list.topics.map((t) => t.id));
  for (const tid of picks) {
    if (!topicIdsInList.has(tid)) {
      throw new Error("Neplatná téma v zozname");
    }
  }

  if (currentPhase === "reopen") {
    // Verify remaining capacity > 0 for each pick
    const used = new Map<number, number>();
    for (const r of assignment.results) {
      if (r.phase === "initial" && r.topicId !== null) {
        used.set(r.topicId, (used.get(r.topicId) ?? 0) + 1);
      }
    }
    for (const t of assignment.list.topics) {
      // Pre-fill 0 so missing keys still register
      if (!used.has(t.id)) used.set(t.id, 0);
    }
    for (const tid of picks) {
      const topic = assignment.list.topics.find((t) => t.id === tid);
      if (!topic) throw new Error("Téma neexistuje");
      const remaining = topic.capacity - (used.get(tid) ?? 0);
      if (remaining <= 0) {
        throw new Error(
          `Téma "${tid}" už nemá voľnú kapacitu pre 2. kolo`,
        );
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.preference.deleteMany({
      where: {
        studentId: sess.effective.id,
        assignmentId: assignment.id,
        phase: currentPhase,
      },
    });
    for (let i = 0; i < 3; i++) {
      await tx.preference.create({
        data: {
          studentId: sess.effective.id,
          assignmentId: assignment.id,
          rank: i + 1,
          topicId: picks[i],
          phase: currentPhase,
        },
      });
    }
  });

  await logAudit("preference.submit", {
    assignmentId: assignment.id,
    studentId: sess.effective.id,
    studentEmail: sess.effective.email,
    phase: currentPhase,
    picks,
  });

  redirect("/dashboard");
}
