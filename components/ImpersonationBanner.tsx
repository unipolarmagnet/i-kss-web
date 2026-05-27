import { getEffectiveSession } from "@/lib/session";
import { stopImpersonation } from "@/app/admin/users/actions";

export default async function ImpersonationBanner() {
  const sess = await getEffectiveSession();
  if (!sess?.isImpersonating) return null;

  return (
    <div className="impersonate-banner alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0 px-3 py-2">
      <span className="small">
        Zobrazujete ako{" "}
        <strong>{sess.effective.name ?? sess.effective.email}</strong> (
        {sess.effective.email}) · skutočný admin: {sess.real.email}
      </span>
      <form action={stopImpersonation} className="m-0">
        <button type="submit" className="btn btn-sm btn-dark">
          Skončiť impersonáciu
        </button>
      </form>
    </div>
  );
}
