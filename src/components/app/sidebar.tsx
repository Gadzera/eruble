import Link from "next/link";
import {
  LayoutDashboard, Wallet, Send, FileSpreadsheet, ListChecks, Users, BarChart3,
  Plug, ShieldCheck, Settings, BookOpen,
} from "lucide-react";
import { OrcaWordmark, DigitalRubleMark } from "./logo";
import { SidebarLink } from "./sidebar-link";

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

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="px-4 h-16 flex items-center justify-between border-b gap-2">
        <Link href="/"><OrcaWordmark /></Link>
        <DigitalRubleMark className="h-7 w-7 shrink-0 opacity-90" />
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map((item) => (
          <SidebarLink key={item.href} href={item.href} icon={<item.icon className="h-4 w-4" />}>
            {item.label}
          </SidebarLink>
        ))}
      </nav>
      <div className="border-t px-4 py-3">
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Платформа Банка России — онлайн
          </div>
          <div>Альбом 2026.07 · Распоряжения 2026.1</div>
        </div>
      </div>
    </aside>
  );
}
