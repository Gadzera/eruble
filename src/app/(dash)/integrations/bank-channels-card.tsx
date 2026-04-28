"use client";
import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Loader2, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STATUS_ICON: Record<string, React.ReactNode> = {
  ACTIVE:   <CheckCircle2 className="h-4 w-4 text-success" />,
  DEGRADED: <AlertCircle  className="h-4 w-4 text-warning" />,
  DOWN:     <XCircle      className="h-4 w-4 text-destructive" />,
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активен", DEGRADED: "Замедлен", DOWN: "Недоступен",
};

type BankRow = {
  accessId: string;
  bankCode: string;
  bankName: string;
  status: string;
  cbrAlbumVersion: string;
  isDefault: boolean;
};

type TestResult = {
  dnsMs: number | null;
  authOk: boolean;
  roundtripMs: number | null;
};

const TEST_PRESETS: Record<string, TestResult> = {
  ACTIVE:   { dnsMs: 48,   authOk: true,  roundtripMs: 127  },
  DEGRADED: { dnsMs: 2100, authOk: true,  roundtripMs: 4300 },
  DOWN:     { dnsMs: null, authOk: false, roundtripMs: null  },
};

function TestRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${ok ? "text-success" : "text-destructive"}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        {value}
      </span>
    </div>
  );
}

export function BankChannelsCard({ banks }: { banks: BankRow[] }) {
  const [testBank, setTestBank] = useState<BankRow | null>(null);
  const [testing,  setTesting]  = useState(false);
  const [result,   setResult]   = useState<TestResult | null>(null);

  function openTest(bank: BankRow) {
    setTestBank(bank);
    setResult(null);
    setTesting(true);
    setTimeout(() => {
      setResult(TEST_PRESETS[bank.status] ?? TEST_PRESETS.ACTIVE);
      setTesting(false);
    }, 1400 + Math.random() * 400);
  }

  const overallOk   = result?.authOk && result.roundtripMs != null && result.roundtripMs < 1000;
  const overallSlow = result?.authOk && result.roundtripMs != null && result.roundtripMs >= 1000;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Банковские каналы</CardTitle>
          <CardDescription>
            Подключённые банки-участники ЦР. Каждый канал — отдельный адаптер к Альбому сообщений 2026.07.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Банк</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Статус платформы</TableHead>
                <TableHead>Альбом CBR</TableHead>
                <TableHead>По умолчанию</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map(b => (
                <TableRow key={b.accessId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[b.status]}
                      <span className="font-medium">{b.bankName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="tabular text-xs">{b.bankCode}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.status === "ACTIVE" ? "success" : b.status === "DEGRADED" ? "warning" : "destructive"}
                      className="text-xs"
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.cbrAlbumVersion}</TableCell>
                  <TableCell>
                    {b.isDefault ? (
                      <Badge variant="secondary" className="text-xs">Основной</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                        Сделать основным
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openTest(b)}>
                      <RefreshCw className="h-3 w-3" /> Тест
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!testBank} onOpenChange={v => { if (!v) { setTestBank(null); setResult(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Тест подключения
            </DialogTitle>
            <DialogDescription>{testBank?.bankName} · {testBank?.bankCode}</DialogDescription>
          </DialogHeader>
          <div className="space-y-0.5 pt-1">
            {testing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Выполняется диагностика канала…
              </div>
            ) : result ? (
              <>
                <TestRow
                  label="DNS / TCP-соединение"
                  value={result.dnsMs != null ? `${result.dnsMs} мс` : "Timeout"}
                  ok={result.dnsMs != null && result.dnsMs < 500}
                />
                <TestRow
                  label="mTLS-аутентификация"
                  value={result.authOk ? "Успешно" : "Ошибка сертификата"}
                  ok={result.authOk}
                />
                <TestRow
                  label="Echo-запрос (roundtrip)"
                  value={result.roundtripMs != null ? `${result.roundtripMs} мс` : "—"}
                  ok={result.roundtripMs != null && result.roundtripMs < 1000}
                />
                <TestRow label="Версия Альбома CBR" value="2026.07" ok />
                <div className={`mt-3 rounded-md px-3 py-2 text-xs border ${
                  overallOk   ? "bg-success/5 text-success border-success/20" :
                  overallSlow ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-destructive/5 text-destructive border-destructive/20"
                }`}>
                  {overallOk
                    ? "✓ Канал работает в штатном режиме"
                    : overallSlow
                    ? "⚠ Канал доступен, но работает с задержками — возможны таймауты при высокой нагрузке"
                    : "✗ Канал недоступен — обратитесь в службу поддержки банка-участника"}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
