"use client";
import { useState, useTransition } from "react";
import { MoreHorizontal, ShieldCheck, Ban, Archive, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verifyCounterparty, setCounterpartyStatus } from "@/app/actions";
import { AmlReportSheet, type AmlCp } from "@/components/app/aml-report-sheet";

type Props = {
  id: string;
  status: string;
  verifiedAt: number | null;
  amlCp: AmlCp;
};

export function RowActions({ id, status, verifiedAt, amlCp }: Props) {
  const [pending, start] = useTransition();
  const [amlOpen, setAmlOpen] = useState(false);

  function run(fn: () => Promise<void>) {
    start(fn);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAmlOpen(true)}>
            <Shield className="h-4 w-4 text-primary" /> AML-отчёт 115-ФЗ
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!verifiedAt && (
            <DropdownMenuItem onClick={() => run(() => verifyCounterparty(id))}>
              <ShieldCheck className="h-4 w-4 text-success" /> Верифицировать
            </DropdownMenuItem>
          )}
          {status === "ACTIVE" && (
            <DropdownMenuItem
              onClick={() => run(() => setCounterpartyStatus(id, "BLOCKED"))}
              className="text-destructive"
            >
              <Ban className="h-4 w-4" /> Заблокировать
            </DropdownMenuItem>
          )}
          {status === "BLOCKED" && (
            <DropdownMenuItem onClick={() => run(() => setCounterpartyStatus(id, "ACTIVE"))}>
              <RotateCcw className="h-4 w-4" /> Разблокировать
            </DropdownMenuItem>
          )}
          {status !== "ARCHIVED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => run(() => setCounterpartyStatus(id, "ARCHIVED"))}
                className="text-muted-foreground"
              >
                <Archive className="h-4 w-4" /> В архив
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AmlReportSheet open={amlOpen} onClose={() => setAmlOpen(false)} cp={amlCp} />
    </>
  );
}
