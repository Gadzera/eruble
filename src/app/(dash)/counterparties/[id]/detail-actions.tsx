"use client";
import { useState, useTransition } from "react";
import { ShieldCheck, Ban, RotateCcw, Archive, Pencil, MoreHorizontal, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verifyCounterparty, setCounterpartyStatus } from "@/app/actions";
import { AmlReportSheet, type AmlCp } from "@/components/app/aml-report-sheet";
import { EditCounterpartySheet, type EditCpFields } from "./edit-sheet";

type Props = {
  id: string;
  status: string;
  verifiedAt: number | null;
  cp: EditCpFields & { id: string };
};

export function CounterpartyDetailActions({ id, status, verifiedAt, cp }: Props) {
  const [pending, start] = useTransition();
  const [amlOpen, setAmlOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  function run(fn: () => Promise<void>) {
    start(fn);
  }

  const amlCp: AmlCp = {
    id: cp.id,
    name: cp.name ?? "",
    inn: cp.inn ?? "",
    status,
    riskLevel: cp.riskLevel ?? "LOW",
    category: cp.category ?? null,
    verifiedAt,
    notes: cp.notes ?? null,
    legalType: cp.legalType ?? null,
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          disabled={pending}
        >
          <Pencil className="h-3.5 w-3.5" />
          Редактировать
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={pending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setAmlOpen(true)}>
              <Shield className="h-4 w-4 text-primary" />
              AML-отчёт 115-ФЗ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!verifiedAt && (
              <DropdownMenuItem onClick={() => run(() => verifyCounterparty(id))}>
                <ShieldCheck className="h-4 w-4 text-success" />
                Верифицировать
              </DropdownMenuItem>
            )}
            {status === "ACTIVE" && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => run(() => setCounterpartyStatus(id, "BLOCKED"))}
              >
                <Ban className="h-4 w-4" />
                Заблокировать
              </DropdownMenuItem>
            )}
            {status === "BLOCKED" && (
              <DropdownMenuItem onClick={() => run(() => setCounterpartyStatus(id, "ACTIVE"))}>
                <RotateCcw className="h-4 w-4" />
                Разблокировать
              </DropdownMenuItem>
            )}
            {status !== "ARCHIVED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-muted-foreground"
                  onClick={() => run(() => setCounterpartyStatus(id, "ARCHIVED"))}
                >
                  <Archive className="h-4 w-4" />
                  В архив
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AmlReportSheet open={amlOpen} onClose={() => setAmlOpen(false)} cp={amlCp} />
      <EditCounterpartySheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        id={id}
        initial={cp}
      />
    </>
  );
}
