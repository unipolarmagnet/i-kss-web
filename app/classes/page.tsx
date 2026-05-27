import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { joinClass } from "./actions";
import { getEffectiveSession } from "@/lib/session";
import AppNav from "@/components/AppNav";

function pluralStudent(n: number): string {
  if (n === 1) return "študent";
  if (n >= 2 && n <= 4) return "študenti";
  return "študentov";
}

export default async function ClassPickerPage() {
  const sess = await getEffectiveSession();
  if (!sess) redirect("/auth/signin");
  if (sess.effective.role === "admin") redirect("/admin");
  if (sess.effective.classId) redirect("/dashboard");

  const classes = await prisma.class.findMany({
    where: { enrollmentOpen: true },
    orderBy: { id: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 680 }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <h1 className="h4 fw-semibold mb-2">Vyberte si triedu</h1>
            <p className="text-muted">
              Prihlásiť sa môžete iba do jednej triedy. Ak si vyberiete zle,
              admin vás môže vykopnúť a budete sa môcť pridať do inej.
            </p>

            {classes.length === 0 ? (
              <div className="alert alert-light border text-muted mb-0">
                Žiadne otvorené triedy zatiaľ nie sú dostupné. Skúste neskôr.
              </div>
            ) : (
              <div className="list-group">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="list-group-item d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <div className="fw-semibold">{cls.name}</div>
                      <div className="text-muted small">
                        {cls._count.members} {pluralStudent(cls._count.members)}
                      </div>
                    </div>
                    <form action={joinClass} className="m-0">
                      <input type="hidden" name="classId" value={cls.id} />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Pridať sa
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
