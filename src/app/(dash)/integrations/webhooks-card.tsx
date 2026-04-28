"use client";
import { useState } from "react";
import { Webhook, CheckCircle2, Loader2, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Hook = {
  id: string;
  event: string;
  url: string;
  active: boolean;
  retries: number;
  lastDelivery: string | null;
};

const INITIAL: Hook[] = [
  { id: "wh1", event: "operation.executed",  url: "https://erp.company.ru/hooks/cbdc",  active: true,  retries: 3, lastDelivery: "1 мин назад"  },
  { id: "wh2", event: "operation.rejected",  url: "https://erp.company.ru/hooks/cbdc",  active: true,  retries: 3, lastDelivery: "8 мин назад"  },
  { id: "wh3", event: "registry.completed",  url: "https://erp.company.ru/hooks/cbdc",  active: false, retries: 3, lastDelivery: null            },
  { id: "wh4", event: "approval.required",   url: "https://notify.company.ru/cbdc",     active: true,  retries: 1, lastDelivery: "4 мин назад"  },
];

const ALL_EVENTS: { value: string; desc: string }[] = [
  { value: "operation.executed",       desc: "Операция успешно исполнена платформой БР" },
  { value: "operation.rejected",       desc: "Операция отклонена банком или платформой" },
  { value: "operation.submitted",      desc: "Распоряжение направлено в банк" },
  { value: "operation.status_changed", desc: "Изменился любой статус операции" },
  { value: "registry.completed",       desc: "Реестр переводов полностью исполнен" },
  { value: "registry.rejected",        desc: "Реестр отклонён банком" },
  { value: "approval.required",        desc: "Требуется согласование операции / реестра" },
  { value: "approval.approved",        desc: "Согласование получено" },
  { value: "approval.rejected",        desc: "Согласование отклонено" },
  { value: "balance.low_threshold",    desc: "Остаток ЦР опустился ниже порога" },
  { value: "counterparty.verified",    desc: "Контрагент прошёл верификацию" },
];

export function WebhooksCard() {
  const [hooks,      setHooks]     = useState<Hook[]>(INITIAL);
  const [addOpen,    setAddOpen]   = useState(false);
  const [testingId,  setTestingId] = useState<string | null>(null);
  const [testedId,   setTestedId]  = useState<string | null>(null);

  const [newEvent,   setNewEvent]   = useState("operation.executed");
  const [newUrl,     setNewUrl]     = useState("");
  const [newRetries, setNewRetries] = useState("3");

  function toggle(id: string) {
    setHooks(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));
  }

  function remove(id: string) {
    setHooks(prev => prev.filter(h => h.id !== id));
  }

  function testHook(id: string) {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setTestedId(id);
      setTimeout(() => setTestedId(null), 2500);
    }, 1200);
  }

  function handleAdd() {
    setHooks(prev => [
      ...prev,
      {
        id: `wh_${Date.now()}`,
        event: newEvent,
        url: newUrl,
        active: true,
        retries: parseInt(newRetries),
        lastDelivery: null,
      },
    ]);
    setAddOpen(false);
    setNewUrl("");
    setNewEvent("operation.executed");
    setNewRetries("3");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Webhook-подписки</CardTitle>
          <CardDescription>Push-уведомления о событиях в реальном времени</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {hooks.map(h => (
            <div key={h.id} className="flex items-center justify-between rounded-md border p-3 gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium font-mono">{h.event}</div>
                <div className="text-xs text-muted-foreground truncate">{h.url}</div>
                {h.active && h.lastDelivery && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Последняя доставка: {h.lastDelivery}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {testingId === h.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {testedId  === h.id && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                <Button
                  variant="ghost" size="icon" className="h-7 w-7" title="Отправить тестовый запрос"
                  disabled={!h.active || testingId === h.id}
                  onClick={() => testHook(h.id)}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Удалить"
                  onClick={() => remove(h.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Switch checked={h.active} onCheckedChange={() => toggle(h.id)} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full text-sm" onClick={() => setAddOpen(true)}>
            <Webhook className="h-4 w-4" /> Добавить подписку
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-4 w-4" /> Новая Webhook-подписка
            </DialogTitle>
            <DialogDescription>
              Выберите событие и укажите HTTPS-эндпоинт. Запросы подписываются HMAC-SHA256 — секрет будет показан единожды после создания.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Тип события</Label>
              <Select value={newEvent} onValueChange={setNewEvent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {ALL_EVENTS.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      <div>
                        <div className="font-mono text-xs font-medium">{e.value}</div>
                        <div className="text-xs text-muted-foreground">{e.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>URL эндпоинта <span className="text-destructive">*</span></Label>
              <Input
                placeholder="https://erp.company.ru/hooks/cbdc"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Должен принимать POST-запросы с JSON-телом и отвечать 2xx</p>
            </div>

            <div className="space-y-1.5">
              <Label>Повторные попытки при ошибке</Label>
              <Select value={newRetries} onValueChange={setNewRetries}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — без повтора</SelectItem>
                  <SelectItem value="1">1 попытка (через 30 с)</SelectItem>
                  <SelectItem value="3">3 попытки (экспоненциальный backoff)</SelectItem>
                  <SelectItem value="5">5 попыток (до 1 часа, backoff)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
              Тело запроса: <code className="font-mono bg-muted px-1 rounded">{"{ event, timestamp, orgId, data }"}</code>.
              Подпись передаётся в заголовке <code className="font-mono bg-muted px-1 rounded">X-CBDC-Signature</code>.
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={!newUrl.trim()}>Создать подписку</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
