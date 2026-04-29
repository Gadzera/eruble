import { notFound } from "next/navigation";
import {
  Building2, CreditCard, Phone, ShieldAlert, Info, Users,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCounterparty } from "@/lib/queries";
import { formatDate } from "@/lib/format";

// ─── Category & risk labels ────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  SUPPLIER: "Поставщик",
  BUYER: "Покупатель",
  PARTNER: "Партнёр",
  TAX: "Налоговый орган",
  OTHER: "Прочее",
};

const RISK_LABEL: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
};

const RISK_COLOR: Record<string, string> = {
  LOW: "text-success",
  MEDIUM: "text-amber-600",
  HIGH: "text-destructive",
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function OsnovnoePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const cp = getCounterparty(id);
  if (!cp || cp.orgId !== session.orgId) notFound();

  const hasBank = cp.bik || cp.bankName || cp.bankAccount || cp.corrAccount;
  const hasContacts = cp.contactPerson || cp.email || cp.phone;
  const hasRisk = cp.category || cp.riskLevel;
  const hasDirector = cp.directorName || cp.directorInn;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

      {/* ── Идентификация ─────────────────────────────────────────────────── */}
      <Section
        icon={<Building2 className="h-4 w-4" />}
        title="Идентификация"
      >
        <FieldRow label="Краткое наименование">{cp.name}</FieldRow>
        {cp.fullName && (
          <FieldRow label="Полное наименование">
            <span className="text-sm leading-snug">{cp.fullName}</span>
          </FieldRow>
        )}
        <FieldRow label="Правовая форма">{cp.legalType ?? "—"}</FieldRow>
        <FieldRow label="ИНН">
          <span className="tabular font-mono text-[13px]">{cp.inn}</span>
        </FieldRow>
        {cp.kpp && (
          <FieldRow label="КПП">
            <span className="tabular font-mono text-[13px]">{cp.kpp}</span>
          </FieldRow>
        )}
        {cp.ogrn && (
          <FieldRow label={cp.legalType === "ИП" ? "ОГРНИП" : "ОГРН"}>
            <span className="tabular font-mono text-[13px]">{cp.ogrn}</span>
          </FieldRow>
        )}
        {cp.legalAddress && (
          <FieldRow label="Юридический адрес">
            <span className="text-sm leading-snug">{cp.legalAddress}</span>
          </FieldRow>
        )}
        <FieldRow label="Добавлен">{formatDate(cp.createdAt)}</FieldRow>
        {cp.verifiedAt && (
          <FieldRow label="Верифицирован">{formatDate(cp.verifiedAt)}</FieldRow>
        )}
      </Section>

      {/* ── Банковские реквизиты ──────────────────────────────────────────── */}
      <Section
        icon={<CreditCard className="h-4 w-4" />}
        title="Банковские реквизиты"
        empty={!hasBank && !cp.drAccountRef}
        emptyText="Реквизиты не указаны"
      >
        {cp.drAccountRef && (
          <FieldRow label="Счёт Цифрового рубля" highlight>
            <span className="tabular font-mono text-[13px] text-primary font-medium">
              {cp.drAccountRef}
            </span>
          </FieldRow>
        )}
        {cp.bankName && <FieldRow label="Банк">{cp.bankName}</FieldRow>}
        {cp.bik && (
          <FieldRow label="БИК">
            <span className="tabular font-mono text-[13px]">{cp.bik}</span>
          </FieldRow>
        )}
        {cp.bankAccount && (
          <FieldRow label="Расчётный счёт">
            <span className="tabular font-mono text-[13px] tracking-wide">{cp.bankAccount}</span>
          </FieldRow>
        )}
        {cp.corrAccount && (
          <FieldRow label="Корреспондентский счёт">
            <span className="tabular font-mono text-[13px] tracking-wide">{cp.corrAccount}</span>
          </FieldRow>
        )}
        {!hasBank && !cp.drAccountRef && null}
      </Section>

      {/* ── Контакты ─────────────────────────────────────────────────────── */}
      <Section
        icon={<Phone className="h-4 w-4" />}
        title="Контакты"
        empty={!hasContacts}
        emptyText="Контактные данные не указаны"
      >
        {cp.contactPerson && (
          <FieldRow label="Контактное лицо">{cp.contactPerson}</FieldRow>
        )}
        {cp.email && (
          <FieldRow label="Email">
            <a
              href={`mailto:${cp.email}`}
              className="text-primary hover:underline text-sm tabular"
            >
              {cp.email}
            </a>
          </FieldRow>
        )}
        {cp.phone && (
          <FieldRow label="Телефон">
            <a
              href={`tel:${cp.phone}`}
              className="text-primary hover:underline text-sm tabular"
            >
              {cp.phone}
            </a>
          </FieldRow>
        )}
      </Section>

      {/* ── 115-ФЗ Классификация ──────────────────────────────────────────── */}
      <Section
        icon={<ShieldAlert className="h-4 w-4" />}
        title="115-ФЗ · Классификация"
        empty={!hasRisk && !cp.notes}
        emptyText="Классификация не задана"
      >
        {cp.category && (
          <FieldRow label="Категория">
            {CATEGORY_LABEL[cp.category] ?? cp.category}
          </FieldRow>
        )}
        {cp.riskLevel && (
          <FieldRow label="Уровень риска">
            <span className={`font-medium ${RISK_COLOR[cp.riskLevel] ?? ""}`}>
              {RISK_LABEL[cp.riskLevel] ?? cp.riskLevel}
            </span>
          </FieldRow>
        )}
        {cp.notes && (
          <div className="mt-1 pt-3 border-t">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Комментарий комплаенса
            </div>
            <p className="text-sm leading-relaxed text-foreground/80 max-w-prose">
              {cp.notes}
            </p>
          </div>
        )}
      </Section>

      {/* ── Руководство ──────────────────────────────────────────────────── */}
      <Section
        icon={<Users className="h-4 w-4" />}
        title="Руководство"
        empty={!hasDirector}
        emptyText="Сведения о руководителе не указаны"
      >
        {cp.directorName && (
          <FieldRow label="Генеральный директор">
            <span className="font-medium">{cp.directorName}</span>
          </FieldRow>
        )}
        {cp.directorInn && (
          <FieldRow label="ИНН руководителя">
            <span className="tabular font-mono text-[13px]">{cp.directorInn}</span>
          </FieldRow>
        )}
        {cp.directorSince && (
          <FieldRow label="В должности с">{formatDate(cp.directorSince)}</FieldRow>
        )}
        {cp.employees != null && (
          <FieldRow label={`Сотрудников${cp.employeesYear ? ` (${cp.employeesYear})` : ""}`}>
            <span className="tabular">{cp.employees.toLocaleString("ru-RU")} чел.</span>
          </FieldRow>
        )}
        {cp.authorizedCapital != null && cp.authorizedCapital > 0 && (
          <FieldRow label="Уставный капитал">
            <span className="tabular font-mono text-[13px]">
              {cp.authorizedCapital.toLocaleString("ru-RU")} ₽
            </span>
          </FieldRow>
        )}
      </Section>

      {/* ── Служебная информация (full-width) ──────────────────────────────── */}
      <Section
        icon={<Info className="h-4 w-4" />}
        title="Служебная информация"
        className="lg:col-span-2"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">ID</div>
            <div className="text-xs font-mono tabular text-muted-foreground">{cp.id}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Статус</div>
            <div className="text-sm font-medium">
              {cp.status === "ACTIVE" ? "Активен" : cp.status === "BLOCKED" ? "Заблокирован" : "В архиве"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Верификация</div>
            <div className="text-sm">{cp.verifiedAt ? formatDate(cp.verifiedAt) : "Не проводилась"}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Добавлен</div>
            <div className="text-sm">{formatDate(cp.createdAt)}</div>
          </div>
        </div>
      </Section>

    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  empty,
  emptyText,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-card ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="px-4 py-3">
        {empty ? (
          <p className="text-sm text-muted-foreground py-1">{emptyText}</p>
        ) : (
          <div className="space-y-0 divide-y divide-border/60">{children}</div>
        )}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2.5 text-sm ${
        highlight ? "bg-primary/[0.03] -mx-4 px-4 rounded" : ""
      }`}
    >
      <span className="text-muted-foreground shrink-0 text-[13px]">{label}</span>
      <span className="text-right min-w-0 break-words">{children}</span>
    </div>
  );
}
