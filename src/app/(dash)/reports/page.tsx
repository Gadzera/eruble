import { Download, FileText, BarChart3, Calendar, TrendingUp, Clock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { cashflowDaily, dashboardStats } from "@/lib/queries";
import { formatRubWhole } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CashflowChart } from "@/components/app/cashflow-chart";

const reportTypes = [
  {
    icon: FileText,
    title: "Выписка по счёту ЦР",
    description: "Полная история движений за период с остатками на начало и конец дня",
    formats: ["PDF", "XLS"],
    badge: null,
  },
  {
    icon: BarChart3,
    title: "Отчёт о движении средств",
    description: "Агрегированный cashflow: поступления, списания, сальдо по дням",
    formats: ["PDF", "XLS", "CSV"],
    badge: null,
  },
  {
    icon: TrendingUp,
    title: "Аналитика по контрагентам",
    description: "ТОП-20 получателей, суммы и количество платежей за период",
    formats: ["XLS"],
    badge: "Новый",
  },
  {
    icon: Calendar,
    title: "Реестр исполненных платежей",
    description: "Все исполненные операции с CBR Message ID для сверки с банком",
    formats: ["XLS", "CSV"],
    badge: null,
  },
  {
    icon: Clock,
    title: "SLA-отчёт по времени исполнения",
    description: "Среднее время от создания до исполнения по типам операций",
    formats: ["PDF"],
    badge: null,
  },
  {
    icon: FileText,
    title: "Отчёт для ФНС / контролирующих органов",
    description: "Форма соответствия 115-ФЗ с перечнем подозрительных операций",
    formats: ["XML", "PDF"],
    badge: "Регуляторный",
  },
];

export default async function ReportsPage() {
  const session = await requireSession();
  const stats = dashboardStats(session.orgId);
  const cashflow = cashflowDaily(session.orgId, 30);

  const totalInflow = cashflow.reduce((s, r) => s + r.inflow, 0);
  const totalOutflow = cashflow.reduce((s, r) => s + r.outflow, 0);

  return (
    <>
      <PageHeader
        title="Отчёты"
        description="Формирование выписок, аналитики и регуляторных отчётов по кошельку ЦР. Все данные актуальны на момент запроса."
        actions={
          <Button variant="outline">
            <Calendar className="h-4 w-4" /> Расписание выгрузок
          </Button>
        }
      />

      {/* Period summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Поступления (30 дн.)", value: formatRubWhole(totalInflow / 100) },
          { label: "Списания (30 дн.)", value: formatRubWhole(totalOutflow / 100) },
          { label: "Остаток ЦР", value: formatRubWhole(stats.walletBalanceCents / 100) },
          { label: "Исполнено сегодня", value: formatRubWhole(stats.todayAmountCents / 100) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <div className="text-xl font-semibold tabular">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cashflow chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Движение средств за 30 дней</CardTitle>
          <CardDescription>Используется в отчёте о движении средств</CardDescription>
        </CardHeader>
        <CardContent>
          {cashflow.length > 0 ? (
            <CashflowChart data={cashflow} />
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Нет данных за период
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <Card key={r.title} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-md bg-muted p-2 shrink-0">
                  <r.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                {r.badge && (
                  <Badge variant={r.badge === "Регуляторный" ? "warning" : "info"} className="text-[10px]">
                    {r.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base mt-2">{r.title}</CardTitle>
              <CardDescription className="text-xs">{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between pt-0">
              <div className="flex gap-1">
                {r.formats.map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" className="text-xs h-7">
                <Download className="h-3 w-3" /> Скачать
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
