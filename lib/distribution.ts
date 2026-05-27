import { prisma } from "@/lib/prisma";

export type RoundLog = {
  round: number;
  topicId: number;
  topicName: string;
  capacity: number;
  remainingBefore: number;
  studentsInRunning: { id: string; email: string; name: string | null }[];
  chosen: { id: string; email: string }[];
  notChosen: { id: string; email: string }[];
  reason?: string;
};

export type DistributionResult = {
  assignmentId: number;
  phase: "initial" | "reopen";
  studentsTotal: number;
  studentsWithPrefs: number;
  assigned: number;
  unassigned: number;
  perRound: RoundLog[];
};

/**
 * Run the 3-round preference-based topic distribution for one assignment.
 *
 * - For each round r in [1, 2, 3]:
 *   - Group unassigned students by their r-th preference topic.
 *   - For each topic: if candidates <= remaining capacity, all get it.
 *     Otherwise, uniformly-random pick `capacity` winners (Fisher–Yates).
 *   - Update remaining capacity per topic.
 * - Persist results: one AssignmentResult per eligible student, topicId=null
 *   if unassigned, round=0 if never assigned in this phase.
 * - Caller is responsible for audit logging (round details returned in `perRound`).
 *
 * Phase = "reopen" excludes students already assigned in initial phase, and
 * computes remaining capacity as (capacity - initial-assigned count) per topic.
 */
export async function runDistribution(
  assignmentId: number,
  phase: "initial" | "reopen",
): Promise<DistributionResult> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      list: { include: { topics: { orderBy: { displayId: "asc" } } } },
      classes: { select: { classId: true } },
      results: { select: { studentId: true, topicId: true, phase: true } },
    },
  });
  if (!assignment) throw new Error("Priradenie neexistuje");

  const classIds = assignment.classes.map((c) => c.classId);
  const allStudentRows = await prisma.user.findMany({
    where: { classId: { in: classIds }, role: "student" },
    select: { id: true, email: true, name: true },
  });
  const studentInfo = new Map<
    string,
    { email: string; name: string | null }
  >();
  for (const s of allStudentRows) {
    studentInfo.set(s.id, { email: s.email, name: s.name });
  }

  let eligibleIds: string[];
  if (phase === "initial") {
    eligibleIds = allStudentRows.map((s) => s.id);
  } else {
    const initialAssigned = new Set(
      assignment.results
        .filter((r) => r.phase === "initial" && r.topicId !== null)
        .map((r) => r.studentId),
    );
    eligibleIds = allStudentRows
      .map((s) => s.id)
      .filter((id) => !initialAssigned.has(id));
  }

  const prefs = await prisma.preference.findMany({
    where: {
      assignmentId,
      phase,
      studentId: { in: eligibleIds },
    },
    orderBy: [{ studentId: "asc" }, { rank: "asc" }],
  });

  // studentId -> rank(1|2|3) -> topicId
  const prefsByStudent = new Map<string, Map<number, number>>();
  for (const p of prefs) {
    let m = prefsByStudent.get(p.studentId);
    if (!m) {
      m = new Map();
      prefsByStudent.set(p.studentId, m);
    }
    m.set(p.rank, p.topicId);
  }

  // Initial remaining capacity
  const topicById = new Map(
    assignment.list.topics.map((t) => [t.id, t]),
  );
  const remainingCapacity = new Map<number, number>();
  for (const t of assignment.list.topics) {
    if (phase === "initial") {
      remainingCapacity.set(t.id, t.capacity);
    } else {
      const used = assignment.results.filter(
        (r) => r.phase === "initial" && r.topicId === t.id,
      ).length;
      remainingCapacity.set(t.id, Math.max(0, t.capacity - used));
    }
  }

  const assigned = new Map<string, { topicId: number; round: number }>();
  const unassigned = new Set(prefsByStudent.keys());
  const perRound: RoundLog[] = [];

  for (const round of [1, 2, 3] as const) {
    const candidates = new Map<number, string[]>();
    for (const studentId of unassigned) {
      const topicId = prefsByStudent.get(studentId)?.get(round);
      if (topicId === undefined) continue;
      let list = candidates.get(topicId);
      if (!list) {
        list = [];
        candidates.set(topicId, list);
      }
      list.push(studentId);
    }

    for (const [topicId, studentIds] of candidates) {
      const topic = topicById.get(topicId);
      const cap = remainingCapacity.get(topicId) ?? 0;

      const log: RoundLog = {
        round,
        topicId,
        topicName: topic?.name ?? `?${topicId}`,
        capacity: topic?.capacity ?? 0,
        remainingBefore: cap,
        studentsInRunning: studentIds.map((id) => ({
          id,
          email: studentInfo.get(id)?.email ?? "",
          name: studentInfo.get(id)?.name ?? null,
        })),
        chosen: [],
        notChosen: [],
      };

      if (cap <= 0) {
        log.reason = "no_capacity";
        log.notChosen = studentIds.map((id) => ({
          id,
          email: studentInfo.get(id)?.email ?? "",
        }));
        perRound.push(log);
        continue;
      }

      let chosenIds: string[];
      if (studentIds.length <= cap) {
        chosenIds = [...studentIds];
      } else {
        // Fisher-Yates shuffle, take first `cap`
        const shuffled = [...studentIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        chosenIds = shuffled.slice(0, cap);
      }

      const chosenSet = new Set(chosenIds);
      log.chosen = chosenIds.map((id) => ({
        id,
        email: studentInfo.get(id)?.email ?? "",
      }));
      log.notChosen = studentIds
        .filter((id) => !chosenSet.has(id))
        .map((id) => ({ id, email: studentInfo.get(id)?.email ?? "" }));
      perRound.push(log);

      for (const sid of chosenIds) {
        assigned.set(sid, { topicId, round });
        unassigned.delete(sid);
      }
      remainingCapacity.set(topicId, cap - chosenIds.length);
    }
  }

  // Persist: one result row per eligible student (assigned or not).
  await prisma.$transaction(async (tx) => {
    await tx.assignmentResult.deleteMany({
      where: { assignmentId, phase },
    });
    for (const studentId of eligibleIds) {
      const r = assigned.get(studentId);
      await tx.assignmentResult.create({
        data: {
          assignmentId,
          studentId,
          topicId: r?.topicId ?? null,
          round: r?.round ?? 0,
          phase,
        },
      });
    }
  });

  return {
    assignmentId,
    phase,
    studentsTotal: eligibleIds.length,
    studentsWithPrefs: prefsByStudent.size,
    assigned: assigned.size,
    unassigned: eligibleIds.length - assigned.size,
    perRound,
  };
}
