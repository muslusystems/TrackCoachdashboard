import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/session";
import { SidebarNav } from "@/components/SidebarNav";
import { avatarStyle, initials } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col bg-gradient-to-b from-night-900 via-night-800 to-night-700 px-4 py-5 md:sticky md:top-0 md:h-screen md:w-64 md:py-7">
        <div className="mb-5 flex items-center gap-3 px-2 md:mb-9">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-signal-300 to-signal-600 font-display text-lg font-semibold text-white shadow-card">
            T
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-white">
              TrackCoach
            </p>
            <p className="text-xs text-signal-200">Koç paneli</p>
          </div>
        </div>
        <SidebarNav />
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.08] p-3 md:mt-6">
          <span
            className={
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold " +
              avatarStyle(session.name || "Koç")
            }
          >
            {initials(session.name || "Koç")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{session.name}</p>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-signal-200 hover:text-white"
              >
                <LogOut size={12} /> Çıkış yap
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-9">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
