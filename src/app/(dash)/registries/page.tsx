import Link from "next/link";
import { Plus, FileSpreadsheet, Upload } from "lucide-react";
import { requireSession } from "@/lib/session";
import { listRegistries } from "@/lib/queries";
import { formatDateTime, formatNum, formatRub, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { registryTypeLabel } from "@/lib/status";

export default async function RegistriesPage() {
  const session = await requireSession();
  const items = listRegistries(session.orgId);

  return (
    <>
      <PageHeader
        title="Реестры выплат"
        description="Массовые операции: зарплаты, оплата поставщикам, налоги, дивиденды. Импорт из 1С / CSV / XLSX, валидация, одобрение, исполнение."
        actions={
          <Button asChild>
            <Link href="/registries/new"><Plus className="h-4 w-4" /> Новый реестр</Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <div className="font-medium">Реестров пока нет</div>
            <div className="text-sm text-muted-foreground mt-1">Загрузите первый реестр зарплат или платежей поставщикам</div>
            <Button asChild className="mt-4">
              <Link href="/registries/new"><Upload className="h-4 w-4" /> Загрузить реестр</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Реестр</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead className="text-right">Записей</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{r.fileName ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground tabular">{r.id}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{registryTypeLabel[r.type] ?? r.type}</Badge></TableCell>
                    <TableCell><span className="text-xs tabular">{r.source}</span></TableCell>
                    <TableCell className="text-right tabular">
                      {formatNum(r.rowsTotal)}
                      {r.rowsInvalid > 0 && (
                        <div className="text-[11px] text-destructive">{r.rowsInvalid} с ошибками</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular font-medium">
                      {formatRub(r.totalAmountCents / 100)}
                    </TableCell>
                    <TableCell><StatusBadge kind="registry" status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">
                      {formatDateTime(r.createdAt)}
                      <div className="text-[11px]">{relativeTime(r.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/registries/${r.id}`}>Открыть</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
