"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, X, Settings2, RotateCcw, GripVertical, Eye, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/app/status-badge";
import { formatRub, formatDateTime } from "@/lib/format";
import { operationTypeLabel } from "@/lib/status";

export type FeedOp = {
  id: string;
  type: string;
  bankShort: string | null;
  recipientInn: string | null;
  recipientName: string | null;
  purpose: string | null;
  amountCents: number;
  statusDashboard: string;
  statusBank: string | null;
  statusPlatform: string | null;
  statusErp: string | null;
  createdAt: number;
};

const STATUS_FILTERS = [
  { id: "",                 label: "Все" },
  { id: "DRAFT",            label: "Черновики" },
  { id: "PENDING_APPROVAL", label: "Ожидают" },
  { id: "SUBMITTED",        label: "В обработке" },
  { id: "EXECUTED",         label: "Исполнено" },
  { id: "REJECTED",         label: "Отклонено" },
];

const TYPE_FILTERS = [
  { id: "",              label: "Все типы" },
  { id: "CASH_IN",       label: "Пополнения" },
  { id: "QR_SETTLEMENT", label: "Входящие" },
  { id: "B2B_TRANSFER",  label: "Переводы" },
  { id: "CASH_OUT",      label: "Выводы" },
  { id: "REGISTRY_ITEM", label: "Реестры" },
];

type ColDef = { id: string; label: string; visible: boolean };

const DEFAULT_COLS: ColDef[] = [
  { id: "recipient",      label: "Получатель",  visible: true  },
  { id: "type",           label: "Тип",         visible: true  },
  { id: "bank",           label: "Банк",        visible: true  },
  { id: "amount",         label: "Сумма",       visible: true  },
  { id: "status",         label: "Статус",      visible: true  },
  { id: "statusBank",     label: "Ст.банка",    visible: false },
  { id: "statusPlatform", label: "Платформа",   visible: false },
  { id: "statusErp",      label: "ERP",         visible: false },
  { id: "id",             label: "ID",          visible: false },
  { id: "createdAt",      label: "Создано",     visible: true  },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  id:              148,
  recipient:       200,
  type:            110,
  bank:             96,
  amount:          220,
  status:          126,
  statusBank:      100,
  statusPlatform:  105,
  statusErp:        72,
  createdAt:       154,
};

const COL_KEY    = "eruble-feed-cols-v4";
const WIDTHS_KEY = "eruble-feed-widths-v1";

