"use client";
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: number | null;
  createdAt: number;
};

const sevIcon = (sev: string) => {
  if (sev === "CRITICAL") return <ShieldAlert className="h-4 w-4 text-destructive" />;
  if (sev === "WARN") return <AlertTriangle className="h-4 w-4 text-warning" />;
  if (sev === "INFO") return <Info className="h-4 w-4 text-primary" />;
  return <CheckCircle2 className="h-4 w-4 text-success" />;
};

export function NotifButton({ items, unread }: { items: Notif[]; unread: number }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Уведомления</SheetTitle>
          <SheetDescription>Инциденты, статусы операций, запросы регулятора</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.length === 0 && <div className="text-sm text-muted-foreground">Уведомлений нет.</div>}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-md border p-3 transition-colors hover:bg-accent/50",
                !n.readAt && "border-l-4 border-l-primary bg-primary/[0.02]",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{sevIcon(n.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1.5">{relativeTime(n.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
