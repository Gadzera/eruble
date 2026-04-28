"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function OperationsFilters({
  current,
  banks,
}: {
  current: { status?: string; type?: string; bankId?: string; q?: string };
  banks: { id: string; short: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string | undefined) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "ALL") params.delete(key);
    else params.set(key, value);
    params.delete("op");
    router.push(`/operations?${params.toString()}`);
  }

  const hasFilters = !!(current.status || current.type || current.bankId || current.q);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={current.q ?? ""}
          placeholder="ИНН, имя, ID операции…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") update("q", e.currentTarget.value || undefined);
          }}
        />
      </div>

      <Select value={current.status ?? "ALL"} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Статус" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все статусы</SelectItem>
          <SelectItem value="DRAFT">Черновик</SelectItem>
          <SelectItem value="PENDING_APPROVAL">На согласовании</SelectItem>
          <SelectItem value="SUBMITTED">Отправлено</SelectItem>
          <SelectItem value="EXECUTED">Исполнено</SelectItem>
          <SelectItem value="REJECTED">Отказ</SelectItem>
        </SelectContent>
      </Select>

      <Select value={current.type ?? "ALL"} onValueChange={(v) => update("type", v)}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Тип" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все типы</SelectItem>
          <SelectItem value="B2B_TRANSFER">B2B-перевод</SelectItem>
          <SelectItem value="CASH_IN">Пополнение ЦР</SelectItem>
          <SelectItem value="CASH_OUT">Вывод с ЦР</SelectItem>
          <SelectItem value="REGISTRY_ITEM">Из реестра</SelectItem>
        </SelectContent>
      </Select>

      <Select value={current.bankId ?? "ALL"} onValueChange={(v) => update("bankId", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Канал" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все банки</SelectItem>
          {banks.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.short}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/operations")}>
          <X className="h-4 w-4" /> Сбросить
        </Button>
      )}
    </div>
  );
}