function loadCols(): ColDef[] {
  if (typeof window === "undefined") return DEFAULT_COLS;
  try {
    const raw = localStorage.getItem(COL_KEY);
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

// ── Column visibility popover (order = drag table headers) ──────────────────
function ColPanel({ cols, setCols }: { cols: ColDef[]; setCols: (c: ColDef[]) => void }) {
  const visCount = cols.filter(c => c.visible).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Столбцы
          {visCount < cols.length && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">{visCount}/{cols.length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="end">
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
          Порядок — перетащите заголовок столбца в таблице
        </p>
        <div className="space-y-0.5">
          {cols.map(col => (
            <div key={col.id} className="flex items-center justify-between rounded px-1 py-1 hover:bg-accent/40">
              <span className="text-sm">{col.label}</span>
              <Switch
                checked={col.visible}
                onCheckedChange={() => setCols(cols.map(c => c.id === col.id ? { ...c, visible: !c.visible } : c))}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Sortable + resizable header ─────────────────────────────────────────────
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

// ── Cell renderer ───────────────────────────────────────────────────────────
function FeedCell({ colId, op }: { colId: string; op: FeedOp }) {
  const isIncoming = op.type === "CASH_IN" || op.type === "QR_SETTLEMENT";
  switch (colId) {
    case "id":
      return (
        <TableCell className="font-mono text-[10px] text-muted-foreground overflow-hidden">
          <span className="block truncate" title={op.id}>{op.id}</span>
        </TableCell>
      );
    case "recipient":
      if (op.type === "CASH_IN") return (
        <TableCell className="overflow-hidden">
          <div className="font-medium text-sm text-success">Пополнение ЦР-счёта</div>
          <div className="text-[11px] text-muted-foreground">Входящий перевод</div>
        </TableCell>
      );
      if (op.type === "QR_SETTLEMENT") return (
        <TableCell className="overflow-hidden">
          <div className="font-medium text-sm text-success truncate">{op.recipientName ?? op.recipientInn ?? "Клиент"}</div>
          <div className="text-[11px] text-muted-foreground">Входящий платёж от клиента</div>
        </TableCell>
      );
      if (op.type === "CASH_OUT") return (
        <TableCell className="overflow-hidden">
          <div className="font-medium text-sm">Вывод на расчётный счёт</div>
          <div className="text-[11px] text-muted-foreground">Исходящий перевод</div>
        </TableCell>
      );
      return (
        <TableCell className="overflow-hidden">
          <div className="font-medium text-sm truncate">{op.recipientName ?? op.recipientInn ?? "—"}</div>
          {op.recipientInn && (
            <div className="text-[11px] text-muted-foreground tabular">ИНН {op.recipientInn}</div>
          )}
        </TableCell>
      );
    case "type":
      return (
        <TableCell>
          <Badge variant="outline" className="text-[10px] px-1.5 whitespace-nowrap">
            {operationTypeLabel[op.type] ?? op.type}
          </Badge>
        </TableCell>
      );
    case "bank":
      return (
        <TableCell>
          {op.bankShort
            ? <Badge variant="secondary" className="text-[10px]">{op.bankShort}</Badge>
            : <span className="text-muted-foreground text-xs">—</span>}
        </TableCell>
      );
    case "amount":
      return (
        <TableCell className="overflow-hidden">
          <div className={`tabular font-medium text-sm whitespace-nowrap ${isIncoming ? "text-success" : ""}`}>
            {isIncoming ? "+" : "−"}{formatRub(op.amountCents / 100)}
          </div>
          {op.purpose && (
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2" title={op.purpose}>
              {op.purpose}
            </div>
          )}
        </TableCell>
      );
    case "status":
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

// ── Main ────────────────────────────────────────────────────────────────────
export function RecentOpsFeed({ ops }: { ops: FeedOp[] }) {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
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
    try { localStorage.setItem(COL_KEY, JSON.stringify(next)); } catch {}
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

  const filtered = useMemo(() => {
    let list = ops;
    if (status) list = list.filter(o => o.statusDashboard === status);
    if (type)   list = list.filter(o => o.type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.recipientName ?? "").toLowerCase().includes(q) ||
        (o.recipientInn ?? "").includes(q) ||
        (o.purpose ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [ops, status, type, search]);

  const activeCols = hydrated ? cols : DEFAULT_COLS;
  const visible = activeCols.filter(c => c.visible);
  const tableMinWidth = visible.reduce((s, c) => s + (widths[c.id] ?? DEFAULT_WIDTHS[c.id] ?? 100), 0) + 60;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(status === f.id ? "" : f.id)}
              className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
                status === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="ИНН, контрагент, назначение, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {TYPE_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <ColPanel cols={activeCols} setCols={setCols} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-1 px-1">
        {filtered.length === ops.length ? `${ops.length} операций` : `${filtered.length} из ${ops.length}`}
      </div>

      <div className="min-h-[260px] rounded-lg border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Нет операций по выбранным фильтрам
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table style={{ tableLayout: "fixed", minWidth: tableMinWidth }}>
              <TableHeader>
                <TableRow>
                  <SortableContext items={visible.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    {visible.map(c => (
                      <SortableHead
                        key={c.id}
                        col={c}
                        width={widths[c.id] ?? DEFAULT_WIDTHS[c.id] ?? 100}
                        onStartResize={startResize}
                      />
                    ))}
                  </SortableContext>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(op => (
                  <TableRow key={op.id} className={`group cursor-pointer ${op.type === "CASH_IN" || op.type === "QR_SETTLEMENT" ? "bg-success/[0.04]" : ""}`}>
                    {visible.map(c => <FeedCell key={c.id} colId={c.id} op={op} />)}
                    <TableCell className="p-1 w-[60px]">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button asChild variant="ghost" size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity">
                          <Link href={`/operations?op=${op.id}`} aria-label="Открыть">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                          onClick={() => navigator.clipboard?.writeText(op.id)}
                          aria-label="Скопировать ID">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DndContext>
        )}
      </div>

      <div className="pt-3 border-t mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Последние {ops.length} операций</span>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/operations">Все операции →</Link>
        </Button>
      </div>
    </div>
  );
}
