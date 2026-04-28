import Link from "next/link";
import {
  Wallet, Clock, Send, AlertTriangle, ArrowDown, RefreshCw, Plus, FileSpreadsheet,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { dashboardStats, listOperations, listMyApprovals, cashflowDaily, getBanksForOrg } from "@/lib/queries";
import { formatRub, formatRubWhole, formatNum, formatTime, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { CashflowChart } from "@/components/app/cashflow-chart";
import { RecentOpsFeed } from "@/components/app/recent-ops-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registryTypeLabel } from "@/lib/status";

export default async function HomePage() {
  const session = await requireSession();
  const stats = dashboardStats(session.orgId);
  const recentOps = listOperations(session.orgId, { limit: 50 });
  const myApprovals = listMyApprovals(session.orgId);
  const cashflow = cashflowDaily(session.orgId, 90);
  const banks = getBanksForOrg(session.orgId);
  const bankMap = Object.fromEntries(banks.map((b) => [b.bank.id, b.bank.shortName]));

  return (
    <>
      <PageHeader
        title="Главная"
        description={`${session.orgName} · доступ через ${session.bankShort}. Кошелёк ЦР единый — статус, остаток и история одинаковы для всех каналов.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/registries"><FileSpreadsheet className="h-4 w-4" /> Загрузить реестр</Link>
            </Button>
            <Button asChild>
              <Link href="/payments/new"><Plus className="h-4 w-4" /> Создать платёж</Link>
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Доступный остаток ЦР"
          value={formatRub(stats.walletBalanceCents / 100)}
          hint={
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Онлайн · {formatTime(stats.walletLastSyncAt)} · {stats.walletExternalRef}
            </span>
          }
          icon={<Wallet className="h-4 w-4" />}
          href="/wallet"
        />
        <KpiCard
          label="Ожидают согласования"
          value={formatNum(stats.pendingApprovals)}
          hint={stats.pendingApprovals > 0 ? "Требуется ваше действие" : "Очередь пуста"}
          tone={stats.pendingApprovals > 0 ? "warning" : "neutral"}
          icon={<Clock className="h-4 w-4" />}
          href="/operations?status=PENDING_APPROVAL"
        />
        <KpiCard
          label="В обработке"
          value={formatNum(stats.inProcess)}
          hint="Ушли в банк / в платформу"
          icon={<Send className="h-4 w-4" />}
          href="/operations?status=SUBMITTED"
        />
        <KpiCard
          label="Исполнено сегодня"
          value={formatRubWhole(stats.todayAmountCents / 100)}
          hint={stats.failed > 0 ? `${stats.failed} с отказом — требует разбора` : "Без расхождений"}
          tone={stats.failed > 0 ? "danger" : "positive"}
          icon={stats.failed > 0 ? <AlertTriangle className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          href="/operations?status=EXECUTED"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cashflow chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Движение средств</CardTitle>
            <CardDescription>Поступления и списания · исполненные операции · данные за 90 дней</CardDescription>
          </CardHeader>
          <CardContent>
            {cashflow.length > 0 ? (
              <CashflowChart
                data={cashflow}
                walletBalanceCents={stats.walletBalanceCents}
              />
            ) : (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                Нет исполненных операций за период
              </div>
            )}
          </CardContent>
        </Card>

        {/* My approvals widget */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Мои согласования</CardTitle>
            <CardDescription>Очередь, требующая вашего решения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 flex-1">
            {myApprovals.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">Очередь пуста</div>
            )}
            {myApprovals.slice(0, 3).map((row) => {
              const isOp = !!row.operation;
              const subj = isOp ? row.operation : row.registry;
              return (
                <Link
                  key={row.task.id}
                  href={isOp ? `/operations?op=${row.operation!.id}` : `/registries/${row.registry!.id}`}
                  className="block rounded-md border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {isOp
                          ? `Платёж: ${row.operation!.recipientName ?? row.operation!.recipientInn}`
                          : `Реестр: ${registryTypeLabel[row.registry!.type] ?? row.registry!.type}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular">
                        {isOp
                          ? formatRub(row.operation!.amountCents / 100)
                          : `${formatNum(row.registry!.rowsTotal)} строк · ${formatRub(row.registry!.totalAmountCents / 100)}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {relativeTime(subj!.createdAt)} · роль {row.task.approverRole}
                      </div>
                    </div>
                    <Badge variant="warning" className="shrink-0">Ожидает</Badge>
                  </div>
                </Link>
              );
            })}
            {myApprovals.length > 3 && (
              <Button asChild variant="ghost" className="w-full text-xs">
                <Link href="/operations?status=PENDING_APPROVAL">Все ({myApprovals.length}) →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent operations feed */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle>Лента операций</CardTitle>
          <CardDescription>
            Все типы · все статусы · фильтрация и поиск в реальном времени
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentOpsFeed ops={recentOps.map((op) => ({
            id: op.id,
            type: op.type,
            bankShort: bankMap[op.bankId] ?? null,
            recipientInn: op.recipientInn,
            recipientName: op.recipientName,
            purpose: op.purpose,
            amountCents: op.amountCents,
            statusDashboard: op.statusDashboard,
            statusBank: op.statusBank,
            statusPlatform: op.statusPlatform,
            statusErp: op.statusErp,
            createdAt: op.createdAt,
          }))} />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>© 2026 ООО &quot;НПК ТехноПром-Сервис&quot; · ИНН 7716250565</span>
        <span>Разработано: <span className="font-medium text-foreground/70">Гадзера Александр Николаевич</span></span>
      </div>
    </>
  );
}
