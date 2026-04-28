"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Send, FileSpreadsheet, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/operations", label: "Операции", icon: ListChecks },
  { href: "/payments/new", label: "Платёж", icon: Send },
  { href: "/registries", label: "Реестры", icon: FileSpreadsheet },
  { href: "/reports", label: "Ещё", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
