"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Wallet, Send, FileSpreadsheet, ListChecks, Users, BarChart3, Plug, ShieldCheck, Settings, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OrcaWordmark } from "./logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/wallet", label: "Счёт ЦР", icon: Wallet },
  { href: "/payments/new", label: "Создать платёж", icon: Send },
  { href: "/registries", label: "Реестры", icon: FileSpreadsheet },
  { href: "/operations", label: "Операции", icon: ListChecks },
  { href: "/counterparties", label: "Контрагенты", icon: Users },
  { href: "/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/integrations", label: "Интеграции", icon: Plug },
  { href: "/access", label: "Доступы", icon: ShieldCheck },
  { href: "/audit", label: "Аудит и RegTech", icon: BookOpen },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function MobileNavTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-5 h-14 flex flex-row items-center justify-between border-b space-y-0">
            <SheetTitle asChild>
              <Link href="/" onClick={() => setOpen(false)}><OrcaWordmark /></Link>
            </SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          <nav className="py-3 px-2 space-y-0.5 overflow-y-auto">
            {nav.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-4 py-3 text-[11px] text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Платформа Банка России — онлайн
            </div>
            <div>Альбом сообщений: 2026.07 · UI: 4.0</div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
