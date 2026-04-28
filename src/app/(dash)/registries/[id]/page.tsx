import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, FileDown, Send, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getRegistry, getRegistryItems } from "@/lib/queries";
import { formatDateTime, formatNum, formatRub, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registryTypeLabel } from "@/lib/status";

export default async function RegistryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const reg = getRegistry(id);
  if (!reg || reg.orgId !== session.orgId) notFound();

  const items = getRegistryItems(id);
  const invalidItems = items.filter((i) => i.status === "INVALID");

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/registries"><ArrowLeft className="h-4 w-4" /> К реестрам</Link>
        </Button>
      </div>

      <PageHeader
        title={`Реестр ${registryTypeLabel[reg.type] ?? reg.type}`}
        description={`${reg.fileName ?? reg.id} · загружен ${relativeTime(reg.createdAt)}`}
        actions={
          <>
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Протокол ошибок
            </Button>
            {reg.status === "PENDING_APPROVAL" && (
              <Button>
                <ShieldCheck className="h-4 w-4" /> Согласовать
              </Button>
            )}
            {reg.status === "VALIDATED" && (
              <Button>
                <Send className="h-4 w-4" /> На согласование
              </Button>
            )}
            {reg.rowsInvalid > 0 && reg.rowsRejected === 0 && (
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" /> Повторить ошибки
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat label="Всего записей" value={formatNum(reg.rowsTotal)} />
        <Stat label="Валидных" value={formatNum(reg.rowsValid)} tone="success" />
        <Stat label="С ошибками" value={formatNum(reg.rowsInvalid)} tone={reg.rowsInvalid > 0 ? "warning" : "neutral"} />
        <Stat label="Исполнено" value={formatNum(reg.rowsExecuted)} tone="success" />
        <Stat label="Сумма" value={formatRub(reg.totalAmountCents / 100)} />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Текущий статус</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Row label="Статус реестра">
            <StatusBadge kind="registry" status={reg.status} />
          </Row>
          <Row label="Политика согласования">
            <Badge variant="outline">{reg.approvalPolicy === "DUAL_SIGNATURE" ? "Двойная подпись" : "Стандарт"}</Badge>
          </Row>
          <Row label="Создан" value={formatDateTime(reg.createdAt)} />
          {reg.submittedAt && <Row label="Отправлен" value={formatDateTime(reg.submittedAt)} />}
          <Row label="Источник" value={reg.source} />
          <Row label="Канал банка" value={`bank #${reg.bankId.slice(-6)}`} />
        </CardContent>
      </Card>

      {invalidItems.length > 0 && (
        <Card className="mb-6 border-destructive/40 bg-destructive/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {formatNum(invalidItems.length)} {plural(invalidItems.length, ["запись с ошибкой", "записи с ошибками", "записей с ошибками"])}
            </CardTitle>
            <CardDescription>Требуют исправления до отправки. Можно исключить и отправить только валидные.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Записи ({items.length})</TabsTrigger>
          <TabsTrigger value="errors">Ошибки ({invalidItems.length})</TabsTrigger>
          <TabsTrigger value="approvals">Согласования</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Получатель</TableHead>
                    <TableHead>ИНН / Счёт ЦР</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Назначение</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.slice(0, 100).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground tabular">{item.rowNumber}</TableCell>
                      <TableCell className="text-sm font-medium">{item.recipientName}</TableCell>
                      <TableCell className="text-xs tabular text-muted-foreground">
                        {item.recipientInn && <div>ИНН {item.recipientInn}</div>}
                        {item.recipientDrRef && <div>{item.recipientDrRef}</div>}
                      </TableCell>
                      <TableCell className="text-right tabular font-medium">
                        {formatRub(item.amountCents / 100)}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                        {item.purpose}
                      </TableCell>
                      <TableCell>
                        {item.status === "VALID" && <Badge variant="info">Валидно</Badge>}
                        {item.status === "EXECUTED" && <Badge variant="success">Исполнено</Badge>}
                        {item.status === "REJECTED" && <Badge variant="destructive">Отказ</Badge>}
                        {item.status === "INVALID" && (
                          <div>
                            <Badge variant="destructive">Ошибка</Badge>
                            <div className="text-[11px] text-destructive mt-1">{item.errorMessage}</div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {items.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t">
                  Показано 100 из {formatNum(items.length)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardContent className="p-0">
              {invalidItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Ошибок нет</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">№</TableHead>
                      <TableHead>Получатель</TableHead>
                      <TableHead>Код ошибки</TableHead>
                      <TableHead>Описание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invalidItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="tabular">{item.rowNumber}</TableCell>
                        <TableCell className="text-sm">{item.recipientName}</TableCell>
                        <TableCell><Badge variant="destructive">{item.errorCode}</Badge></TableCell>
                        <TableCell className="text-sm">{item.errorMessage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              История согласований появится здесь.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Audit trail по реестру. Перейдите в раздел «Аудит и RegTech» для полной выборки.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: React.ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular mt-1 ${tone === "success" ? "text-success" : tone === "warning" ? "text-amber-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      {children ? children : <span className="tabular font-medium">{value}</span>}
    </div>
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
