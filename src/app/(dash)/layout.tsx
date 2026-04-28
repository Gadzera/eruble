import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";
import { BottomNav } from "@/components/app/bottom-nav";
import { getSession } from "@/lib/session";
import { getBanksForOrg, listNotifications, unreadNotifCount, listUsers } from "@/lib/queries";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const banks = getBanksForOrg(session.orgId).map((row) => ({
    accessId: row.access.id,
    bankId: row.bank.id,
    bankCode: row.bank.code,
    bankShort: row.bank.shortName,
    bankName: row.bank.name,
    status: row.bank.status,
    isCurrent: row.access.id === session.bankAccessId,
  }));

  const notifs = listNotifications(session.orgId, session.id, 20).map((n) => ({
    id: n.id,
    type: n.type,
    severity: n.severity,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }));
  const unread = unreadNotifCount(session.orgId, session.id);
  const orgUsers = listUsers(session.orgId).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
  }));

  return (
    <div className="flex h-screen w-full bg-muted/30">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          user={{
            id: session.id,
            name: session.name,
            email: session.email,
            role: session.role,
            orgName: session.orgName,
            orgInn: session.orgInn,
            bankName: session.bankName,
          }}
          banks={banks}
          notifs={notifs}
          unread={unread}
          orgUsers={orgUsers}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] p-4 pb-20 lg:p-8 lg:pb-8">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
