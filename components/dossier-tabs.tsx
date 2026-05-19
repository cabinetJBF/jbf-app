"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "", label: "Aperçu" },
  { slug: "audiences", label: "Audiences" },
  { slug: "notes", label: "Notes" },
  { slug: "honoraires", label: "Honoraires" },
  { slug: "rappels", label: "Rappels" },
];

export function DossierTabs({ dossierId }: { dossierId: string }) {
  const pathname = usePathname();
  const base = `/dossiers/${dossierId}`;

  return (
    <nav className="border-b border-slate-200">
      <ul className="flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const href = tab.slug ? `${base}/${tab.slug}` : base;
          const active = tab.slug
            ? pathname.startsWith(href)
            : pathname === base;
          return (
            <li key={tab.slug}>
              <Link
                href={href}
                className={`inline-block border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
