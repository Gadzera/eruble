import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  bankStatusLabel, bankStatusVariant, dashboardStatusLabel, dashboardStatusVariant,
  erpStatusLabel, erpStatusVariant, platformStatusLabel, platformStatusVariant,
  registryStatusLabel, registryStatusVariant,
} from "@/lib/status";

type Kind = "dashboard" | "bank" | "platform" | "erp" | "registry";

const map: Record<Kind, { l: Record<string, string>; v: Record<string, BadgeProps["variant"]> }> = {
  dashboard: { l: dashboardStatusLabel, v: dashboardStatusVariant },
  bank: { l: bankStatusLabel, v: bankStatusVariant },
  platform: { l: platformStatusLabel, v: platformStatusVariant },
  erp: { l: erpStatusLabel, v: erpStatusVariant },
  registry: { l: registryStatusLabel, v: registryStatusVariant },
};

export function StatusBadge({ kind, status, dim = false }: { kind: Kind; status: string | null | undefined; dim?: boolean }) {
  if (!status) {
    return <Badge variant="muted" className={`max-w-full ${dim ? "opacity-50" : ""}`}>—</Badge>;
  }
  const m = map[kind];
  const label = m.l[status] ?? status;
  return (
    <Badge variant={m.v[status] ?? "secondary"} className="max-w-full overflow-hidden" title={label}>
      <span className="truncate">{label}</span>
    </Badge>
  );
}
