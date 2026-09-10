"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

const LINKS = [
  { href: "/admin", label: "לוח בקרה", exact: true },
  { href: "/admin/orders", label: "הזמנות" },
  { href: "/admin/customers", label: "לקוחות" },
  { href: "/admin/sets", label: "ניהול סטים" },
  { href: "/admin/inventory", label: "מלאי" },
  { href: "/admin/reports", label: "דוח רכש" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-emerald-100 bg-white sm:w-56 sm:border-l">
      <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-4">
        <span aria-hidden>🌿</span>
        <span className="font-bold text-emerald-950">ניהול האתר</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 sm:flex-col sm:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap ${
                active
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-emerald-100 p-2">
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-2 text-right text-sm font-medium text-red-600 hover:bg-red-50"
          >
            יציאה
          </button>
        </form>
      </div>
    </aside>
  );
}
