import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectiveSession } from "@/lib/session";
import AppNav from "@/components/AppNav";

export default async function StudentTopicsPage() {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role !== "student") redirect("/admin");
  if (!sess.effective.classId) redirect("/classes");

  const ac = await prisma.assignmentClass.findFirst({
    where: { classId: sess.effective.classId },
    include: {
      assignment: {
        include: {
          list: { include: { topics: { orderBy: { displayId: "asc" } } } },
        },
      },
      class: { select: { name: true } },
    },
  });

  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 820 }}>
        <h1 className="h4 fw-semibold mb-3">Témy</h1>

        {!ac ? (
          <div className="alert alert-light border text-muted">
            Vaša trieda zatiaľ nemá priradený zoznam tém. Čakajte, kým ho admin
            nastaví.
          </div>
        ) : (
          <>
            <p className="text-muted">
              Zoznam tém <strong>{ac.assignment.list.name}</strong> pre triedu{" "}
              <strong>{ac.class.name}</strong>.
            </p>

            <div className="table-responsive mb-3">
              <table className="table table-hover align-middle bg-white">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th>Téma</th>
                    <th>Popis</th>
                    <th style={{ width: 100 }}>Kapacita</th>
                  </tr>
                </thead>
                <tbody>
                  {ac.assignment.list.topics.map((t) => (
                    <tr key={t.id}>
                      <td>{t.displayId}</td>
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td>{t.description || "—"}</td>
                      <td>{t.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link href="/preferences" className="btn btn-primary">
              Zadať / upraviť preferencie
            </Link>
          </>
        )}
      </main>
    </>
  );
}
