import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const agency = await prisma.agency.findUnique({ where: { id: session.agencyId } });
  if (!agency) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{ name: session.name, email: session.email, role: session.role }}
      agencyName={agency.name}
    >
      {children}
    </AppShell>
  );
}
