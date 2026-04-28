"use client";
import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatRub } from "@/lib/format";
import { getCounterpartyAmlDetail } from "@/app/actions";

export const AML_RISK_CONFIG = {
  LOW:    { label: "Низкий риск",  color: "text-success",     dotColor: "bg-success",     bg: "bg-success/5",      border: "border-success/30"    },
  MEDIUM: { label: "Средний риск", color: "text-amber-600",   dotColor: "bg-amber-500",   bg: "bg-amber-50",       border: "border-amber-200"     },
  HIGH:   { label: "Высокий риск", color: "text-destructive", dotColor: "bg-destructive", bg: "bg-destructive/5",  border: "border-destructive/30" },
} as const;

export function AmlRiskBadge({ riskLevel }: { riskLevel: string }) {
  const cfg = AML_RISK_CONFIG[riskLevel as keyof typeof AML_RISK_CONFIG] ?? AML_RISK_CONFIG.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  SUPPLIER: "Поставщик",
  BUYER:    "Покупатель",
  PARTNER:  "Партнёр",
  TAX:      "Налоговый орган",
  OTHER:    "Прочие",
};

function getRiskFactors(riskLevel: string, verifiedAt: number | null, status: string) {
  return [
    { ok: true,                       warn: false, text: "ИНН соответствует реестру ФНС"                       },
    { ok: status !== "BLOCKED",       warn: false, text: "Нет ограничений от Росфинмониторинга"                 },
    { ok: riskLevel !== "HIGH",       warn: false, text: "Отсутствует в реестре дроперов ЦБ"                   },
    { ok: riskLevel === "LOW",        warn: true,  text: "Нет признаков транзитных операций"                   },
    { ok: verifiedAt !== null,        warn: true,  text: "Верификация пройдена (ФНС / ЕГРЮЛ)"                  },
    { ok: riskLevel === "LOW",        warn: false, text: "Соответствие критериям ст. 6 Федерального закона 115-ФЗ" },
  ];
}

export type AmlCp = {
  id: string;
  name: string;
  inn: string;
  status: string;
  riskLevel: string;
  category: string | null;
  verifiedAt: number | null;
  notes: string | null;
  legalType: string | null;
};

type AmlOp = {
  id: string;
  type: string;
  amountCents: number;
  statusDashboard: string;
  purpose: string | null;
  createdAt: number;
};

export function AmlReportSheet({ open, onClose, cp }: { open: boolean; onClose: () => void; cp: AmlCp }) {
  const [tab, setTab] = useState<"risk" | "ops">("risk");
  const [ops, setOps] = useState<AmlOp[] | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);

  useEffect(() => {
    if (open) { setTab("risk"); setOps(null); }
  }, [open, cp.id]);

  function handleTab(t: "risk" | "ops") {
    setTab(t);
    if (t === "ops" && ops === null) {
      setOpsLoading(true);
      getCounterpartyAmlDetail(cp.id).then(({ ops: o }) => {
        setOps(o as AmlOp[]);
        setOpsLoading(false);
      });
    }
  }

  const risk = AML_RISK_CONFIG[cp.riskLevel as keyof typeof AML_RISK_CONFIG] ?? AML_RISK_CONFIG.LOW;
  const factors = getRiskFactors(cp.riskLevel, cp.verifiedAt, cp.status);
  const totalOps = ops?.length ?? 0;
  const totalAmt = ops?.reduce((s, o) => s + o.amountCents, 0) ?? 0;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-start gap-3 pb-4">
            <div className={`h-10 w-10 rounded-lg ${risk.bg} border ${risk.border} flex items-center justify-center shrink-0 mt-0.5`}>
              <Shield className={`h-5 w-5 ${risk.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-[15px] leading-tight">{cp.name}</SheetTitle>
              <div className="text-xs text-muted-foreground mt-0.5">
                ИНН {cp.inn}{cp.legalType ? ` · ${cp.legalType}` : ""}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <AmlRiskBadge riskLevel={cp.riskLevel} />
                {cp.category && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                    {CATEGORY_LABELS[cp.category] ?? cp.category}
                  </Badge>
                )}
                {cp.status === "BLOCKED" && (
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">Заблокирован</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex border-b -mx-6 px-6">
            {([["risk", "Риск 115-ФЗ"], ["ops", "Операции"]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTab(id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === "risk" && (
            <>
              <div className={`rounded-lg border ${risk.border} ${risk.bg} p-4`}>
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Уровень риска (115-ФЗ)
                </div>
                <div className={`text-xl font-bold ${risk.color}`}>{risk.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  На основании критериев Приказа Росфинмониторинга №361 от 22.11.2018
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Факторы оценки</div>
                <div className="rounded-lg border divide-y overflow-hidden">
                  {factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      {f.ok
                        ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        : f.warn
                          ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <span className={`text-sm ${f.ok ? "" : f.warn ? "text-amber-700" : "text-destructive"}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Реквизиты</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "Статус",         value: cp.status === "ACTIVE" ? "Активен" : cp.status === "BLOCKED" ? "Заблокирован" : "В архиве" },
                    { label: "Категория",      value: cp.category ? (CATEGORY_LABELS[cp.category] ?? cp.category) : "—" },
                    { label: "Верификация",    value: cp.verifiedAt ? formatDate(cp.verifiedAt) : "Не проводилась" },
                    { label: "Правовая форма", value: cp.legalType ?? "—" },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="text-[11px] text-muted-foreground mb-0.5">{r.label}</div>
                      <div className="text-sm font-medium">{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {cp.notes && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Комментарий комплаенса
                    </div>
                    <div className={`rounded-lg border p-3 text-sm leading-relaxed ${
                      cp.riskLevel === "HIGH"
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}>
                      {cp.notes}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "ops" && (
            <>
              {opsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка истории...
                </div>
              ) : !ops || ops.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <div className="text-sm">Нет операций с этим контрагентом</div>
                  <div className="text-xs mt-1">Операции появятся после первого платежа</div>
                </div>
              ) : (
                <>
                  <div className={`rounded-lg border ${risk.border} ${risk.bg} p-4 flex justify-between items-center`}>
                    <div>
                      <div className="text-xs text-muted-foreground">Операций</div>
                      <div className="text-2xl font-bold">{totalOps}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Сумма</div>
                      <div className="text-xl font-bold tabular">{formatRub(totalAmt / 100)}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">История</div>
                    <div className="rounded-lg border divide-y overflow-hidden">
                      {ops.slice(0, 20).map(op => (
                        <div key={op.id} className="flex items-start justify-between px-3 py-2.5 gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-muted-foreground truncate">{op.purpose ?? "—"}</div>
                            <div className="text-[11px] text-muted-foreground tabular mt-0.5">{formatDateTime(op.createdAt)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-medium tabular">{formatRub(op.amountCents / 100)}</div>
                            <div className={`text-[10px] mt-0.5 ${
                              op.statusDashboard === "EXECUTED" ? "text-success"
                              : op.statusDashboard === "REJECTED" ? "text-destructive"
                              : "text-muted-foreground"
                            }`}>
                              {op.statusDashboard === "EXECUTED" ? "Исполнено"
                                : op.statusDashboard === "REJECTED" ? "Отклонено"
                                : op.statusDashboard}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
