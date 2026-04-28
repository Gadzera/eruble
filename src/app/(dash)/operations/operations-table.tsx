"use client";
import { useState, useEffect, useCallback, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Settings2, RotateCcw, GripVertical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/app/status-badge";
import { formatRub, formatDateTime } from "@/lib/format";
import { operationTypeLabel } from "@/lib/status";

export type OpRow = {
  id: string;
  type: string;
  bankShort: string | null;
  recipientInn: string | null;
  recipientName: string | null;
  recipientDrRef: string | null;
  purpose: string | null;
  amountCents: number;
  statusDashboard: string;
  statusBank: string | null;
  statusPlatform: string | null;
  statusErp: string | null;
  createdAt: number;
};

type ColDef = { id: string; label: string; visible: boolean };

const DEFAULT_COLS: ColDef[] = [
  { id: "id",              label: "ID",          visible: true  },
  { id: "recipient",       label: "Получатель",  visible: true  },
  { id: "type",            label: "Тип",         visible: true  },
  { id: "bank",            label: "Банк",        visible: true  },
  { id: "amount",          label: "Сумма",       visible: true  },
  { id: "statusDashboard", label: "Статус",      visible: true  },
  { id: "statusBank",      label: "Ст.банка",    visible: true  },
  { id: "statusPlatform",  label: "Платформа",   visible: true  },
  { id: "statusErp",       label: "ERP",         visible: true  },
  { id: "createdAt",       label: "Создано",     visible: true  },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  id:              148,
  recipient:       220,
  type:            110,
  bank:             96,
  amount:          200,
  statusDashboard: 108,
  statusBank:       98,
  statusPlatform:  105,
  statusErp:        70,
  createdAt:       154,
};

const STORAGE_KEY = "eruble-ops-cols-v2";
const WIDTHS_KEY  = "eruble-ops-widths-v1";

function loadCols(): ColDef[] {
  if (typeof window === "undefined") return DEFAULT_COLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLS;
    const saved: ColDef[] = JSON.parse(raw);
    const ids = new Set(saved.map(c => c.id));
    const missing = DEFAULT_COLS.filter(c => !ids.has(c.id));
    return [...saved, ...missing];
  } catch { return DEFAULT_COLS; }
}

function loadWidths(): Record<string, number> {
  if (typeof window === "undefined") return DEFAULT_WIDTHS;
  try {
    const raw = localStorage.getItem(WIDTHS_KEY);
    if (!raw) return DEFAULT_WIDTHS;
    return { ...DEFAULT_WIDTHS, ...JSON.parse(raw) };
  } catch { return DEFAULT_WIDTHS; }
}

// ── Repeat-payment button with 1s delayed tooltip ───────────────────────────
function RepeatButton({ op }: { op: OpRow }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter() { timer.current = setTimeout(() => setShow(true), 1000); }
  function onLeave() { if (timer.current) clearTimeout(timer.current); setShow(false); }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const p = new URLSearchParams();
    if (op.recipientInn)  p.set("inn",     op.recipientInn);
    if (op.recipientName) p.set("name",    op.recipientName);
    if (op.recipientDrRef) p.set("dr",     op.recipientDrRef);
    p.set("amount",  String(op.amountCents / 100));
    if (op.purpose)       p.set("purpose", op.purpose);
    router.push(`/payments/new?${p.toString()}`);
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Button variant="ghost" size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
        onClick={handleClick}
        aria-label="Повторить платёж">
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      {show && (
        <div className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background shadow-md pointer-events-none z-50">
          Повторить платёж
        </div>
      )}
    </div>
  );
}

