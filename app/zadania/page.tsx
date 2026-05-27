import AppNav from "@/components/AppNav";
import Link from "next/link";

const ASSIGNMENTS = [
  {
    id: 1,
    title: "Jednotkové testovanie a pokrytie kódu",
    desc: "JUnit 5, vzor Arrange–Act–Assert, meranie pokrytia (JaCoCo).",
    icon: "bi-check2-square",
  },
  {
    id: 2,
    title: "Statická analýza a kontrola kvality",
    desc: "SpotBugs / PMD / Checkstyle, code smells, cyklomatická zložitosť.",
    icon: "bi-search",
  },
  {
    id: 3,
    title: "Automatizované testovanie a CI brány",
    desc: "GitHub Actions, regresné testy, kvalitatívna brána na pokrytie.",
    icon: "bi-diagram-3",
  },
];

export default function ZadaniaIndex() {
  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 860 }}>
        <h1 className="fw-bold mb-1">Zadania</h1>
        <p className="text-muted mb-4">
          Tri inžinierske zadania predmetu Kvalita softvérových systémov. Každé
          má rovnakú formu: Obsah → Cieľ → Úloha → Jadro → Vstup/Výstup →
          Hodnotenie → Zdroje.
        </p>

        <div className="row g-3">
          {ASSIGNMENTS.map((a) => (
            <div className="col-12 col-md-4" key={a.id}>
              <Link
                href={`/zadania/${a.id}`}
                className="text-decoration-none text-reset"
              >
                <div className="card h-100 shadow-sm border">
                  <div className="card-body">
                    <div
                      className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded mb-3"
                      style={{ width: 46, height: 46 }}
                    >
                      <i className={`bi ${a.icon} fs-5`} />
                    </div>
                    <div className="text-muted small text-uppercase">
                      Zadanie {a.id}
                    </div>
                    <h2 className="h6 fw-semibold">{a.title}</h2>
                    <p className="text-muted small mb-0">{a.desc}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
