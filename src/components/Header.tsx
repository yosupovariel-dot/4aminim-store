"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/", label: "בית" },
  { href: "/#sets", label: "הסטים שלנו" },
  { href: "/#delivery", label: "משלוחים" },
  { href: "/contact", label: "צור קשר" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <div
      className={`sticky top-0 z-40 flex justify-center transition-all duration-300 ${
        scrolled ? "px-2 pt-2 sm:px-4 sm:pt-3" : "px-0 pt-0"
      }`}
    >
      <header
        className={`w-full transition-all duration-300 ease-out ${
          scrolled
            ? "max-w-4xl rounded-full bg-white/90 shadow-lg shadow-emerald-900/10 backdrop-blur"
            : "max-w-none rounded-none bg-white/70 shadow-sm backdrop-blur"
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-all duration-300 ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl" aria-hidden>
              🌿
            </span>
            <span
              className={`whitespace-nowrap font-semibold text-emerald-900 transition-all ${
                scrolled ? "text-sm" : "text-base sm:text-lg"
              }`}
            >
              ארבעת המינים לסוכות עד הבית
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 whitespace-nowrap text-sm font-medium text-emerald-800">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap hover:text-emerald-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cart"
              aria-label={`סל קניות, ${itemCount} פריטים`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 5M7 13l-1.5 6h11" />
                <circle cx="9" cy="21" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="18" cy="21" r="1.3" fill="currentColor" stroke="none" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/#sets"
              className="hidden sm:inline-block rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              להזמנת סט
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
