"use client";
import { useState } from "react";
import { Plug, ChevronRight, Settings, Activity, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LogEntry = { time: string; event: string; count: number; ok: boolean };
type Connector = {
  id: string;
  name: string;
  status: "ACTIVE" | "DEGRADED";
  lastSync: string;
  events: number;
  endpoint: string;
  clientId: string;
  version: string;
  syncInterval: string;
  authMethod: string;
  logs: LogEntry[];
};

const INITIAL: Connector[] = [
  {
    id: "1c",
    name: "1С:Предприятие 8.3",
    status: "ACTIVE",
    lastSync: "2 мин назад",
    events: 142,
    endpoint: "https://erp.company.ru/cbdc/v1/sync",
    clientId: "client_1c_prod_a7f2",
    version: "8.3.24.1513",
    syncInterval: "каждые 2 минуты",
    authMethod: "OAuth 2.0 (client_credentials)",
    logs: [
      { time: "12:43:05", event: "operation.status_changed", count: 18, ok: true  },
      { time: "12:41:03", event: "operation.executed",       count: 7,  ok: true  },
      { time: "12:39:01", event: "operation.status_changed", count: 22, ok: true  },
      { time: "12:37:00", event: "registry.reconciled",      count: 3,  ok: true  },
      { time: "12:35:01", event: "operation.executed",       count: 11, ok: true  },
      { time: "12:33:01", event: "operation.status_changed", count: 9,  ok: true  },
    ],
  },
  {
    id: "sap",
    name: "SAP ERP",
    status: "DEGRADED",
    lastSync: "18 мин назад",
    events: 0,
    endpoint: "https://sap.company.ru/api/cbdc/webhook",
    clientId: "client_sap_prod_b3e9",
    version: "SAP ECC 6.0 SP12",
    syncInterval: "каждые 5 минут",
    authMethod: "OAuth 2.0 (client_credentials)",
    logs: [
      { time: "12:27:00", event: "heartbeat",               count: 0, ok: false },
      { time: "12:22:00", event: "heartbeat",               count: 0, ok: false },
      { time: "12:17:00", event: "heartbeat",               count: 0, ok: false },
      { time: "12:12:00", event: "operation.status_changed", count: 4, ok: true  },
      { time: "12:07:00", event: "operation.executed",       count: 2, ok: true  },
      { time: "12:02:00", event: "operation.status_changed", count: 7, ok: true  },
    ],
  },
];

const TYPE_NAMES: Record<string, string> = {
  "1c":     "1С:Предприятие 8.3 / 8.4",
  "sap":    "SAP ERP / S/4HANA",
  "oracle": "Oracle E-Business Suite",
  "axapta": "Microsoft Dynamics AX / 365",
  "custom": "Custom REST API",
};

const INTERVAL_LABELS: Record<string, string> = {
  "1min": "каждую минуту",
  "2min": "каждые 2 минуты",
  "5min": "каждые 5 минут",
  "15min": "каждые 15 минут",
};

export function ErpCard() {
  const [connectors, setConnectors] = useState<Connector[]>(INITIAL);
  const [selected,   setSelected]   = useState<Connector | null>(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [syncing,    setSyncing]    = useState<string | null>(null);
  const [synced,     setSynced]     = useState<string | null>(null);

  const [newType,     setNewType]     = useState("1c");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newSecret,   setNewSecret]   = useState("");
  const [newInterval, setNewInterval] = useState("5min");

  function handleSync(id: string) {
    setSyncing(id);
    setTimeout(() => { setSyncing(null); setSynced(id); setTimeout(() => setSynced(null), 2000); }, 1800);
  }

  function handleAdd() {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setConnectors(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: TYPE_NAMES[newType] ?? newType,
        status: "ACTIVE",
        lastSync: "только что",
        events: 0,
        endpoint: newEndpoint,
        clientId: newClientId || "client_new",
        version: "—",
        syncInterval: INTERVAL_LABELS[newInterval] ?? newInterval,
        authMethod: "OAuth 2.0 (client_credentials)",
        logs: [{ time, event: "connected", count: 1, ok: true }],
      },
    ]);
    setAddOpen(false);
    setNewEndpoint(""); setNewClientId(""); setNewSecret("");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>ERP-коннекторы</CardTitle>
          <CardDescription>Автоматическая синхронизация статусов и проводок</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectors.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-accent/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Plug className={`h-4 w-4 shrink-0 ${c.status === "ACTIVE" ? "text-success" : "text-warning"}`} />
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Последняя синхронизация: {c.lastSync} · {c.events} событий
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.status === "ACTIVE" ? "success" : "warning"} className="text-xs">
                  {c.status === "ACTIVE" ? "Активен" : "Замедлен"}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
          <Button variant="outline" className="w-full text-sm" onClick={() => setAddOpen(true)}>
            <Plug className="h-4 w-4" /> Добавить коннектор
          </Button>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        {selected && (
          <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col gap-0 p-0">
            <SheetHeader className="px-6 py-5 border-b shrink-0">
              <div className="flex items-center gap-3">
                <Plug className={`h-4 w-4 ${selected.status === "ACTIVE" ? "text-success" : "text-warning"}`} />
                <div>
                  <SheetTitle>{selected.name}</SheetTitle>
                  <SheetDescription>ERP-коннектор · {selected.syncInterval}</SheetDescription>
                </div>
                <Badge variant={selected.status === "ACTIVE" ? "success" : "warning"} className="ml-auto text-xs shrink-0">
                  {selected.status === "ACTIVE" ? "Активен" : "Замедлен"}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <Tabs defaultValue="settings">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="settings" className="flex-1">
                    <Settings className="h-3.5 w-3.5 mr-1.5" /> Настройки
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex-1">
                    <Activity className="h-3.5 w-3.5 mr-1.5" /> Журнал синхронизации
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {([
                      ["Endpoint URL",        selected.endpoint],
                      ["Client ID",           selected.clientId + "****"],
                      ["Версия системы",      selected.version],
                      ["Интервал синхр.",     selected.syncInterval],
                      ["Авторизация",         selected.authMethod],
                      ["Транспорт",           "HTTPS / TLS 1.3"],
                      ["Retry-политика",      "3 попытки, exp. backoff"],
                      ["Timeout запроса",     "30 с"],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{k}</div>
                        <div className="font-mono text-xs break-all leading-relaxed">{v}</div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSync(selected.id)}
                      disabled={syncing === selected.id}
                    >
                      {syncing === selected.id
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Синхронизация…</>
                        : synced === selected.id
                        ? <><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Выполнено</>
                        : <><RefreshCw className="h-3.5 w-3.5" /> Синхронизировать сейчас</>}
                    </Button>
                  </div>

                  {selected.status === "DEGRADED" && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700 leading-relaxed">
                      ⚠ Коннектор отвечает с задержками. Возможна временная перегрузка на стороне ERP.
                      Последние успешные события получены в {selected.logs.find(l => l.ok)?.time ?? "—"}.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-3">
                    Последние события синхронизации
                  </div>
                  {selected.logs.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">Нет событий</div>
                  ) : (
                    <div className="rounded-lg border divide-y text-sm">
                      {selected.logs.map((log, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                          {log.ok
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                            : <AlertCircle  className="h-3.5 w-3.5 text-destructive shrink-0" />}
                          <span className="font-mono text-xs text-muted-foreground tabular shrink-0">{log.time}</span>
                          <span className="flex-1 font-mono text-xs">{log.event}</span>
                          <span className="text-xs text-muted-foreground shrink-0 tabular">
                            {log.ok ? `${log.count} соб.` : "ошибка"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Add connector Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="h-4 w-4" /> Новый ERP-коннектор
            </DialogTitle>
            <DialogDescription>
              Подключите вашу ERP-систему для автоматической синхронизации статусов операций и бухгалтерских проводок.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Тип системы</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_NAMES).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>URL эндпоинта <span className="text-destructive">*</span></Label>
              <Input
                placeholder="https://erp.company.ru/cbdc/v1/sync"
                value={newEndpoint}
                onChange={e => setNewEndpoint(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">HTTPS-эндпоинт вашей ERP для получения событий ЦР</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client ID</Label>
                <Input placeholder="client_erp_prod" value={newClientId} onChange={e => setNewClientId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Client Secret</Label>
                <Input type="password" placeholder="••••••••••••" value={newSecret} onChange={e => setNewSecret(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Интервал синхронизации</Label>
              <Select value={newInterval} onValueChange={setNewInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">Каждую минуту</SelectItem>
                  <SelectItem value="2min">Каждые 2 минуты</SelectItem>
                  <SelectItem value="5min">Каждые 5 минут</SelectItem>
                  <SelectItem value="15min">Каждые 15 минут</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              После подключения коннектор получает webhook-события от платформы CBDC Orca и проксирует статусы операций в вашу ERP.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={!newEndpoint.trim()}>Подключить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
