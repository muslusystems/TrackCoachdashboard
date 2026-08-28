import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, GraduationCap, LogOut, FileUp, FileText } from "lucide-react";
import { getSession } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/ogrenciler", label: "Öğrenciler", icon: Users },
  { href: "/siniflar", label: "Sınıflar", icon: GraduationCap },
  { href: "/odev-ata", label: "Ödev Ata", icon: FileUp },
  { href: "/odevler", label: "Ödevler", icon: FileText },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-ink-100 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-semibold text-ink-900">
            TrackCoach
          </p>
          <p className="text-xs text-ink-400">{session.name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-400 hover:bg-ink-50 hover:text-ink-900"
          >
            <LogOut size={18} />
            Çıkış yap
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-ink-50 px-8 py-8">{children}</main>
    </div>
  );
}
