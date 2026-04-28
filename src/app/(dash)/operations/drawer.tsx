"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRub } from "@/lib/format";
import { dashboardStatusLabel, operationTypeLabel } from "@/lib/status";
import { FileCode2, Repeat, Ban } from "lucide-react";

type Op = {
  id: string;
  type: string;
  recipientName: string | null;
  recipientInn: string | null;
  recipientDrRef: string | null;
  amountCents: number;
  purpose: string;
  statusDashboard: string;
  statusBank: string | null;
  statusPlatform: string | null;
  statusErp: string | null;
  cbrMessageId: string | null;
  cbrMessageVersion: string | null;
  cbrOrderVersion: string | null;
  idempotencyKey: string;
  createdAt: number;
  submittedAt: number | null;
  executedAt: number | null;
};

export function OperationDrawer({ operationId }: { operationId: string }) {
  const router = useRouter();
  const [op, setOp] = useState<Op | null>(null);

  useEffect(() => {
    fetch(`/api/operations/${operationId}`).then((r) => r.ok ? r.json() : null).then((d) => d && setOp(d));
  }, [operationId]);

  function close(open: boolean) {
    if (!open) {
      const params = new URLSearchParams(window.location.search);
      params.delete("op");
      router.push(`/operations?${params.toString()}`);
    }
  }

  return (
    <Sheet open onOpenChange={close}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Операция
            <Badge variant="outline" className="text-[11px] tabular">{operationId}</Badge>
          </SheetTitle>
          <SheetDescription>
            Полный жизненный цикл и контекст распоряжения. Все события сохраняются в неизменяемом audit trail.
          </SheetDescription>
        </SheetHeader>

        {!op ? (
          <div className="mt-6 text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Status timeline */}
            <div className="rounded-md border bg-card p-4">
              <div className="text-sm font-medium mb-3">Жизненный цикл</div>
              <div className="space-y-2.5">
                <Lifeline label="Дашборд" status={op.statusDashboard} timestamp={op.createdAt} kind="dashboard" />
                <Lifeline label="Банк-участник" status={op.statusBank} timestamp={op.submittedAt} kind="bank" />
                <Lifeline label="Платформа Банка России" status={op.statusPlatform} timestamp={op.submittedAt} kind="platform" />
                <Lifeline label="ERP / 1С" status={op.statusErp} timestamp={op.executedAt} kind="erp" />
              </div>
            </div>

            {/* Details */}
            <div className="rounded-md border bg-card p-4 space-y-2">
              <div className="text-sm font-medium mb-2">Реквизиты</div>
              <Row label="Тип" value={operationTypeLabel[op.type] ?? op.type} />
              <Row label="Получатель" value={op.recipientName ?? (op.type === "CASH_IN" ? "Пополнение ЦР-счёта" : op.type === "CASH_OUT" ? "Вывод на расчётный счёт" : "—")} />
              {op.recipientInn && <Row label="ИНН получателя" value={op.recipientInn} mono />}
              {op.recipientDrRef && <Row label="Счёт ЦР получателя" value={op.recipientDrRef} mono />}
              <Row label="Сумма" value={(op.type === "CASH_IN" || op.type === "QR_SETTLEMENT" ? "+" : "") + formatRub(op.amountCents / 100)} mono />
              <Row label="Назначение" value={op.purpose || "—"} />
            </div>

            {/* CBR */}
            <div className="rounded-md border bg-card p-4 space-y-2">
              <div className="text-sm font-medium mb-2">Технические данные</div>
              <Row label="Idempotency-Key" value={op.idempotencyKey} mono small />
              <Row label="CBR Message ID" value={op.cbrMessageId ?? "—"} mono small />
              <Row label="Альбом сообщений" value={op.cbrMessageVersion ?? "—"} mono small />
              <Row label="Альбом распоряжений" value={op.cbrOrderVersion ?? "—"} mono small />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1">
                <FileCode2 className="h-4 w-4" /> XML
              </Button>
              <Button variant="outline" className="flex-1">
                <Repeat className="h-4 w-4" /> Повторить
              </Button>
              <Button variant="outline" className="flex-1 text-destructive">
                <Ban className="h-4 w-4" /> Запросить разбор
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Lifeline({
  label, status, timestamp, kind,
}: {
  label: string;
  status: string | null;
  timestamp: number | null;
  kind: "dashboard" | "bank" | "platform" | "erp";
}) {
  return (
    <div className="grid grid-cols-[180px_1fr_auto] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StatusBadge kind={kind} status={status} />
      <span className="text-[11px] text-muted-foreground tabular">
        {timestamp ? formatDateTime(timestamp) : "—"}
      </span>
    </div>
  );
}

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${mono ? "tabular" : ""} ${small ? "text-xs" : ""} font-medium break-all`}>{value}</span>
    </div>
  );
}
