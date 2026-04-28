import { Search } from "lucide-react";
import { BankSwitcher, type BankOption } from "./bank-switcher";
import { UserMenu } from "./user-menu";
import { NotifButton } from "./notif-button";
import { MobileNavTrigger } from "./mobile-nav";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/status";

type OrgUser = { id: string; name: string; role: string; email: string };

export type TopBarProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    orgName: string;
    orgInn: string;
    bankName: string;
  };
  banks: BankOption[];
  notifs: Parameters<typeof NotifButton>[0]["items"];
  unread: number;
  orgUsers: OrgUser[];
};

export function TopBar({ user, banks, notifs, unread, orgUsers }: TopBarProps) {
  return (
    <header className="h-14 shrink-0 border-b bg-card px-4 flex items-center gap-3">
      <MobileNavTrigger />

      <div className="hidden md:flex items-center gap-2 pr-3 border-r">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{user.orgName}</span>
          <span className="text-[11px] text-muted-foreground tabular">ИНН {user.orgInn}</span>
        </div>
      </div>

      <BankSwitcher options={banks} />

      <Badge variant="outline" className="hidden md:inline-flex h-7 px-2 gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Песочница ЦБ
      </Badge>

      <div className="hidden lg:flex flex-1 max-w-md ml-2 relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Номер операции, ИНН, имя контрагента, сумма…"
          className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotifButton items={notifs} unread={unread} />
        <div className="ml-1 hidden md:flex flex-col text-right leading-tight pr-2">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-[11px] text-muted-foreground">{roleLabel[user.role] ?? user.role}</span>
        </div>
        <UserMenu
          name={user.name}
          email={user.email}
          role={roleLabel[user.role] ?? user.role}
          userId={user.id}
          orgName={user.orgName}
          orgInn={user.orgInn}
          bankName={user.bankName}
          orgUsers={orgUsers}
        />
      </div>
    </header>
  );
}
