"use client";
import { useTransition } from "react";
import { Check, ChevronDown, Activity } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { switchBankAccess } from "@/app/actions";

export type BankOption = {
  accessId: string;
  bankId: string;
  bankCode: string;
  bankShort: string;
  bankName: string;
  status: string; // ACTIVE | DEGRADED | DOWN
  isCurrent: boolean;
};

export function BankSwitcher({ options }: { options: BankOption[] }) {
  const [pending, start] = useTransition();
  const current = options.find((o) => o.isCurrent) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-card hover:bg-accent text-sm shadow-sm transition-colors",
          pending && "opacity-50",
        )}
      >
        <Activity className="h-4 w-4 text-primary" />
        <span className="font-medium">{current?.bankShort ?? "Банк"}</span>
        {current?.status === "DEGRADED" && (
          <Badge variant="warning" className="h-4 px-1 text-[10px]">медленно</Badge>
        )}
        {current?.status === "DOWN" && (
          <Badge variant="destructive" className="h-4 px-1 text-[10px]">недоступен</Badge>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Канал доступа к платформе</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuItem
            key={o.accessId}
            onSelect={() =>
              start(async () => {
                await switchBankAccess(o.accessId);
              })
            }
            className="py-2"
          >
            <div className="flex w-full items-start gap-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{o.bankShort}</div>
                <div className="text-[11px] text-muted-foreground">{o.bankName}</div>
              </div>
              {o.status === "ACTIVE" && <Badge variant="success" className="h-5 text-[10px]">активен</Badge>}
              {o.status === "DEGRADED" && <Badge variant="warning" className="h-5 text-[10px]">медленно</Badge>}
              {o.status === "DOWN" && <Badge variant="destructive" className="h-5 text-[10px]">недоступен</Badge>}
              {o.isCurrent && <Check className="h-4 w-4 ml-1 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
          Кошелёк ЦР один на организацию. Через любой банк-участник вы видите тот же остаток и историю.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
