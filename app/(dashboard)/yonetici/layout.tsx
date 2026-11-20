import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminCoach } from "@/lib/admin";

// Yönetici sayfaları sadece coaches.is_admin = true olan koça açık
export default async function YoneticiLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await isAdminCoach(session.coachId))) redirect("/uyarilar");
  return <>{children}</>;
}
