import Link from "next/link";

const TILES = [
  {
    href: "/admin/classes",
    title: "Triedy",
    text: "Vytváranie, premenovanie, uzavretie prihlasovania a manažment študentov.",
  },
  {
    href: "/admin/topics",
    title: "Témy",
    text: "Topic listy s názvom, popisom a kapacitou. Export do PDF cez tlačový náhľad.",
  },
  {
    href: "/admin/assignments",
    title: "Priradenia",
    text: "Spojenie topic listu s triedami (zdieľané/samostatné) a spustenie rozdelenia.",
  },
  {
    href: "/admin/users",
    title: "Používatelia",
    text: "Prehľad adminov a študentov, impersonácia pre testovanie študentského flow.",
  },
];

export default function AdminHome() {
  return (
    <>
      <h1 className="h4 fw-semibold mb-1">Administrátorský panel</h1>
      <p className="text-muted">Vyberte oblasť, ktorú chcete spravovať.</p>

      <div className="row g-3">
        {TILES.map((t) => (
          <div className="col-12 col-md-6 col-lg-3" key={t.href}>
            <Link href={t.href} className="text-decoration-none text-reset">
              <div className="card h-100 shadow-sm border">
                <div className="card-body">
                  <h2 className="h6 fw-semibold">{t.title}</h2>
                  <p className="text-muted small mb-0">{t.text}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
