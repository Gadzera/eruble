import { Settings, Shield, Bell, Clock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getWallet } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const approvalPolicies = [
  { key: "B2B_TRANSFER", label: "B2B-переводы", threshold: "от 500 000 ₽", roles: ["Approver", "CFO"] },
  { key: "CASH_OUT", label: "Вывод с ЦР", threshold: "любая сумма", roles: ["Treasurer", "CFO"] },
  { key: "REGISTRY", label: "Реестры платежей", threshold: "от 1 000 000 ₽", roles: ["ChiefAccountant", "CFO"] },
  { key: "CASH_IN", label: "Пополнение ЦР", threshold: "от 5 000 000 ₽", roles: ["CFO"] },
];

const notifications = [
  { key: "approval", label: "Запросы на согласование", enabled: true },
  { key: "executed", label: "Исполнение платежей", enabled: true },
  { key: "rejected", label: "Отказы и ошибки", enabled: true },
  { key: "sync", label: "Синхронизация кошелька", enabled: false },
  { key: "regtech", label: "RegTech-предупреждения", enabled: true },
];

export default async function SettingsPage() {
  const session = await requireSession();
  const wallet = getWallet(session.orgId);

  return (
    <>
      <PageHeader
        title="Настройки"
        description="Параметры организации, политики согласования, лимиты и уведомления."
      />

      <div className="space-y-6">
        {/* Org info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Организация</CardTitle>
            </div>
            <CardDescription>Реквизиты, зарегистрированные в платформе Банка России</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Наименование</Label>
                <Input defaultValue={session.orgName} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>ИНН</Label>
                <Input defaultValue={session.orgInn} readOnly className="bg-muted font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Кошелёк ЦР</Label>
                <Input defaultValue={wallet?.externalRef ?? "—"} readOnly className="bg-muted font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Банк по умолчанию</Label>
                <Input defaultValue={session.bankName} readOnly className="bg-muted" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Изменение реквизитов требует обращения в Банк России через банк-участник.
            </p>
          </CardContent>
        </Card>

        {/* Approval policies */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Политики согласования</CardTitle>
            </div>
            <CardDescription>
              Dual-control: операции выше пороговых значений требуют подтверждения от нескольких ролей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvalPolicies.map((p, i) => (
              <div key={p.key}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Порог: {p.threshold}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {p.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-3">Изменить политики</Button>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Лимиты операций</CardTitle>
            </div>
            <CardDescription>Дневные и разовые лимиты на операции с кошельком ЦР</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Разовый лимит B2B-перевода", value: "50 000 000 ₽" },
                { label: "Дневной лимит исходящих", value: "500 000 000 ₽" },
                { label: "Лимит одного реестра", value: "100 000 000 ₽" },
                { label: "Лимит на вывод (CASH_OUT)", value: "10 000 000 ₽" },
              ].map((l) => (
                <div key={l.label} className="rounded-md border p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{l.label}</span>
                  <span className="text-sm font-medium tabular">{l.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Лимиты устанавливаются договором с банком-участником. Изменение — через банк.
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Уведомления</CardTitle>
            </div>
            <CardDescription>Push и email уведомления о событиях в системе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((n, i) => (
              <div key={n.key}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm font-normal cursor-pointer">{n.label}</Label>
                  <Switch defaultChecked={n.enabled} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
