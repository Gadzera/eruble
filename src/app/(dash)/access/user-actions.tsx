"use client";
import { useTransition } from "react";
import { MoreHorizontal, ShieldOff, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRole, setUserStatus } from "@/app/actions";

const roles = [
  { value: "Viewer", label: "Наблюдатель" },
  { value: "Creator", label: "Создатель" },
  { value: "Payroll", label: "Кадровый оператор" },
  { value: "Treasurer", label: "Казначей" },
  { value: "Approver", label: "Согласующий" },
  { value: "Signer", label: "Подписант" },
  { value: "ChiefAccountant", label: "Гл. бухгалтер" },
  { value: "CFO", label: "Финансовый директор" },
  { value: "Compliance", label: "Комплаенс" },
  { value: "Admin", label: "Администратор" },
];

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [, start] = useTransition();
  return (
    <Select
      defaultValue={currentRole}
      onValueChange={(v) => start(() => setUserRole(userId, v))}
    >
      <SelectTrigger className="h-7 text-xs w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UserStatusToggle({ userId, status }: { userId: string; status: string }) {
  const [pending, start] = useTransition();
  const isActive = status === "ACTIVE";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => start(() => setUserStatus(userId, "SUSPENDED"))}
          >
            <ShieldOff className="h-4 w-4" /> Приостановить доступ
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => start(() => setUserStatus(userId, "ACTIVE"))}>
            <ShieldCheck className="h-4 w-4" /> Восстановить доступ
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground">
          <RefreshCw className="h-4 w-4" /> Сбросить 2FA
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
