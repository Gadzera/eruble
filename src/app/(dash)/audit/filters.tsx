"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AuditFilters({ current }: { current: { severity?: string; q?: string } }) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string | undefined) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "ALL") params.delete(key);
    else params.set(key, value);
    router.push(`/audit?${params.toString()}`);
  }

  const hasFilters = !!(current.severity || current.q);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={current.q ?? ""}
          placeholder="Актор, действие, объект…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") update("q", e.currentTarget.value || undefined);
          }}
        />
      </div>
      <Select value={current.severity ?? "ALL"} onValueChange={(v) => update("severity", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Уровень" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все события</SelectItem>
          <SelectItem value="INFO">INFO</SelectItem>
          <SelectItem value="WARN">WARN</SelectItem>
          <SelectItem value="CRITICAL">CRITICAL</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/audit")}>
          <X className="h-4 w-4" /> Сбросить
        </Button>
      )}
    </div>
  );
}
