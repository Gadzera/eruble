"use client";
import { useState } from "react";
import { Check, FileSpreadsheet, Upload, ShieldCheck, Send, ChevronRight, AlertCircle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, label: "Источник" },
  { id: 2, label: "Валидация" },
  { id: 3, label: "Согласование" },
  { id: 4, label: "Отправка" },
];

type Bank = { accessId: string; bankShort: string; status: string };

const SAMPLE_VALID = [
  { name: 'ООО "Ромашка"', inn: "7707083893", dr: "DR000000000045", amount: 125000.5, purpose: "Оплата по договору №15" },
  { name: 'ООО "Стандарт"', inn: "7720000044", dr: "DR000000000112", amount: 87500, purpose: "Услуги по договору №31" },
  { name: 'АО "ЦифровыеРешения"', inn: "7708022300", dr: "DR000000000107", amount: 245000, purpose: "Поставка оборудования" },
  { name: 'ООО "Электрон"', inn: "7726000077", dr: "DR000000000115", amount: 38900, purpose: "Услуги связи апрель 2026" },
];
const SAMPLE_INVALID = [
  { name: 'ООО "БезИНН"', inn: "", dr: "DR000000000234", amount: 50000, error: "MISSING_INN", errorMsg: "Не указан ИНН получателя" },
  { name: 'АО "БадФормат"', inn: "770308", dr: "DR000000000999", amount: 10000, error: "INVALID_INN", errorMsg: "ИНН не соответствует контрольной сумме" },
];

