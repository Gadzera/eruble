import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCounterparty, listCounterpartyOps } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AmlRiskBadge } from "@/components/app/aml-report-sheet";
import { counterpartyStatusVariant, counterpartyStatusLabel } from "@/lib/status";
import { CounterpartyDetailActions } from "./detail-actions";

const TABS = [
  { href: "osnovnoe", label: "Основное" },
  { href: "nadezhnost", label: "Надёжность" },
  { href: "operacii", label: "Операции" },
  { href: "audit", label: "Аудит" },
] as const;

const LEGAL_TYPE_LABEL: Record<string, string> = {
  "ЮЛ": "Юр. лицо",
  "ИП": "ИП",
  "ФЛ": "Физ. лицо",
};

function formatMoney(rubles: number): string {
  if (rubles >= 1_000_000_000) return `${(rubles / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} млрд ₽`;
  if (rubles >= 1_000_000) return `${(rubles / 1_000_000).toFixed(1).replace(/\.0$/, "")} млн ₽`;
  if (rubles >= 1_000) return `${(rubles / 1_000).toFixed(0)} тыс. ₽`;
  return `${rubles} ₽`;
}

function companyAge(registeredAt: number): string {
  const ms = Date.now() - registeredAt;
  const years = Math.floor(ms / (365.25 * 86400_000));
  const months = Math.floor((ms % (365.25 * 86400_000)) / (30.44 * 86400_000));
  if (years === 0) return `${months} мес.`;
  if (months === 0) return `${years} лет`;
  return `${years} л. ${months} мес.`;
}

