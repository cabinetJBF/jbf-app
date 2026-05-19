import Link from "next/link";
import { logout } from "@/app/(app)/actions";
import type { AuthenticatedUser } from "@/lib/auth/dal";

const NAV_LINKS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/dossiers", label: "Dossiers" },
  { href: "/agenda", label: "Agenda" },
  { href: "/honoraires", label: "Honoraires" },
];

export function NavBar({ user }: { user: AuthenticatedUser }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-semibold text-slate-900 hover:text-slate-700"
          >
            Cabinet JBF
          </Link>
          <nav className="hidden gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.prenom} {user.nom}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <nav className="border-t border-slate-200 px-4 pb-2 pt-1 md:hidden">
        <div className="flex flex-wrap gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
