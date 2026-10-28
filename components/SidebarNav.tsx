"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GraduationCap, FileUp, FileText } from "lucide-react";

const NAV_ITEMS = [
  { href: "/ogrenciler", label: "Öğrenciler", icon: Users },
  { href: "/siniflar", label: "Sınıflar", icon: GraduationCap },
  { href: "/odev-ata", label: "Ödev Ata", icon: FileUp },
  { href: "/odevler", label: "Ödevler", icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-signal-200 hover:bg-white/[0.08] hover:text-white")
            }
          >
            <span
              className={
                "flex h-8 w-8 items-center justify-center rounded-lg " +
                (active ? "bg-signal-500 text-white" : "bg-white/[0.06] text-signal-200")
              }
            >
              <item.icon size={17} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
