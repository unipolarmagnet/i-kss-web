import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectiveSession } from "@/lib/session";
import AppNav from "@/components/AppNav";

type Phase =
  | "no_assignment"
  | "initial_collecting"
  | "initial_distributed"
  | "reopen_collecting"
  | "reopen_distributed";

export default async function Dashboard() {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role === "admin") redirect("/admin");
  if (!sess.effective.classId) redirect("/classes");

  const studentId = sess.effective.id;
  const classId = sess.effective.classId;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) redirect("/classes");

  const ac = await prisma.assignmentClass.findFirst({
    where: { classId },
    include: {
      assignment: {
        include: {
          list: { include: { topics: { orderBy: { displayId: "asc" } } } },
        },
      },
    },
  });
  const assignment = ac?.assignment ?? null;

  let phase: Phase = "no_assignment";
  let myInitialPrefs: { rank: number; topicId: number }[] = [];
  let myReopenPrefs: { rank: number; topicId: number }[] = [];
  let myInitialResult: { topicId: number | null; round: number } | null = null;
  let myReopenResult: { topicId: number | null; round: number } | null = null;
  const topicMap = new Map<number, { displayId: number; name: string }>();

  if (assignment) {
    for (const t of assignment.list.topics) {
      topicMap.set(t.id, { displayId: t.displayId, name: t.name });
    }

    const [iPrefs, rPrefs, iRes, rRes, iResultsCount, rResultsCount] =
      await Promise.all([
        prisma.preference.findMany({
          where: { studentId, assignmentId: assignment.id, phase: "initial" },
          orderBy: { rank: "asc" },
        }),
        prisma.preference.findMany({
          where: { studentId, assignmentId: assignment.id, phase: "reopen" },
          orderBy: { rank: "asc" },
        }),
        prisma.assignmentResult.findUnique({
          where: {
            assignmentId_studentId_phase: {
              assignmentId: assignment.id,
              studentId,
              phase: "initial",
            },
          },
        }),
        prisma.assignmentResult.findUnique({
          where: {
            assignmentId_studentId_phase: {
              assignmentId: assignment.id,
              studentId,
              phase: "reopen",
            },
          },
        }),
        prisma.assignmentResult.count({
          where: { assignmentId: assignment.id, phase: "initial" },
        }),
        prisma.assignmentResult.count({
          where: { assignmentId: assignment.id, phase: "reopen" },
        }),
      ]);

    myInitialPrefs = iPrefs.map((p) => ({ rank: p.rank, topicId: p.topicId }));
    myReopenPrefs = rPrefs.map((p) => ({ rank: p.rank, topicId: p.topicId }));
    myInitialResult = iRes
      ? { topicId: iRes.topicId, round: iRes.round }
      : null;
    myReopenResult = rRes ? { topicId: rRes.topicId, round: rRes.round } : null;

    if (rResultsCount > 0) phase = "reopen_distributed";
    else if (assignment.reopenedAt) phase = "reopen_collecting";
    else if (iResultsCount > 0) phase = "initial_distributed";
    else phase = "initial_collecting";
  }

  const renderTopic = (topicId: number) => {
    const t = topicMap.get(topicId);
    return t ? `${t.displayId}. ${t.name}` : "?";
  };

  const phaseBadge = (() => {
    switch (phase) {
      case "initial_collecting":
        return "Zbiera preferencie";
      case "initial_distributed":
        return "Po 1. kole";
      case "reopen_collecting":
        return "2. kolo otvorené";
      case "reopen_distributed":
        return "Dokončené";
      default:
        return "—";
    }
  })();

  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 760 }}>
        <div className="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-3">
          <h1 className="h4 fw-semibold mb-0">Moja téma</h1>
          <span className="text-muted">
            Trieda: <strong>{cls.name}</strong>
          </span>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded border">
              <div
                className="avatar"
                style={
                  sess.effective.image
                    ? { backgroundImage: `url(${sess.effective.image})` }
                    : undefined
                }
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="fw-medium text-truncate">
                  {sess.effective.name ?? "Používateľ"}
                </div>
                <div className="text-muted small text-truncate">
                  {sess.effective.email}
                </div>
              </div>
            </div>

            <h2 className="h6 fw-semibold text-uppercase text-muted mb-3">
              Aktuálny stav
            </h2>

            {phase === "no_assignment" && (
              <div className="alert alert-light border text-muted mb-0">
                Vaša trieda zatiaľ nemá priradený topic list. Čakajte, kým admin
                nastaví priradenie.
              </div>
            )}

            {phase !== "no_assignment" && assignment && (
              <>
                <div className="row g-2 mb-3">
                  <div className="col-sm-6">
                    <div className="border rounded p-2 px-3 h-100">
                      <div className="text-muted small text-uppercase">
                        Topic list
                      </div>
                      <div className="fw-medium">{assignment.list.name}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded p-2 px-3 h-100">
                      <div className="text-muted small text-uppercase">
                        Aktuálne kolo
                      </div>
                      <span className="badge text-bg-info">{phaseBadge}</span>
                    </div>
                  </div>
                </div>

                {phase === "initial_collecting" && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h3 className="h6 fw-semibold">
                        Vaše preferencie (1. kolo)
                      </h3>
                      {myInitialPrefs.length === 0 ? (
                        <>
                          <p className="text-muted small">
                            Zatiaľ ste nepodali preferencie. Vyberte 3 témy s
                            prioritami 1-3.
                          </p>
                          <Link href="/preferences" className="btn btn-primary">
                            Zadať preferencie
                          </Link>
                        </>
                      ) : (
                        <>
                          <ol className="list-group list-group-numbered mb-3">
                            {myInitialPrefs.map((p) => (
                              <li className="list-group-item" key={p.rank}>
                                {renderTopic(p.topicId)}
                              </li>
                            ))}
                          </ol>
                          <Link
                            href="/preferences"
                            className="btn btn-outline-secondary"
                          >
                            Upraviť preferencie
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {(phase === "initial_distributed" ||
                  phase === "reopen_collecting" ||
                  phase === "reopen_distributed") && (
                  <div className="mb-3">
                    <h3 className="h6 fw-semibold">Výsledok 1. kola</h3>
                    {myInitialResult?.topicId ? (
                      <div className="alert alert-success mb-0">
                        <div className="small text-uppercase">
                          Bola vám pridelená téma
                        </div>
                        <div className="fs-5 fw-semibold">
                          {renderTopic(myInitialResult.topicId)}
                        </div>
                        <div className="small">
                          Vaša {myInitialResult.round}. priorita
                        </div>
                      </div>
                    ) : myInitialResult ? (
                      <div className="alert alert-secondary mb-0">
                        V 1. kole ste nezískali žiadnu tému.
                      </div>
                    ) : (
                      <p className="text-muted small mb-0">
                        Nepodali ste preferencie pre 1. kolo.
                      </p>
                    )}
                  </div>
                )}

                {phase === "reopen_collecting" && !myInitialResult?.topicId && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h3 className="h6 fw-semibold">2. kolo (re-open)</h3>
                      <p className="small">
                        2. kolo je otvorené pre študentov bez pridelenej témy.
                        Môžete podať nové preferencie zo zvyšných tém.
                      </p>
                      {myReopenPrefs.length === 0 ? (
                        <Link href="/preferences" className="btn btn-primary">
                          Zadať preferencie pre 2. kolo
                        </Link>
                      ) : (
                        <>
                          <ol className="list-group list-group-numbered mb-3">
                            {myReopenPrefs.map((p) => (
                              <li className="list-group-item" key={p.rank}>
                                {renderTopic(p.topicId)}
                              </li>
                            ))}
                          </ol>
                          <Link
                            href="/preferences"
                            className="btn btn-outline-secondary"
                          >
                            Upraviť
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {phase === "reopen_collecting" && myInitialResult?.topicId && (
                  <p className="text-muted small">
                    Keďže ste v 1. kole získali tému, 2. kola sa nezúčastňujete.
                  </p>
                )}

                {phase === "reopen_distributed" && (
                  <div className="mb-3">
                    <h3 className="h6 fw-semibold">Výsledok 2. kola</h3>
                    {myInitialResult?.topicId ? (
                      <p className="text-muted small mb-0">
                        2. kola ste sa nezúčastnili (téma získaná v 1. kole).
                      </p>
                    ) : myReopenResult?.topicId ? (
                      <div className="alert alert-success mb-0">
                        <div className="small text-uppercase">
                          V 2. kole vám bola pridelená téma
                        </div>
                        <div className="fs-5 fw-semibold">
                          {renderTopic(myReopenResult.topicId)}
                        </div>
                        <div className="small">
                          Vaša {myReopenResult.round}. priorita v 2. kole
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-danger mb-0">
                        Žiaľ, ani v 2. kole ste nezískali žiadnu tému.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
