import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function TopicListPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listId = Number(id);
  if (!listId) notFound();

  const list = await prisma.topicList.findUnique({
    where: { id: listId },
    include: { topics: { orderBy: { displayId: "asc" } } },
  });
  if (!list) notFound();

  const totalCapacity = list.topics.reduce((s, t) => s + t.capacity, 0);

  return (
    <div className="container py-4 bg-white" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center gap-3 mb-4 no-print">
        <PrintButton />
        <span className="text-muted small">
          Použite tlačidlo (alebo Ctrl+P) a v dialógu zvoľte „Uložiť ako PDF".
        </span>
      </div>

      <div className="d-flex justify-content-between align-items-start border-bottom border-dark border-2 pb-2 mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0">{list.name}</h1>
          <div className="text-muted small">
            Kvalita softvérových systémov · FEI STU
          </div>
        </div>
        <div className="text-muted small">
          {new Date().toLocaleDateString("sk-SK")}
        </div>
      </div>

      {list.topics.length === 0 ? (
        <p className="text-muted fst-italic">
          V tomto liste nie sú žiadne témy.
        </p>
      ) : (
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Téma</th>
              <th>Popis</th>
              <th style={{ width: 90 }}>Kapacita</th>
            </tr>
          </thead>
          <tbody>
            {list.topics.map((t) => (
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
      )}

      <div className="text-end text-muted small border-top pt-2 mt-3">
        Celkom {list.topics.length} tém · celková kapacita {totalCapacity}{" "}
        miest
      </div>
    </div>
  );
}
