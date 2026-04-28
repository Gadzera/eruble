import { requireSession } from "@/lib/session";
import { listCounterparties } from "@/lib/queries";
import { formatDate, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { counterpartyStatusLabel, counterpartyStatusVariant } from "@/lib/status";
import { ShieldCheck } from "lucide-react";
import { AddCounterpartyDialog } from "./add-dialog";
import { RowActions } from "./row-actions";
import { AmlRiskBadge } from "@/components/app/aml-report-sheet";

export default async function CounterpartiesPage() {
  const session = await requireSession();
  const counterparties = listCounterparties(session.orgId);

  return (
    <>
      <PageHeader
        title="Контрагенты"
        description="Справочник получателей ЦР-платежей. Верифицированные контрагенты доступны в автодополнении платёжных форм."
        actions={<AddCounterpartyDialog />}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Наименование</TableHead>
                <TableHead>ИНН</TableHead>
                <TableHead>Счёт ЦР</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>115-ФЗ риск</TableHead>
                <TableHead>Верификация</TableHead>
                <TableHead className="text-right">Добавлен</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {counterparties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    Справочник пуст — добавьте первого контрагента
                  </TableCell>
                </TableRow>
              ) : (
                counterparties.map((cp) => (
                  <TableRow key={cp.id}>
                    <TableCell className="font-medium max-w-[260px] truncate">{cp.name}</TableCell>
                    <TableCell className="tabular text-sm">{cp.inn}</TableCell>
                    <TableCell className="tabular text-sm text-muted-foreground">
                      {cp.drAccountRef ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={counterpartyStatusVariant[cp.status] ?? "secondary"}>
                        {counterpartyStatusLabel[cp.status] ?? cp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AmlRiskBadge riskLevel={cp.riskLevel ?? "LOW"} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {cp.verifiedAt ? (
                        <span className="flex items-center gap-1.5 text-success">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {relativeTime(cp.verifiedAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Не верифицирован</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular">
                      {formatDate(cp.createdAt)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        id={cp.id}
                        status={cp.status}
                        verifiedAt={cp.verifiedAt}
                        amlCp={{
                          id: cp.id,
                          name: cp.name,
                          inn: cp.inn,
                          status: cp.status,
                          riskLevel: cp.riskLevel ?? "LOW",
                          category: cp.category,
                          verifiedAt: cp.verifiedAt,
                          notes: cp.notes,
                          legalType: cp.legalType,
                        }}
                      />
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
