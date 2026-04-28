"use client";
import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { formatShort } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet } from "lucide-react";

type Row = { day: string; inflow: number; outflow: number };
type Mode = "balance" | "inflow" | "outflow";
type Period = 7 | 30 | 90;

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "balance", label: "Баланс ЦР",   desc: "Нарастающий остаток на счёте" },
  { id: "inflow",  label: "Поступления", desc: "Зачисления по дням" },
  { id: "outflow", label: "Списания",    desc: "Расходы по дням" },
];
const PERIODS: { id: Period; label: string }[] = [
  { id: 7,  label: "7д"  },
  { id: 30, label: "30д" },
  { id: 90, label: "90д" },
];

function yFmt(v: number) { return formatShort(v); }

// Build xTick list with max N evenly-spaced labels to prevent overlap
function buildTicks(days: string[], maxTicks: number): string[] {
  if (days.length <= maxTicks) return days;
  const step = Math.ceil(days.length / maxTicks);
  return days.filter((_, i) => i % step === 0 || i === days.length - 1);
}

export function CashflowChart({
  data,
  walletBalanceCents = 0,
}: {
  data: Row[];
  walletBalanceCents?: number;
}) {
  const [mode,   setMode]   = useState<Mode>("balance");
  const [period, setPeriod] = useState<Period>(30);

  // Filter to selected period
  const filtered = useMemo(() => {
    const cutoff = new Date(Date.now() - period * 86400_000).toISOString().slice(0, 10);
    return data.filter(r => r.day >= cutoff);
  }, [data, period]);

  // Running balance (backwards from current wallet balance)
  const balanceSeries = useMemo(() => {
    const current  = walletBalanceCents / 100;
    const totalNet = filtered.reduce((s, r) => s + (r.inflow - r.outflow), 0) / 100;
    let running    = current - totalNet;
    return filtered.map(r => {
      running += (r.inflow - r.outflow) / 100;
      return { day: r.day.slice(5).replace("-", "."), Баланс: Math.max(0, running) };
    });
  }, [filtered, walletBalanceCents]);

  const inflowSeries = useMemo(() =>
    filtered.map(r => ({ day: r.day.slice(5).replace("-", "."), Поступления: r.inflow / 100 })),
    [filtered],
  );
  const outflowSeries = useMemo(() =>
    filtered.map(r => ({ day: r.day.slice(5).replace("-", "."), Списания: r.outflow / 100 })),
    [filtered],
  );

  const totals = useMemo(() => {
    const inflow  = filtered.reduce((s, r) => s + r.inflow,  0) / 100;
    const outflow = filtered.reduce((s, r) => s + r.outflow, 0) / 100;
    return { inflow, outflow, net: inflow - outflow, balance: walletBalanceCents / 100 };
  }, [filtered, walletBalanceCents]);

  const balanceTrend = balanceSeries.length > 1
    ? balanceSeries.at(-1)!.Баланс - balanceSeries[0].Баланс : 0;
  const trendColor = balanceTrend >= 0 ? "oklch(0.52 0.18 150)" : "oklch(0.55 0.2 25)";
  const trendGrad  = balanceTrend >= 0 ? "grad-pos" : "grad-neg";

  const currentMode = MODES.find(m => m.id === mode)!;

  // Limit X-axis ticks to avoid overlap
  const maxTicks = period === 7 ? 7 : period === 30 ? 8 : 9;
  const balanceTicks  = useMemo(() => buildTicks(balanceSeries.map(r => r.day),  maxTicks), [balanceSeries,  maxTicks]);
  const inflowTicks   = useMemo(() => buildTicks(inflowSeries.map(r => r.day),   maxTicks), [inflowSeries,   maxTicks]);
  const outflowTicks  = useMemo(() => buildTicks(outflowSeries.map(r => r.day),  maxTicks), [outflowSeries,  maxTicks]);

  const axisProps = {
    tickLine: false as const,
    axisLine: false as const,
    tick: { fontSize: 11, fill: "oklch(0.5 0.02 260)" },
  };

  const btnBase = "rounded-md px-3 py-1 text-xs font-medium transition-colors border";
  const btnActive = "bg-primary text-primary-foreground border-primary";
  const btnInactive = "border-transparent hover:bg-accent text-muted-foreground";

  return (
    <div>
      {/* Controls row: mode left, period right */}
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {MODES.map(m => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className={`${btnBase} ${mode === m.id ? btnActive : btnInactive}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map(p => (
            <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
              className={`${btnBase} ${period === p.id ? btnActive : btnInactive}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{currentMode.desc}</p>

      {/* Charts — all mounted to prevent scroll-shift */}
      <div className="h-52 w-full relative">
        <div className={mode === "balance" ? "absolute inset-0" : "absolute inset-0 invisible"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceSeries} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.52 0.18 150)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="oklch(0.52 0.18 150)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="grad-neg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.004 260)" vertical={false} />
              <XAxis dataKey="day" {...axisProps} ticks={balanceTicks} />
              <YAxis tickFormatter={yFmt} {...axisProps} width={84} tickCount={5} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 260)", fontSize: 12 }}
                formatter={(v) => [formatShort(Number(v), true), "Остаток ЦР"]}
              />
              <Area type="monotone" dataKey="Баланс"
                stroke={trendColor} fill={`url(#${trendGrad})`}
                strokeWidth={2.5} dot={false}
                activeDot={{ r: 4, fill: trendColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={mode === "inflow" ? "absolute inset-0" : "absolute inset-0 invisible"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inflowSeries} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.004 260)" vertical={false} />
              <XAxis dataKey="day" {...axisProps} ticks={inflowTicks} />
              <YAxis tickFormatter={yFmt} {...axisProps} width={84} tickCount={5} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 260)", fontSize: 12 }}
                formatter={(v) => [formatShort(Number(v), true), "Поступления"]}
              />
              <Bar dataKey="Поступления" fill="oklch(0.52 0.18 150)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={mode === "outflow" ? "absolute inset-0" : "absolute inset-0 invisible"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outflowSeries} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.004 260)" vertical={false} />
              <XAxis dataKey="day" {...axisProps} ticks={outflowTicks} />
              <YAxis tickFormatter={yFmt} {...axisProps} width={84} tickCount={5} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 260)", fontSize: 12 }}
                formatter={(v) => [formatShort(Number(v), true), "Списания"]}
              />
              <Bar dataKey="Списания" fill="oklch(0.45 0.2 260)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
        <Tile icon={<Wallet className="h-3.5 w-3.5" />}      label="Остаток ЦР"      value={formatShort(totals.balance, true)} color={totals.net >= 0 ? "text-success" : "text-destructive"} />
        <Tile icon={<ArrowDownLeft className="h-3.5 w-3.5" />} label="Поступило"     value={formatShort(totals.inflow,  true)} color="text-success" />
        <Tile icon={<ArrowUpRight className="h-3.5 w-3.5" />}  label="Списано"       value={formatShort(totals.outflow, true)} color="text-primary" />
        <Tile icon={<TrendingUp className="h-3.5 w-3.5" />}    label="Нетто за период" value={(totals.net >= 0 ? "+" : "") + formatShort(totals.net, true)} color={totals.net >= 0 ? "text-success" : "text-destructive"} />
      </div>
    </div>
  );
}

function Tile({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-1 text-xs mb-0.5">
        <span className={color}>{icon}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className={`text-sm font-semibold tabular ${color}`}>{value}</div>
    </div>
  );
}
