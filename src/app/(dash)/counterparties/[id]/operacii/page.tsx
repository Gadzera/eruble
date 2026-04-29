import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCounterparty, listCounterpartyOps } from "@/lib/queries";
import { formatDate, formatRub, relativeTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardStatusLabel, dashboardStatusVariant } from "@/lib/status";

export default async function OperaciiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const cp = getCounterparty(id);
  if (!cp || cp.orgId !== session.orgId) notFound();

  const ops = listCounterpartyOps(session.orgId, id);
  const totalAmt = ops.reduce((s, o) => s + o.amountCents, 0);

  if (ops.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-16 flex flex-col items-center gap-3 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <div className="text-sm font-medium">Операций пока нет</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            История платежей с этим контрагентом появится здесь после первого перевода
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Операций" value={String(ops.length)} />
        <StatTile label="Сумма операций" value={formatRub(totalAmt / 100)} />
        <StatTile
          label="Последняя"
          value={relativeTime(ops[0].createdAt)}
        />
      </div>

      {/* Ops table */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {ops.map((op) => (
              <div key={op.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {op.purpose || "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 tabular">
                    {formatDate(op.createdAt)} · {op.type}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium tabular">
                    {formatRub(op.amountCents / 100)}
                  </div>
                  <Badge
                    variant={dashboardStatusVariant[op.statusDashboard] ?? "secondary"}
                    className="text-[10px] px-1.5 py-0 h-4 mt-0.5"
                  >
                    {dashboardStatusLabel[op.statusDashboard] ?? op.statusDashboard}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular mt-1">{value}</div>
    </div>
  );
}
