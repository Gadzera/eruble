import { Download, ShieldAlert, FileText, AlertTriangle } from "lucide-react";
import { requireSession } from "@/lib/session";
import { listAuditEvents } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditFilters } from "./filters";

const severityVariant: Record<string, "default" | "warning" | "destructive" | "secondary"> = {
  INFO: "secondary",
  WARN: "warning",
  CRITICAL: "destructive",
};

const actionLabel: Record<string, string> = {
  "login": "Вход в систему",
  "logout": "Выход",
  "payment.create": "Создан платёж",
  "payment.submit": "Платёж отправлен",
  "registry.upload": "Загружен реестр",
  "approval.approve": "Согласование подтверждено",
  "approval.reject": "Согласование отклонено",
  "access.invite": "Приглашён пользователь",
  "access.suspend": "Доступ приостановлен",
  "access.activate": "Доступ восстановлен",
  "access.role_change": "Изменена роль",
  "counterparty.create": "Добавлен контрагент",
  "counterparty.verify": "Контрагент верифицирован",
  "counterparty.blocked": "Контрагент заблокирован",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; q?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const events = listAuditEvents(session.orgId, {
    severity: sp.severity,
    search: sp.q,
    limit: 200,
  });

  const criticalCount = events.filter((e) => e.severity === "CRITICAL").length;
  const warnCount = events.filter((e) => e.severity === "WARN").length;

  return (
    <>
      <PageHeader
        title="Аудит и RegTech"
        description="Неизменяемый журнал всех действий в системе. Соответствует требованиям 115-ФЗ, 152-ФЗ и регуляторным требованиям Банка России."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Выгрузить в ФНС
          </Button>
        }
      />

      {/* RegTech summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{events.length}</div>
                <div className="text-xs text-muted-foreground">Событий в журнале</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-warning/10 p-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{warnCount}</div>
                <div className="text-xs text-muted-foreground">Предупреждений</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-destructive/10 p-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{criticalCount}</div>
                <div className="text-xs text-muted-foreground">Критических событий</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Журнал событий</CardTitle>
          <CardDescription>Все действия пользователей и системных процессов с IP и UserAgent</CardDescription>
          <AuditFilters current={{ severity: sp.severity, q: sp.q }} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Актор</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Уровень</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Нет событий по фильтру
                  </TableCell>
                </TableRow>
              ) : (
                events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="tabular text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(ev.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{ev.actorName}</TableCell>
                    <TableCell className="text-sm">{actionLabel[ev.action] ?? ev.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular">
                      {ev.objectType && ev.objectId ? `${ev.objectType} / ${ev.objectId}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular">{ev.ip ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[ev.severity] ?? "secondary"} className="text-[10px]">
                        {ev.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
