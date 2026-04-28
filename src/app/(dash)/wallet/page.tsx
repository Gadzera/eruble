import Link from "next/link";
import {
  ArrowDown, ArrowUp, RefreshCw, Plus, FileDown, ShieldAlert, Activity, Lock, AlertTriangle,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { getWallet, getBanksForOrg, listOperations } from "@/lib/queries";
import { formatRub, formatDateTime, formatTime, formatRubWhole } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/app/status-badge";
import { bankAdapterStatusLabel, bankAdapterStatusVariant, operationTypeLabel } from "@/lib/status";

export default async function WalletPage() {
  const session = await requireSession();
  const wallet = getWallet(session.orgId)!;
  const banks = getBanksForOrg(session.orgId);
  const movements = listOperations(session.orgId, { limit: 30 }).filter((o) => o.executedAt || o.statusDashboard === "EXECUTED");

  const available = wallet.balanceCents / 100;
  const blocked = wallet.blockedCents / 100;

  return (
    <>
      <PageHeader
        title="Счёт цифрового рубля"
        description="Один кошелёк на организацию, доступный через любой подключённый банк-участник."
        actions={
          <>
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Выписка
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4" /> Обновить остаток
            </Button>
          </>
        }
      />

      {/* Top: balance + meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Доступный остаток</CardDescription>
              <Badge variant="success" className="gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Активен
              </Badge>
            </div>
            <CardTitle className="text-4xl font-semibold tabular tracking-tight mt-1">
              {formatRub(available)}
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1 tabular flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Онлайн · {formatTime(Date.now())} · {wallet.externalRef}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Заблокировано
              </div>
              <div className="text-lg font-medium tabular mt-1">{formatRub(blocked)}</div>
              <div className="text-[11px] text-muted-foreground">Платежи на согласовании</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">К исполнению</div>
              <div className="text-lg font-medium tabular mt-1">{formatRub(available - blocked)}</div>
              <div className="text-[11px] text-muted-foreground">После списаний из очереди</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick ops */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Быстрые операции</CardTitle>
            <CardDescription>Через текущий канал — {session.bankShort}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/payments/new"><Plus className="h-4 w-4" /> Создать платёж</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <ArrowDown className="h-4 w-4 text-success" /> Пополнить с банковского счёта
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <ArrowUp className="h-4 w-4" /> Вывести на банковский счёт
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Приостановить доступ
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: bank channels, movements, limits */}
      <Tabs defaultValue="banks">
        <TabsList>
          <TabsTrigger value="banks">Каналы доступа</TabsTrigger>
          <TabsTrigger value="movements">Движение</TabsTrigger>
          <TabsTrigger value="limits">Лимиты</TabsTrigger>
        </TabsList>

        <TabsContent value="banks">
          <Card>
            <CardHeader>
              <CardTitle>Банки-участники с доступом к этому кошельку</CardTitle>
              <CardDescription>
                Кошелёк цифрового рубля на платформе Банка России единый, но доступ к нему может предоставляться через
                несколько банков-участников. Это снижает риск отказа: при недоступности одного канала операции идут через другой.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Банк</TableHead>
                    <TableHead>Канал</TableHead>
                    <TableHead>Версия альбома</TableHead>
                    <TableHead>Подключён</TableHead>
                    <TableHead>По умолчанию</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((b) => (
                    <TableRow key={b.access.id}>
                      <TableCell>
                        <div className="font-medium">{b.bank.shortName}</div>
                        <div className="text-xs text-muted-foreground">{b.bank.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={bankAdapterStatusVariant[b.bank.status] ?? "secondary"} className="gap-1.5">
                          <Activity className="h-3 w-3" />
                          {bankAdapterStatusLabel[b.bank.status] ?? b.bank.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular text-sm">{b.bank.cbrAlbumVersion}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(b.access.createdAt)}
                      </TableCell>
                      <TableCell>
                        {b.access.isDefault ? <Badge variant="info">Да</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Тест связи</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Движение средств</CardTitle>
              <CardDescription>Поступления и списания со счёта цифрового рубля</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Контрагент / основание</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 20).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="tabular text-xs whitespace-nowrap">
                        {formatDateTime(m.executedAt ?? m.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {operationTypeLabel[m.type] ?? m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        <div className="text-sm font-medium truncate">{m.recipientName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.purpose}</div>
                      </TableCell>
                      <TableCell className="text-right tabular font-medium">
                        {m.type === "CASH_IN" ? (
                          <span className="text-success">+ {formatRubWhole(m.amountCents / 100)}</span>
                        ) : (
                          <span>− {formatRubWhole(m.amountCents / 100)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge kind="dashboard" status={m.statusDashboard} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Лимиты на операции</CardTitle>
              <CardDescription>
                Лимиты задаются политикой согласований организации. Изменение — через двойное подтверждение
                (CFO + Security Officer).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Лимит на единичный платёж", role: "Treasurer", value: "5 000 000 ₽" },
                  { label: "Лимит без двойной подписи", role: "Treasurer", value: "500 000 ₽" },
                  { label: "Дневной лимит организации", role: "—", value: "50 000 000 ₽" },
                  { label: "Лимит по реестру", role: "Payroll", value: "10 000 000 ₽" },
                ].map((l) => (
                  <div key={l.label} className="rounded-md border p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{l.label}</div>
                    <div className="text-lg font-medium tabular mt-1">{l.value}</div>
                    {l.role !== "—" && (
                      <div className="text-[11px] text-muted-foreground mt-1">Действует для роли {l.role}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border-l-4 border-l-warning bg-warning/10 p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <div className="font-medium text-amber-900">Превышение лимита</div>
                  <div className="text-amber-800 text-xs mt-0.5">
                    Платежи свыше 5 млн ₽ требуют двойной подписи (CFO + ChiefAccountant) и автоматически блокируют
                    эквивалентный остаток до подтверждения.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
