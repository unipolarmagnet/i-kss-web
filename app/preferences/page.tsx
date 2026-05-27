import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectiveSession } from "@/lib/session";
import { submitPreferences } from "./actions";
import AppNav from "@/components/AppNav";

export default async function PreferencesPage() {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role !== "student") redirect("/admin");
  if (!sess.effective.classId) redirect("/classes");

  const studentId = sess.effective.id;
  const classId = sess.effective.classId;

  const ac = await prisma.assignmentClass.findFirst({
    where: { classId },
    include: {
      assignment: {
        include: {
          list: { include: { topics: { orderBy: { displayId: "asc" } } } },
          results: {
            select: { studentId: true, topicId: true, phase: true },
          },
        },
      },
      class: { select: { name: true } },
    },
  });

  if (!ac) redirect("/dashboard");
  const assignment = ac.assignment;

  const initialDistributed = assignment.results.some(
    (r) => r.phase === "initial",
  );
  const reopenDistributed = assignment.results.some(
    (r) => r.phase === "reopen",
  );

  let currentPhase: "initial" | "reopen" | "locked" = "initial";
  if (reopenDistributed) currentPhase = "locked";
  else if (assignment.reopenedAt) {
    const myInitial = assignment.results.find(
      (r) => r.studentId === studentId && r.phase === "initial",
    );
    if (myInitial?.topicId) currentPhase = "locked";
    else currentPhase = "reopen";
  } else if (initialDistributed) currentPhase = "locked";

  if (currentPhase === "locked") redirect("/dashboard");

  let availableTopics = assignment.list.topics;
  if (currentPhase === "reopen") {
    const used = new Map<number, number>();
    for (const r of assignment.results) {
      if (r.phase === "initial" && r.topicId !== null) {
        used.set(r.topicId, (used.get(r.topicId) ?? 0) + 1);
      }
    }
    availableTopics = assignment.list.topics.filter(
      (t) => t.capacity - (used.get(t.id) ?? 0) > 0,
    );
  }

  const existing = await prisma.preference.findMany({
    where: { studentId, assignmentId: assignment.id, phase: currentPhase },
    orderBy: { rank: "asc" },
  });
  const existingByRank = new Map(existing.map((p) => [p.rank, p.topicId]));

  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 680 }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <h1 className="h4 fw-semibold mb-1">Preferencie tém</h1>
            <p className="text-muted">
              Trieda: <strong>{ac.class.name}</strong> · Topic list:{" "}
              <strong>{assignment.list.name}</strong>
              {currentPhase === "reopen" && (
                <>
                  {" "}
                  <span className="badge text-bg-info">2. kolo (re-open)</span>
                </>
              )}
            </p>

            {availableTopics.length < 3 ? (
              <div className="alert alert-warning mb-0">
                V tomto liste je menej ako 3 dostupných tém (
                {availableTopics.length}). Kontaktujte admina.
              </div>
            ) : (
              <>
                <p className="text-muted small">
                  Vyberte si 3 rôzne témy a označte ich prioritu od 1
                  (najvyššia) po 3. Algoritmus skúsi prideliť každého na 1.
                  prioritu, pri konflikte uniformne náhodne; nepriradení
                  postúpia k 2. priorite, a tak ďalej.
                  {currentPhase === "reopen" && (
                    <> V 2. kole sú zobrazené iba témy s voľnou kapacitou.</>
                  )}
                </p>

                <form action={submitPreferences} className="mt-3">
                  {[1, 2, 3].map((rank) => (
                    <div className="mb-3" key={rank}>
                      <label
                        htmlFor={`rank${rank}`}
                        className="form-label fw-medium"
                      >
                        Priorita {rank}
                        {rank === 1 ? " (najvyššia)" : ""}
                      </label>
                      <select
                        id={`rank${rank}`}
                        name={`rank${rank}`}
                        required
                        className="form-select"
                        defaultValue={String(existingByRank.get(rank) ?? "")}
                      >
                        <option value="" disabled>
                          — vyberte tému —
                        </option>
                        {availableTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.displayId}. {t.name} (kapacita {t.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-primary">
                      {existing.length > 0
                        ? "Aktualizovať preferencie"
                        : "Uložiť preferencie"}
                    </button>
                    <Link href="/dashboard" className="btn btn-outline-secondary">
                      Späť
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