export default async function CounterpartyDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const cp = getCounterparty(id);
  if (!cp || cp.orgId !== session.orgId) notFound();

  const ops = listCounterpartyOps(session.orgId, id);
  const executedOps = ops.filter(o => o.statusDashboard === "EXECUTED");
  const totalAmountCents = executedOps.reduce((s, o) => s + o.amountCents, 0);
  const lastOp = executedOps[0];

  const statusVariant = counterpartyStatusVariant[cp.status] ?? "secondary";
  const statusLabel = counterpartyStatusLabel[cp.status] ?? cp.status;

  // FNS risk flags count
  const fnsFlags = [
    cp.fnsDebt, cp.fnsMassDirector, cp.fnsInvalid,
    cp.fnsBankrupt, cp.fnsSanctions, cp.fnsCbBlacklist,
  ].filter(Boolean).length;

  return (
    <>
      {/* ── Back nav ── */}
      <div className="mb-3 -mt-1">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/counterparties">
            <ArrowLeft className="h-3.5 w-3.5" />
            Контрагенты
          </Link>
        </Button>
      </div>

      {/* ── Entity header ── */}
      <div className="mb-0">
        <div className="flex items-start justify-between gap-6">
          {/* Left: identity */}
          <div className="min-w-0 flex-1">
            {/* Name + status badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight leading-tight">{cp.name}</h1>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>

            {/* Full name (subdued, only if different) */}
            {cp.fullName && cp.fullName !== cp.name && (
              <div className="mt-0.5 text-sm text-muted-foreground leading-snug truncate max-w-xl">
                {cp.fullName}
              </div>
            )}

            {/* Primary identifiers row */}
            <div className="mt-2 flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-muted-foreground">
              <span>
                <span className="text-[11px] uppercase tracking-wider mr-1">ИНН</span>
                <span className="tabular font-mono">{cp.inn}</span>
              </span>
              {cp.ogrn && (
                <span>
                  <span className="text-[11px] uppercase tracking-wider mr-1">ОГРН</span>
                  <span className="tabular font-mono">{cp.ogrn}</span>
                </span>
              )}
              {cp.kpp && (
                <span>
                  <span className="text-[11px] uppercase tracking-wider mr-1">КПП</span>
                  <span className="tabular font-mono">{cp.kpp}</span>
                </span>
              )}
              {cp.registeredAt && (
                <span>
                  <span className="text-muted-foreground/70 mr-1">Регистрация</span>
                  <span>{formatDate(cp.registeredAt)}</span>
                  <span className="text-muted-foreground/50 ml-1">· {companyAge(cp.registeredAt)}</span>
                </span>
              )}
              {cp.region && (
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground/70">⌖</span>
                  {cp.region}
                </span>
              )}
              {cp.okved && (
                <span>
                  <span className="text-[11px] uppercase tracking-wider mr-1">ОКВЭД</span>
                  <span className="tabular">{cp.okved}</span>
                  {cp.okvedName && (
                    <span className="text-muted-foreground/60 ml-1 hidden md:inline">· {cp.okvedName}</span>
                  )}
                </span>
              )}
            </div>

            {/* Status strip */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {LEGAL_TYPE_LABEL[cp.legalType ?? ""] ?? cp.legalType}
              </span>
              <AmlRiskBadge riskLevel={cp.riskLevel ?? "LOW"} />
              {fnsFlags > 0 && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                  ⚠ {fnsFlags} флаг{fnsFlags > 1 ? "а" : ""} ФНС
                </span>
              )}
              {cp.drAccountRef && (
                <span className="tabular font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                  {cp.drAccountRef}
                </span>
              )}
              {cp.verifiedAt ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <ShieldCheck className="h-3 w-3" />
                  Верифицирован {formatDate(cp.verifiedAt)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Не верифицирован</span>
              )}
            </div>
          </div>

          {/* Right: quick stats + actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {/* Quick stats */}
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Операций</div>
                <div className="text-sm font-semibold tabular">{ops.length}</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Оборот</div>
                <div className="text-sm font-semibold tabular">
                  {totalAmountCents > 0 ? formatMoney(Math.round(totalAmountCents / 100)) : "—"}
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Последняя</div>
                <div className="text-sm tabular text-muted-foreground">
                  {lastOp ? formatDate(lastOp.executedAt ?? lastOp.createdAt) : "—"}
                </div>
              </div>
              {cp.authorizedCapital && cp.authorizedCapital > 0 && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Уст. капитал</div>
                    <div className="text-sm font-semibold tabular">{formatMoney(cp.authorizedCapital)}</div>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <CounterpartyDetailActions
              id={cp.id}
              status={cp.status}
              verifiedAt={cp.verifiedAt}
              cp={{
                id: cp.id,
                name: cp.name,
                inn: cp.inn,
                kpp: cp.kpp ?? undefined,
                ogrn: cp.ogrn ?? undefined,
                legalType: cp.legalType ?? undefined,
                fullName: cp.fullName ?? undefined,
                legalAddress: cp.legalAddress ?? undefined,
                bik: cp.bik ?? undefined,
                bankName: cp.bankName ?? undefined,
                bankAccount: cp.bankAccount ?? undefined,
                corrAccount: cp.corrAccount ?? undefined,
                drAccountRef: cp.drAccountRef ?? undefined,
                contactPerson: cp.contactPerson ?? undefined,
                email: cp.email ?? undefined,
                phone: cp.phone ?? undefined,
                category: cp.category ?? undefined,
                riskLevel: cp.riskLevel ?? undefined,
                notes: cp.notes ?? undefined,
              }}
            />
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="mt-5 flex gap-0 border-b">
          {TABS.map((tab) => (
            <TabLink key={tab.href} href={`/counterparties/${id}/${tab.href}`}>
              {tab.label}
            </TabLink>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="mt-5">{children}</div>
    </>
  );
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors
        hover:text-foreground
        [&[aria-current=page]]:text-foreground
        [&[aria-current=page]]:after:absolute
        [&[aria-current=page]]:after:bottom-0
        [&[aria-current=page]]:after:left-0
        [&[aria-current=page]]:after:right-0
        [&[aria-current=page]]:after:h-0.5
        [&[aria-current=page]]:after:bg-primary
        [&[aria-current=page]]:after:rounded-t"
    >
      {children}
    </Link>
  );
}
