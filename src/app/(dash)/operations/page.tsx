import Link from "next/link";
import { FileDown, Plus } from "lucide-react";
import { requireSession } from "@/lib/session";
import { listOperations, getBanksForOrg } from "@/lib/queries";
import { formatNum } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { OperationsFilters } from "./filters";
import { OperationDrawer } from "./drawer";
import { OperationsTable } from "./operations-table";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; bankId?: string; q?: string; op?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const ops = listOperations(session.orgId, {
    status: sp.status, type: sp.type, bankId: sp.bankId, search: sp.q, limit: 200,
  });
  const banks = getBanksForOrg(session.orgId);
  const opIdToShow = sp.op;

  // Aggregate counts per status for the bar
  const total = ops.length;
  const counts = ops.reduce<Record<string, number>>((acc, o) => {
    acc[o.statusDashboard] = (acc[o.statusDashboard] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Операции"
        description={`Все распоряжения за период · показано ${formatNum(total)} ${plural(total, ["запись", "записи", "записей"])}`}
        actions={
          <>
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Экспорт
            </Button>
            <Button asChild>
              <Link href="/payments/new"><Plus className="h-4 w-4" /> Платёж</Link>
            </Button>
          </>
        }
      />

      {/* Status pill summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([s, c]) => (
          <Link
            key={s}
            href={sp.status === s ? "/operations" : `/operations?status=${s}`}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs hover:bg-accent/50 transition-colors ${sp.status === s ? "bg-accent border-primary" : "bg-card"}`}
          >
            <StatusBadge kind="dashboard" status={s} />
            <span className="tabular text-muted-foreground">{c}</span>
          </Link>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="p-3">
          <OperationsFilters
            current={{ status: sp.status, type: sp.type, bankId: sp.bankId, q: sp.q }}
            banks={banks.map((b) => ({ id: b.bank.id, short: b.bank.shortName }))}
          />
        </CardContent>
      </Card>

      <OperationsTable ops={ops.map((op) => ({
        id: op.id,
        type: op.type,
        bankShort: banks.find((b) => b.bank.id === op.bankId)?.bank.shortName ?? null,
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

      {opIdToShow && <OperationDrawer operationId={opIdToShow} />}
    </>
  );
}

function plural(n: number, [a, b, c]: [string, string, string]) {
  const m = n % 100;
  if (m >= 11 && m <= 14) return c;
  const u = n % 10;
  if (u === 1) return a;
  if (u >= 2 && u <= 4) return b;
  return c;
}