export function RegistryWizard({ banks, defaultBankAccessId }: { banks: Bank[]; defaultBankAccessId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState("VENDOR");
  const [source, setSource] = useState("CSV");
  const [bank, setBank] = useState(defaultBankAccessId);
  const [policy, setPolicy] = useState("STANDARD");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ valid: typeof SAMPLE_VALID; invalid: typeof SAMPLE_INVALID } | null>(null);

  function fakeUpload() {
    setFileName(`registry_${Date.now()}.csv`);
    setTimeout(() => {
      setParsed({ valid: SAMPLE_VALID, invalid: SAMPLE_INVALID });
      setStep(2);
    }, 600);
  }

  function fake1cImport() {
    setFileName("1С:ЗУП → Зарплата 04.2026 (87 строк)");
    setTimeout(() => {
      setParsed({ valid: SAMPLE_VALID, invalid: [] });
      setStep(2);
    }, 800);
  }

  const valid = parsed?.valid ?? [];
  const invalid = parsed?.invalid ?? [];
  const total = valid.length + invalid.length;
  const totalAmount = valid.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
                step > s.id ? "bg-success text-white" : step === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span className={cn("text-sm font-medium", step >= s.id ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Источник данных</CardTitle>
            <CardDescription>Откуда взять список получателей</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Тип реестра">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYROLL">Зарплата</SelectItem>
                    <SelectItem value="VENDOR">Поставщикам</SelectItem>
                    <SelectItem value="TAX">Налоги</SelectItem>
                    <SelectItem value="DIVIDEND">Дивиденды</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Канал банка">
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.accessId} value={b.accessId}>{b.bankShort}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={fake1cImport}
                className="rounded-lg border-2 border-dashed p-6 text-left hover:border-primary hover:bg-primary/[0.02] transition-colors"
              >
                <Database className="h-7 w-7 text-primary mb-2" />
                <div className="font-semibold">Импорт из 1С</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Прямое подключение к 1С:ЗУП / 1С:Бухгалтерия. Маппинг полей по шаблону.
                </div>
                <Badge variant="info" className="mt-3">рекомендуется</Badge>
              </button>

              <label className="rounded-lg border-2 border-dashed p-6 text-left hover:border-primary hover:bg-primary/[0.02] transition-colors cursor-pointer block">
                <Upload className="h-7 w-7 text-primary mb-2" />
                <div className="font-semibold">Загрузить файл</div>
                <div className="text-xs text-muted-foreground mt-1">CSV, XLSX, XML. Шаблон доступен по ссылке ниже.</div>
                <Input type="file" accept=".csv,.xlsx,.xml" className="hidden" onChange={fakeUpload} />
                <Button variant="outline" className="mt-3" type="button" asChild>
                  <span><FileSpreadsheet className="h-4 w-4" /> Выбрать файл</span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <a href="#" className="text-primary hover:underline">Скачать шаблон CSV</a>
              <span>Поддерживаются ИНН, БИК, счёт ЦР, сумма, назначение</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Валидация</CardTitle>
            <CardDescription>Файл «{fileName}» обработан · {total} строк</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Всего строк" value={total} />
              <Stat label="Валидных" value={valid.length} tone="success" />
              <Stat label="С ошибками" value={invalid.length} tone={invalid.length > 0 ? "warning" : "neutral"} />
            </div>

            {invalid.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-destructive mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Найдены ошибки в {invalid.length} строках
                </div>
                <ul className="space-y-1 text-xs">
                  {invalid.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive font-mono">{r.error}</span>
                      <span className="text-muted-foreground">— {r.errorMsg} ({r.name})</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">Авто-исправить формат</Button>
                  <Button variant="outline" size="sm">Исключить и продолжить</Button>
                </div>
              </div>
            )}

            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2 px-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">№</th>
                    <th className="text-left p-2 px-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Получатель</th>
                    <th className="text-left p-2 px-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Счёт ЦР</th>
                    <th className="text-right p-2 px-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Сумма</th>
                    <th className="text-left p-2 px-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {[...valid, ...invalid].slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 px-3 tabular text-muted-foreground">{i + 1}</td>
                      <td className="p-2 px-3">
                        <div className="font-medium">{r.name}</div>
                        {r.inn && <div className="text-xs text-muted-foreground tabular">ИНН {r.inn}</div>}
                      </td>
                      <td className="p-2 px-3 tabular text-xs text-muted-foreground">{r.dr}</td>
                      <td className="p-2 px-3 text-right tabular font-medium">{formatRub(r.amount)}</td>
                      <td className="p-2 px-3">
                        {"error" in r ? (
                          <Badge variant="destructive" className="text-[10px]">{r.error}</Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px]">VALID</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Назад</Button>
              <Button onClick={() => setStep(3)}>
                Далее: согласование <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Маршрутизация и согласование</CardTitle>
            <CardDescription>{valid.length} платежей на сумму {formatRub(totalAmount)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Политика согласования">
              <Select value={policy} onValueChange={setPolicy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Стандарт — одна подпись</SelectItem>
                  <SelectItem value="DUAL_SIGNATURE">Двойная подпись (CFO + ChiefAccountant)</SelectItem>
                  <SelectItem value="EXPRESS">Срочная — без согласования (только привилегированные роли)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="rounded-md border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="font-medium">Цепочка одобрений:</div>
              {policy === "STANDARD" && (
                <ol className="space-y-1.5 text-muted-foreground">
                  <li>1. <span className="text-foreground font-medium">Approver</span> — Кузнецова О.И.</li>
                  <li>2. <span className="text-foreground font-medium">Treasurer</span> — Петрова Е.В. (финальная подпись)</li>
                </ol>
              )}
              {policy === "DUAL_SIGNATURE" && (
                <ol className="space-y-1.5 text-muted-foreground">
                  <li>1. <span className="text-foreground font-medium">ChiefAccountant</span> — Подпись 1</li>
                  <li>2. <span className="text-foreground font-medium">CFO</span> — Иванов А.С. — Подпись 2</li>
                </ol>
              )}
              {policy === "EXPRESS" && (
                <div className="text-amber-700 text-xs">⚠ Доступно только для CFO. Будет залогировано как срочное действие.</div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Назад</Button>
              <Button onClick={() => setStep(4)}>
                <ShieldCheck className="h-4 w-4" /> Отправить на согласование
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Реестр направлен на согласование</CardTitle>
                <CardDescription>{valid.length} платежей на сумму {formatRub(totalAmount)} · политика: {policy}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-card p-3 text-sm">
              <div className="font-medium mb-1">Что произойдёт дальше</div>
              <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                <li>Подписанты получат уведомление в дашборде</li>
                <li>После всех подписей реестр уйдёт пакетом в банк-участник</li>
                <li>Банк направит распоряжения в платформу Банка России (XML, альбом 2026.1)</li>
                <li>Платформа исполнит платежи; статусы поступят в обратном порядке: платформа → банк → дашборд → ERP</li>
                <li>Сверка с ERP/1С — автоматически после получения статуса EXECUTED</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/registries")}>К реестрам</Button>
              <Button variant="outline" onClick={() => { setStep(1); setParsed(null); setFileName(null); }}>
                Создать ещё один
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "success" | "warning" }) {
  return (
    <div className="rounded-md border p-3 bg-card">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold tabular mt-1 ${tone === "success" ? "text-success" : tone === "warning" ? "text-amber-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}