// ── Column visibility popover (order via in-table drag) ─────────────────────
function ColumnConfigPanel({ cols, setCols }: { cols: ColDef[]; setCols: (c: ColDef[]) => void }) {
  const visibleCount = cols.filter(c => c.visible).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4" />
          Столбцы
          {visibleCount < cols.length && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {visibleCount}/{cols.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Столбцы</span>
          <button
            type="button"
            onClick={() => setCols(DEFAULT_COLS)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Сбросить
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Порядок — перетащите заголовок в таблице
        </p>
        <div className="space-y-0.5">
          {cols.map(col => (
            <div key={col.id} className="flex items-center justify-between rounded px-1 py-1 hover:bg-accent/40">
              <span className="text-sm">{col.label}</span>
              <Switch
                checked={col.visible}
                onCheckedChange={() => setCols(cols.map(c => c.id === col.id ? { ...c, visible: !c.visible } : c))}
                aria-label={`Показать ${col.label}`}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Sortable + resizable header ──────────────────────────────────────────────
function SortableHead({
  col, width, onStartResize,
}: {
  col: ColDef;
  width: number;
  onStartResize: (id: string, e: React.MouseEvent, th: HTMLElement) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.id });

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        width, maxWidth: width,
        position: "relative", overflow: "hidden", userSelect: "none",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={col.id === "amount" ? "text-right" : undefined}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex items-center gap-1 cursor-grab active:cursor-grabbing pr-3 min-w-0 w-full"
        title={col.label}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <span className="truncate">{col.label}</span>
      </span>
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
          const th = (e.currentTarget as HTMLElement).closest("th") as HTMLElement;
          onStartResize(col.id, e, th);
        }}
      />
    </TableHead>
  );
}

// ── Cell renderer ────────────────────────────────────────────────────────────
function Cell({ colId, op }: { colId: string; op: OpRow }) {
  switch (colId) {
    case "id":
      return (
        <TableCell className="font-mono text-[11px] text-muted-foreground overflow-hidden">
          <span className="block truncate" title={op.id}>{op.id}</span>
        </TableCell>
      );
    case "recipient": {
      const isIncoming = op.type === "CASH_IN" || op.type === "QR_SETTLEMENT";
      const isCashOut  = op.type === "CASH_OUT";
      const name = op.recipientName
        ?? (op.type === "CASH_IN" ? "Пополнение ЦР-счёта" : isCashOut ? "Вывод на расчётный счёт" : "—");
      return (
        <TableCell className="overflow-hidden">
          <div className={`font-medium text-sm truncate ${isIncoming ? "text-success" : ""}`}>{name}</div>
          {op.recipientInn && (
            <div className="text-[11px] text-muted-foreground tabular">ИНН {op.recipientInn}</div>
          )}
        </TableCell>
      );
    }
    case "type":
      return (
        <TableCell>
          <Badge variant="outline" className="text-[11px] whitespace-nowrap">
            {operationTypeLabel[op.type] ?? op.type}
          </Badge>
        </TableCell>
      );
    case "bank":
      return (
        <TableCell>
          {op.bankShort
            ? <Badge variant="secondary" className="text-[11px]">{op.bankShort}</Badge>
            : <span className="text-muted-foreground text-sm">—</span>}
        </TableCell>
      );
    case "amount": {
      const isIncoming = op.type === "CASH_IN" || op.type === "QR_SETTLEMENT";
      return (
        <TableCell className="overflow-hidden">
          <div className={`tabular font-medium text-sm whitespace-nowrap text-right ${isIncoming ? "text-success" : ""}`}>
            {isIncoming ? "+" : ""}{formatRub(op.amountCents / 100)}
          </div>
          {op.purpose && (
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 text-right" title={op.purpose}>
              {op.purpose}
            </div>
          )}
        </TableCell>
      );
    }
    case "statusDashboard":
      return <TableCell className="overflow-hidden"><StatusBadge kind="dashboard" status={op.statusDashboard} /></TableCell>;
    case "statusBank":
      return <TableCell className="overflow-hidden"><StatusBadge kind="bank" status={op.statusBank} /></TableCell>;
    case "statusPlatform":
      return <TableCell className="overflow-hidden"><StatusBadge kind="platform" status={op.statusPlatform} /></TableCell>;
    case "statusErp":
      return <TableCell className="overflow-hidden"><StatusBadge kind="erp" status={op.statusErp} /></TableCell>;
    case "createdAt":
      return (
        <TableCell className="text-[11px] text-muted-foreground tabular whitespace-nowrap">
          {formatDateTime(op.createdAt)}
        </TableCell>
      );
    default:
      return <TableCell />;
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export function OperationsTable({ ops }: { ops: OpRow[] }) {
  const router = useRouter();
  const [cols, setColsRaw] = useState<ColDef[]>(DEFAULT_COLS);
  const [widths, setWidthsRaw] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const [hydrated, setHydrated] = useState(false);
  const widthsRef = useRef(DEFAULT_WIDTHS);

  useEffect(() => {
    const c = loadCols();
    const w = loadWidths();
    setColsRaw(c);
    setWidthsRaw(w);
    widthsRef.current = w;
    setHydrated(true);
  }, []);

  useEffect(() => { widthsRef.current = widths; }, [widths]);

  const setCols = useCallback((next: ColDef[]) => {
    setColsRaw(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const startResize = useCallback((colId: string, e: React.MouseEvent, thEl: HTMLElement) => {
    const startX = e.clientX;
    const startW = widthsRef.current[colId] ?? DEFAULT_WIDTHS[colId] ?? 80;
    function onMove(ev: MouseEvent) {
      const w = Math.max(50, startW + ev.clientX - startX);
      thEl.style.width = w + "px";
      thEl.style.maxWidth = w + "px";
      widthsRef.current = { ...widthsRef.current, [colId]: w };
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const next = { ...widthsRef.current };
      setWidthsRaw(next);
      try { localStorage.setItem(WIDTHS_KEY, JSON.stringify(next)); } catch {}
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oi = cols.findIndex(c => c.id === active.id);
      const ni = cols.findIndex(c => c.id === over.id);
      setCols(arrayMove(cols, oi, ni));
    }
  }

  const visible = (hydrated ? cols : DEFAULT_COLS).filter(c => c.visible);
  const tableMinWidth = visible.reduce((s, c) => s + (widths[c.id] ?? DEFAULT_WIDTHS[c.id] ?? 100), 0) + 36;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <ColumnConfigPanel cols={cols} setCols={setCols} />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table style={{ tableLayout: "fixed", minWidth: tableMinWidth }}>
            <TableHeader>
              <TableRow>
                <SortableContext items={visible.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                  {visible.map(c => (
                    <SortableHead
                      key={c.id}
                      col={c}
                      width={widths[c.id] ?? DEFAULT_WIDTHS[c.id]}
                      onStartResize={startResize}
                    />
                  ))}
                </SortableContext>
                <TableHead className="w-[36px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visible.length + 1} className="text-center py-12 text-muted-foreground">
                    Нет операций по выбранным фильтрам
                  </TableCell>
                </TableRow>
              )}
              {ops.map(op => (
                <TableRow
                  key={op.id}
                  className={`group cursor-pointer hover:bg-accent/50 ${op.type === "CASH_IN" || op.type === "QR_SETTLEMENT" ? "bg-success/[0.04]" : ""}`}
                  onClick={() => router.push(`/operations?op=${op.id}`)}
                >
                  {visible.map(c => <Cell key={c.id} colId={c.id} op={op} />)}
                  <TableCell className="p-1 w-[36px]" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      {op.type === "B2B_TRANSFER" && <RepeatButton op={op} />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
