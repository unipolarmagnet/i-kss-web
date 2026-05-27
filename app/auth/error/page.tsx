import Link from "next/link";

type SearchParams = Promise<{ error?: string }>;

const MESSAGES: Record<string, { title: string; lead: string }> = {
  AccessDenied: {
    title: "Prístup je blokovaný",
    lead:
      "Túto aplikáciu je možné používať iba s účtom v doméne @stuba.sk. Skúste sa prihlásiť znova iným účtom.",
  },
  Configuration: {
    title: "Chyba konfigurácie",
    lead:
      "Prihlásenie momentálne nie je možné dokončiť. Skontrolujte konfiguráciu OAuth a skúste to znova.",
  },
  Verification: {
    title: "Overenie zlyhalo",
    lead: "Overovací odkaz vypršal alebo bol už použitý.",
  },
};

const DEFAULT = {
  title: "Pri prihlásení nastala chyba",
  lead: "Skúste sa, prosím, prihlásiť znova.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const { title, lead } = (error && MESSAGES[error]) || DEFAULT;

  return (
    <main className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <h1 className="h4 fw-semibold text-danger mb-2">{title}</h1>
            <p className="text-muted mb-4">{lead}</p>
            <Link href="/auth/signin" className="btn btn-outline-secondary">
              Skúsiť znova
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
