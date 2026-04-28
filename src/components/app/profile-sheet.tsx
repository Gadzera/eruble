"use client";
import { useState, useTransition } from "react";
import { User, Shield, ChevronRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { roleLabel } from "@/lib/status";
import { updateProfile, switchUser, getUserSecurityEvents } from "@/app/actions";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent } from "@/lib/db/schema";

const initials = (name: string) =>
  name.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

type OrgUser = { id: string; name: string; role: string; email: string };

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  orgName: string;
  orgInn: string;
  bankName: string;
};

export function ProfileSheet({
  open, onClose, user, orgUsers,
}: {
  open: boolean;
  onClose: () => void;
  user: UserInfo;
  orgUsers: OrgUser[];
}) {
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [secEvents, setSecEvents] = useState<AuditEvent[] | null>(null);
  const [secLoading, setSecLoading] = useState(false);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) return;
    startTransition(async () => {
      await updateProfile(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  function handleTabChange(t: "profile" | "security") {
    setTab(t);
    if (t === "security" && secEvents === null) {
      setSecLoading(true);
      getUserSecurityEvents().then(evs => {
        setSecEvents(evs);
        setSecLoading(false);
      });
    }
  }

  function handleSwitchUser(userId: string) {
    if (userId === user.id) return;
    startTransition(() => switchUser(userId));
  }

  const tabs = [
    { id: "profile" as const, label: "Профиль", Icon: User },
    { id: "security" as const, label: "Безопасность", Icon: Shield },
  ];

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-4 pb-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-base">{user.name}</SheetTitle>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
              <Badge variant="secondary" className="mt-1.5 text-[10px] uppercase tracking-wide">
                {roleLabel[user.role] ?? user.role}
              </Badge>
            </div>
          </div>
          <div className="flex border-b -mx-6 px-6">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tab === "profile" && (
            <>
              <div className="space-y-1.5">
                <Label>Отображаемое имя</Label>
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                  />
                  <Button
                    onClick={handleSave}
                    disabled={pending || !name.trim() || name.trim() === user.name}
                    size="sm"
                    className="shrink-0"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user.email} readOnly className="bg-muted" />
                <p className="text-[11px] text-muted-foreground">Изменение email — через службу поддержки.</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Организация
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "Наименование", value: user.orgName },
                    { label: "ИНН", value: user.orgInn },
                    { label: "Банк-участник", value: user.bankName },
                    { label: "Роль", value: roleLabel[user.role] ?? user.role },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="text-[11px] text-muted-foreground mb-0.5">{r.label}</div>
                      <div className="text-sm font-medium">{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "security" && (
            <>
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Сменить пользователя (демо-режим)
                </div>
                <p className="text-xs text-muted-foreground">
                  В демо-системе можно просматривать интерфейс от лица разных сотрудников.
                </p>
                <div className="rounded-lg border divide-y overflow-hidden">
                  {orgUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSwitchUser(u.id)}
                      disabled={u.id === user.id || pending}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                        u.id === user.id
                          ? "bg-primary/5 cursor-default"
                          : "hover:bg-accent/50 cursor-pointer"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2">
                          {u.name}
                          {u.id === user.id && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">текущий</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {roleLabel[u.role] ?? u.role} · {u.email}
                        </div>
                      </div>
                      {u.id !== user.id && (
                        pending
                          ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Последние действия
                </div>
                {secLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
                  </div>
                ) : !secEvents || secEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">Нет записей аудита</div>
                ) : (
                  <div className="rounded-lg border divide-y">
                    {secEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between px-3 py-2 gap-4">
                        <code className="text-xs text-muted-foreground">{ev.action}</code>
                        <span className="text-[11px] text-muted-foreground tabular whitespace-nowrap">
                          {formatDateTime(ev.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
