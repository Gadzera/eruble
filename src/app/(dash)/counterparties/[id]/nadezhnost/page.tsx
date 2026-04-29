import { notFound } from "next/navigation";
import {
  ShieldCheck, ShieldAlert, ShieldX, AlertTriangle,
  Ban, Building2, Landmark, Gavel,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCounterparty } from "@/lib/queries";
import { formatDate } from "@/lib/format";

type CheckStatus = "ok" | "warn" | "na";

function CheckRow({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: CheckStatus;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 shrink-0">
        {status === "ok" && <ShieldCheck className="h-4 w-4 text-success" />}
        {status === "warn" && <ShieldX className="h-4 w-4 text-destructive" />}
        {status === "na" && <ShieldAlert className="h-4 w-4 text-muted-foreground/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-xs font-medium shrink-0 ${
            status === "ok" ? "text-success" :
            status === "warn" ? "text-destructive" :
            "text-muted-foreground"
          }`}>
            {status === "ok" ? "Нет сведений" : status === "warn" ? "Выявлено" : "Не проверялось"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

export default async function NadezhnostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const cp = getCounterparty(id);
  if (!cp || cp.orgId !== session.orgId) notFound();

  const checks = [
    {
      label: "Налоговая задолженность",
      description: "Наличие задолженности по уплате налогов и сборов согласно реестру ФНС России",
      flag: cp.fnsDebt,
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      label: "Массовый руководитель",
      description: "Руководитель числится в нескольких организациях (реестр дисквалифицированных/массовых лиц ФНС)",
      flag: cp.fnsMassDirector,
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      label: "Недостоверность сведений",
      description: "Наличие записи в ЕГРЮЛ о недостоверности сведений о руководителе, учредителях или адресе",
      flag: cp.fnsInvalid,
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      label: "Банкротство",
      description: "Сведения о процедурах банкротства, финансового оздоровления или ликвидации",
      flag: cp.fnsBankrupt,
      icon: <Gavel className="h-4 w-4" />,
    },
    {
      label: "Санкционные списки",
      description: "Проверка по санкционным спискам ООН, EU, OFAC, SDN и реестрам Росфинмониторинга",
      flag: cp.fnsSanctions,
      icon: <Ban className="h-4 w-4" />,
    },
    {
      label: "Чёрный список ЦБ РФ",
      description: "Реестр организаций, которым ЦБ РФ отказал в открытии счётов (Федеральный закон №115-ФЗ, ст. 7.7)",
      flag: cp.fnsCbBlacklist,
      icon: <ShieldX className="h-4 w-4" />,
    },
  ];

  const flagCount = checks.filter(c => c.flag).length;
  const checkedAt = cp.fnsCheckedAt;
  const hasAnyData = checks.some(c => c.flag !== null && c.flag !== undefined);

  return (
    <div className="space-y-4">

      {/* Summary card */}
      <div className={`rounded-lg border p-4 flex items-center gap-4 ${
        flagCount === 0
          ? "bg-success/5 border-success/20"
          : "bg-destructive/5 border-destructive/20"
      }`}>
        <div className={`rounded-full p-2 ${flagCount === 0 ? "bg-success/10" : "bg-destructive/10"}`}>
          {flagCount === 0
            ? <ShieldCheck className="h-5 w-5 text-success" />
            : <ShieldAlert className="h-5 w-5 text-destructive" />
          }
        </div>
        <div className="flex-1">
          <div className={`text-sm font-semibold ${flagCount === 0 ? "text-success" : "text-destructive"}`}>
            {flagCount === 0
              ? "Нарушений не выявлено"
              : `Выявлено ${flagCount} нарушени${flagCount === 1 ? "е" : "я"}`
            }
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {checkedAt
              ? `Последняя проверка: ${formatDate(checkedAt)}`
              : "Данные не обновлялись"
            }
            {" · "}
            {checks.length} проверок по реестрам ФНС и ЦБ РФ
          </div>
        </div>
      </div>

      {/* Checks list */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Проверки по реестрам</span>
          <span className="ml-auto text-xs text-muted-foreground">{checks.length} проверок</span>
        </div>
        <div className="px-4">
          {checks.map((check) => (
            <CheckRow
              key={check.label}
              label={check.label}
              description={check.description}
              status={
                !hasAnyData ? "na" :
                check.flag ? "warn" : "ok"
              }
            />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground px-1 leading-relaxed">
        Проверки выполняются по данным, внесённым вручную. Для автоматической актуализации
        необходима интеграция с API ФНС / СПАРК / Контур.Фокус. Результаты носят информационный
        характер и не заменяют юридическую экспертизу.
      </p>

    </div>
  );
}
