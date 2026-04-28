"use client";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Send, Save, X, FileCode2, ShieldCheck, Info, Shield, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRub, formatRubWhole } from "@/lib/format";
import { createPayment, submitPayment } from "@/app/actions";
import { AmlReportSheet, AmlRiskBadge, AML_RISK_CONFIG, type AmlCp } from "@/components/app/aml-report-sheet";

const VAT_RATES = [
  { value: "RATE_22", label: "22%",     rate: 22 },
  { value: "RATE_20", label: "20%",     rate: 20 },
  { value: "RATE_10", label: "10%",     rate: 10 },
  { value: "RATE_0",  label: "0%",      rate: 0  },
  { value: "NONE",    label: "Без НДС", rate: 0  },
  { value: "MANUAL",  label: "Вручную", rate: -1 },
] as const;

function calcVat(amountRub: number, vatRate: string, manualVat?: number): number {
  if (vatRate === "MANUAL") return manualVat ?? 0;
  const r = VAT_RATES.find(v => v.value === vatRate);
  if (!r || r.rate <= 0) return 0;
  return Math.round(amountRub / (100 + r.rate) * r.rate * 100) / 100;
}

const schema = z.object({
  recipient_inn:    z.string().regex(/^\d{10}(\d{2})?$/, "ИНН: 10 или 12 цифр"),
  recipient_name:   z.string().min(2, "Введите наименование"),
  recipient_dr_ref: z.string().regex(/^DR\d{12}$/, "Формат: DR + 12 цифр"),
  amount:           z.coerce.number({ error: "Введите корректную сумму" }).positive("Сумма должна быть > 0"),
  vat_rate:         z.string().default("NONE"),
  purpose:          z.string().min(5, "Минимум 5 символов").max(500),
  bank_access_id:   z.string().min(1),
  execution_date:   z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Counterparty = {
  id: string;
  inn: string;
  name: string;
  drRef: string;
  riskLevel: string;
  category: string | null;
  status: string;
  notes: string | null;
  legalType: string | null;
  verifiedAt: number | null;
};

type Props = {
  defaultBankAccessId: string;
  banks: { accessId: string; bankShort: string; bankName: string; status: string }[];
  availableBalanceRub: number;
  payerOrgName: string;
  payerInn: string;
  counterparties: Counterparty[];
};

export function PaymentForm({
  defaultBankAccessId, banks, availableBalanceRub, payerOrgName, payerInn, counterparties,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<"draft" | "review" | "submitted">("draft");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [cbrMsgId, setCbrMsgId] = useState<string | null>(null);
  const [manualVat, setManualVat] = useState<string>("");
  const [selectedCpId, setSelectedCpId] = useState<string | null>(null);
  const [amlOpen, setAmlOpen] = useState(false);
  const [cpOpen, setCpOpen] = useState(false);
  const [cpSearch, setCpSearch] = useState("");

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      recipient_inn: "", recipient_name: "", recipient_dr_ref: "",
      amount: undefined as unknown as number,
      vat_rate: "NONE",
      purpose: "",
      bank_access_id: defaultBankAccessId,
      execution_date: new Date().toISOString().slice(0, 10),
    },
  });

  const v = form.watch();
  const vatAmount = calcVat(v.amount || 0, v.vat_rate, parseFloat(manualVat) || 0);
  const vatLabel  = VAT_RATES.find(r => r.value === v.vat_rate)?.label ?? "Без НДС";

  const vatPurposeHint = useMemo(() => {
    if (v.vat_rate === "NONE") return 'Добавьте в назначение: «НДС не предусмотрен»';
    if (v.vat_rate === "RATE_0") return 'Добавьте в назначение: «НДС 0%»';
    if (vatAmount > 0) return `Добавьте в назначение: «в т.ч. ${vatLabel} – ${formatRub(vatAmount)}»`;
    return null;
  }, [v.vat_rate, vatAmount, vatLabel]);

  const xmlPreview = useMemo(() => buildXml({
    payerOrgName, payerInn,
    recipientInn: v.recipient_inn || "", recipientName: v.recipient_name || "",
    recipientDrRef: v.recipient_dr_ref || "",
    amount: v.amount || 0, vatAmount, vatLabel,
    purpose: v.purpose || "",
    participantCode: banks.find(b => b.accessId === v.bank_access_id)?.bankShort.toUpperCase() ?? "BANK",
    executionDate: v.execution_date ?? new Date().toISOString().slice(0, 10),
  }), [v, payerOrgName, payerInn, banks, vatAmount, vatLabel]);

  const validation = useMemo(() => ({
    balanceOk: (v.amount || 0) > 0 && (v.amount || 0) <= availableBalanceRub,
    amountOk:  (v.amount || 0) > 0 && (v.amount || 0) <= 5_000_000,
    bankOk:    (banks.find(b => b.accessId === v.bank_access_id)?.status ?? "ACTIVE") === "ACTIVE",
    needsApproval: (v.amount || 0) >= 500_000,
    vatFilled: v.vat_rate !== "",
  }), [v, availableBalanceRub, banks]);

  const selectedCp = selectedCpId ? counterparties.find(c => c.id === selectedCpId) : null;
  const riskCfg = selectedCp ? (AML_RISK_CONFIG[selectedCp.riskLevel as keyof typeof AML_RISK_CONFIG] ?? AML_RISK_CONFIG.LOW) : null;

  const filteredCps = useMemo(() => {
    const q = cpSearch.trim().toLowerCase();
    if (!q) return counterparties;
    const words = q.split(/\s+/);
    return counterparties.filter(c => {
      const name = c.name.toLowerCase();
      return c.inn.includes(q) || words.some(w => name.includes(w));
    });
  }, [counterparties, cpSearch]);

  function pickCounterparty(cpId: string) {
    const cp = counterparties.find(c => c.id === cpId);
    if (!cp) return;
    form.setValue("recipient_inn", cp.inn, { shouldValidate: true });
    form.setValue("recipient_name", cp.name, { shouldValidate: true });
    form.setValue("recipient_dr_ref", cp.drRef, { shouldValidate: true });
    setSelectedCpId(cpId);
  }

  async function handleSendForApproval(values: FormValues) {
    start(async () => {
      const id = await createPayment({
        recipientInn: values.recipient_inn, recipientName: values.recipient_name,
        recipientDrRef: values.recipient_dr_ref,
        amountRub: values.amount, purpose: values.purpose,
        bankAccessId: values.bank_access_id,
      });
      setCreatedId(id);
      setStep("review");
    });
  }

  async function handleSignAndSubmit() {
    if (!createdId) return;
    start(async () => {
      const msgId = await submitPayment(createdId);
      setCbrMsgId(msgId);
      setStep("submitted");
    });
  }

  if (step === "submitted") {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>Распоряжение направлено в банк</CardTitle>
              <CardDescription>
                ID: <span className="tabular font-medium">{createdId}</span> · CBR Msg:{" "}
                <span className="tabular font-medium">{cbrMsgId}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-card p-3 text-sm">
            <div className="font-medium mb-2">Жизненный цикл</div>
            <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
              <li>Дашборд: <span className="text-foreground font-medium">SUBMITTED</span></li>
              <li>Банк: <span className="text-foreground font-medium">ACCEPTED_BY_BANK</span></li>
              <li>Платформа БР: <span className="text-foreground font-medium">IN_PROCESS → EXECUTED</span></li>
              <li>ERP / 1С: автопроводка после EXECUTED</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/operations")}>Перейти к операциям</Button>
            <Button variant="outline" onClick={() => { setStep("draft"); setCreatedId(null); setCbrMsgId(null); form.reset(); }}>
              Ещё один платёж
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "review") {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Подписание и отправка</CardTitle>
            <CardDescription>Проверьте реквизиты перед подписью — изменить после отправки нельзя.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["ID операции",         createdId ?? "—",                             true],
                  ["Получатель",          `${v.recipient_name} (ИНН ${v.recipient_inn})`, false],
                  ["Счёт ЦР получателя",  v.recipient_dr_ref,                           true],
                  ["Сумма",               formatRub(v.amount || 0),                     false],
                  ["НДС",                 vatAmount > 0 ? `${vatLabel} – ${formatRub(vatAmount)}` : vatLabel, false],
                  ["Назначение",          v.purpose,                                    false],
                  ["Канал",               banks.find(b => b.accessId === v.bank_access_id)?.bankName ?? "—", false],
                  ["Дата исполнения",     v.execution_date ?? "—",                      false],
                ].map(([label, value, mono]) => (
                  <tr key={label as string} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap w-[180px]">{label}</td>
                    <td className={`py-2 font-medium ${mono ? "tabular font-mono text-xs" : ""}`}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-4 flex gap-2">
              <Button onClick={handleSignAndSubmit} disabled={pending} className="flex-1">
                <ShieldCheck className="h-4 w-4" /> Подписать и отправить
              </Button>
              <Button variant="ghost" onClick={() => setStep("draft")}><X className="h-4 w-4" /> Назад</Button>
            </div>
          </CardContent>
        </Card>
        <XmlCard xml={xmlPreview} />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSendForApproval)}>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Main form ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-4 pb-4">

              {/* Плательщик */}
              <SectionLabel>Плательщик</SectionLabel>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 border mb-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{payerOrgName}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular shrink-0">ИНН {payerInn}</span>
              </div>

              <div className="border-t mb-3" />

              {/* Получатель */}
              <div className="flex items-center justify-between mb-2">
                <SectionLabel className="mb-0">Получатель</SectionLabel>
                <div className="flex items-center gap-2">
                  {selectedCp && <AmlRiskBadge riskLevel={selectedCp.riskLevel} />}
                  <Popover open={cpOpen} onOpenChange={open => { setCpOpen(open); if (!open) setCpSearch(""); }}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-7 w-52 flex items-center justify-between gap-1.5 rounded-md border px-2.5 text-xs text-left hover:bg-accent transition-colors truncate"
                      >
                        {selectedCp ? (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedCp.riskLevel === "HIGH" ? "bg-destructive" : selectedCp.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-success"}`} />
                            <span className="truncate">{selectedCp.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground truncate">Из справочника…</span>
                        )}
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-80" align="end">
                      <div className="p-2 border-b">
                        <Input
                          autoFocus
                          placeholder="Поиск по названию или ИНН…"
                          value={cpSearch}
                          onChange={e => setCpSearch(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {filteredCps.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-3 py-2">Не найдено</p>
                        ) : filteredCps.map(cp => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => { pickCounterparty(cp.id); setCpOpen(false); setCpSearch(""); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left transition-colors ${selectedCpId === cp.id ? "bg-accent/60 font-medium" : ""}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cp.riskLevel === "HIGH" ? "bg-destructive" : cp.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-success"}`} />
                            <span className="truncate flex-1">{cp.name}</span>
                            <span className="text-muted-foreground tabular shrink-0">{cp.inn}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <FF label="ИНН *" error={form.formState.errors.recipient_inn?.message}>
                  <Input
                    {...form.register("recipient_inn")}
                    placeholder="7707083893"
                    className="tabular text-sm"
                    onChange={e => {
                      form.register("recipient_inn").onChange(e);
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length === 10 || val.length === 12) {
                        const match = counterparties.find(c => c.inn === val);
                        if (match) { pickCounterparty(match.id); return; }
                      }
                      setSelectedCpId(null);
                    }}
                  />
                </FF>
                <div className="col-span-2">
                  <FF label="Наименование *" error={form.formState.errors.recipient_name?.message}>
                    <Input {...form.register("recipient_name")} placeholder='ООО "Ромашка"' className="text-sm" />
                  </FF>
                </div>
                <div className="col-span-2">
                  <FF label="Счёт ЦР получателя *" error={form.formState.errors.recipient_dr_ref?.message}>
                    <Input {...form.register("recipient_dr_ref")} placeholder="DR000000000045" className="tabular text-sm" />
                  </FF>
                </div>
              </div>

              <div className="border-t mb-3" />

              {/* Реквизиты платежа */}
              <SectionLabel>Реквизиты платежа</SectionLabel>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <FF label="Сумма (₽) *" error={form.formState.errors.amount?.message}>
                  <Input
                    type="number" step="0.01"
                    {...form.register("amount", { valueAsNumber: true })}
                    placeholder="125 000.50"
                    className="tabular text-sm font-medium"
                  />
                </FF>
                <div className="col-span-2">
                  <FF label="НДС">
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {VAT_RATES.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => form.setValue("vat_rate", r.value)}
                          className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                            v.vat_rate === r.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent text-muted-foreground"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    {v.vat_rate === "MANUAL" && (
                      <Input
                        type="number" step="0.01"
                        placeholder="Сумма НДС вручную"
                        value={manualVat}
                        onChange={e => setManualVat(e.target.value)}
                        className="mt-2 tabular text-sm"
                      />
                    )}
                    {vatAmount > 0 && v.vat_rate !== "MANUAL" && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        В т.ч. НДС: <span className="tabular font-medium text-foreground">{formatRub(vatAmount)}</span>
                      </p>
                    )}
                  </FF>
                </div>
                <FF label="Дата исполнения">
                  <Input type="date" {...form.register("execution_date")} className="tabular text-sm" />
                </FF>
                <div className="col-span-2">
                  <FF label="Канал (банк-участник)">
                    <Select value={v.bank_access_id} onValueChange={val => form.setValue("bank_access_id", val)}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {banks.map(b => (
                          <SelectItem key={b.accessId} value={b.accessId}>
                            {b.bankShort} — {b.bankName}
                            {b.status === "DEGRADED" ? " · замедлен" : b.status === "DOWN" ? " · недоступен" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FF>
                </div>
                <div className="col-span-3">
                  <FF label="Назначение платежа *" error={form.formState.errors.purpose?.message}>
                    <Textarea
                      {...form.register("purpose")}
                      placeholder="Оплата по договору №15 от 10.04.2026, в т.ч. НДС 20% – 20 833,33 ₽"
                      rows={2}
                      maxLength={500}
                      className="text-sm resize-none"
                    />
                    {vatPurposeHint && (
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                        <Info className="h-3 w-3 shrink-0" />{vatPurposeHint}
                      </p>
                    )}
                  </FF>
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex gap-2 mt-3">
            <Button type="submit" disabled={pending}>
              <Send className="h-4 w-4" /> На согласование
            </Button>
            <Button type="button" variant="outline" disabled={pending}>
              <Save className="h-4 w-4" /> Черновик
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/")}>
              Отмена
            </Button>
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Проверки и политика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <CheckItem ok={validation.balanceOk} label={`Остаток: ${formatRubWhole(availableBalanceRub)}`} />
              <CheckItem ok={validation.amountOk} label="Лимит роли не превышен (5 000 000 ₽)" />
              <CheckItem
                ok={validation.bankOk}
                warn={!validation.bankOk}
                label={validation.bankOk ? "Канал банка активен" : "Канал работает с задержкой"}
              />
              <CheckItem ok={validation.vatFilled} label="Ставка НДС указана" />
              <CheckItem ok={true} label="Idempotency-ключ генерируется при сохранении" info />
              {validation.needsApproval && (
                <CheckItem ok={true} label="Требуется согласование (≥ 500 000 ₽)" info />
              )}
            </CardContent>
          </Card>

          {/* AML card */}
          {selectedCp && riskCfg && (
            <Card className={`border ${riskCfg.border}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`h-3.5 w-3.5 ${riskCfg.color}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">115-ФЗ профиль</span>
                </div>
                <AmlRiskBadge riskLevel={selectedCp.riskLevel} />
                <div className="text-xs text-muted-foreground mt-1 truncate">{selectedCp.name}</div>
                {selectedCp.riskLevel === "HIGH" && (
                  <div className="text-xs text-destructive mt-2 bg-destructive/5 rounded px-2 py-1.5 leading-snug">
                    ⚠ Высокий риск — операция требует проверки комплаенса
                  </div>
                )}
                {selectedCp.riskLevel === "MEDIUM" && (
                  <div className="text-xs text-amber-700 mt-2 bg-amber-50 rounded px-2 py-1.5 leading-snug">
                    Средний риск — рекомендуется запрос документов
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2.5 h-7 text-xs"
                  type="button"
                  onClick={() => setAmlOpen(true)}
                >
                  Открыть AML-отчёт
                </Button>
              </CardContent>
            </Card>
          )}

          <XmlCard xml={xmlPreview} />
        </div>
      </div>

      {selectedCp && (
        <AmlReportSheet
          open={amlOpen}
          onClose={() => setAmlOpen(false)}
          cp={selectedCp as AmlCp}
        />
      )}
    </form>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 ${className ?? ""}`}>
      {children}
    </p>
  );
}

function FF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function CheckItem({ ok, label, warn, info }: { ok: boolean; label: string; warn?: boolean; info?: boolean }) {
  const Icon = ok ? Check : AlertCircle;
  const color = warn ? "text-amber-500" : info ? "text-primary" : ok ? "text-success" : "text-destructive";
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
      <span className="text-foreground/90">{label}</span>
    </div>
  );
}

function XmlCard({ xml }: { xml: string }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
        <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
        <CardTitle className="text-xs">XML-распоряжение (preview)</CardTitle>
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5">2026.1</Badge>
      </CardHeader>
      <CardContent>
        <pre className="text-[10px] leading-relaxed bg-muted/50 rounded-md p-3 overflow-x-auto tabular max-h-64">
{xml}
        </pre>
      </CardContent>
    </Card>
  );
}

function buildXml(p: {
  payerOrgName: string; payerInn: string;
  recipientInn: string; recipientName: string; recipientDrRef: string;
  amount: number; vatAmount: number; vatLabel: string;
  purpose: string; participantCode: string; executionDate: string;
}) {
  const messageId = "00000000-0000-0000-0000-000000000000";
  const created = new Date().toISOString().replace(/\.\d{3}Z$/, "+03:00");
  const vatBlock = p.vatAmount > 0
    ? `\n  <VatAmount rate="${p.vatLabel}" currency="RUB">${p.vatAmount.toFixed(2)}</VatAmount>`
    : `\n  <VatAmount rate="NO_VAT"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<DigitalRublePaymentOrder xmlns="urn:dr:orders:2026.1">
  <Header>
    <MessageId>${messageId}</MessageId>
    <CreatedAt>${created}</CreatedAt>
    <ParticipantId>${esc(p.participantCode)}</ParticipantId>
    <OrderType>B2B_TRANSFER</OrderType>
    <ExecutionDate>${p.executionDate}</ExecutionDate>
  </Header>
  <Payer>
    <OrgName>${esc(p.payerOrgName)}</OrgName>
    <Inn>${p.payerInn}</Inn>
    <DigitalRubleAccount>DR000000000001</DigitalRubleAccount>
  </Payer>
  <Recipient>
    <OrgName>${esc(p.recipientName)}</OrgName>
    <Inn>${p.recipientInn}</Inn>
    <DigitalRubleAccount>${p.recipientDrRef}</DigitalRubleAccount>
  </Recipient>
  <Amount currency="RUB">${p.amount.toFixed(2)}</Amount>${vatBlock}
  <Purpose>${esc(p.purpose)}</Purpose>
</DigitalRublePaymentOrder>`;
}

function esc(s: string) {
  return s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
}
