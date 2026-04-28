"use client";
import { useState, useTransition, useEffect } from "react";
import { Plus, Copy, Trash2, Check, KeyRound, AlertTriangle, Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/format";
import { getApiKeys, createApiKey, revokeApiKey } from "@/app/actions";
import type { ApiKey } from "@/lib/db/schema";

const SCOPES: { id: string; label: string; description: string }[] = [
  { id: "read",  label: "Чтение",          description: "Баланс, операции, реестры — только просмотр" },
  { id: "write", label: "Запись",           description: "Создание платежей и реестров" },
  { id: "admin", label: "Администратор",    description: "Полный доступ, управление пользователями" },
];

export function ApiKeysSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState("read");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getApiKeys().then(k => { setKeys(k); setLoading(false); });
  }, [open]);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const full = await createApiKey(trimmed, newScopes);
      setRevealedKey(full);
      setShowCreate(false);
      setNewName("");
      setNewScopes("read");
      getApiKeys().then(setKeys);
    });
  }

  function handleRevoke(id: string) {
    setRevokeId(id);
    startTransition(async () => {
      await revokeApiKey(id);
      setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "REVOKED", revokedAt: Date.now() } : k));
      setRevokeId(null);
    });
  }

  function copyKey(key: string) {
    navigator.clipboard?.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onClose();
    setRevealedKey(null);
    setShowCreate(false);
    setNewName("");
  }

  const activeKeys = keys.filter(k => k.status === "ACTIVE");
  const revokedKeys = keys.filter(k => k.status === "REVOKED");

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col gap-0 p-0 overflow-hidden [&>button:first-child]:hidden">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> API-ключи
              </SheetTitle>
              <SheetDescription className="mt-1 text-[13px]">
                Bearer-токены для интеграции с внешними системами (ERP, 1С, BI).
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => { setShowCreate(true); setRevealedKey(null); }}
                disabled={showCreate}
              >
                <Plus className="h-4 w-4 mr-1" /> Создать
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Revealed key — show once */}
          {revealedKey && (
            <div className="rounded-lg border border-success/40 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <Check className="h-4 w-4" /> Ключ создан
              </div>
              <p className="text-xs text-muted-foreground">
                Скопируйте ключ сейчас — он показывается только один раз и не хранится в открытом виде.
              </p>
              <div className="flex gap-2">
                <Input value={revealedKey} readOnly className="font-mono text-xs bg-background" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyKey(revealedKey)}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2" onClick={() => setRevealedKey(null)}>
                Понятно, закрыть
              </Button>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="text-sm font-medium">Новый ключ</div>
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input
                  placeholder="Например: 1С ERP production"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Права доступа</Label>
                <div className="space-y-1.5">
                  {SCOPES.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                        newScopes === s.id ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        value={s.id}
                        checked={newScopes === s.id}
                        onChange={() => setNewScopes(s.id)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать ключ"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} disabled={pending}>
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Active keys */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
            </div>
          ) : activeKeys.length === 0 && !showCreate ? (
            <div className="text-center py-10 text-muted-foreground">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <div className="text-sm">Нет активных ключей</div>
              <div className="text-xs mt-1">Создайте ключ для интеграции с внешней системой</div>
            </div>
          ) : activeKeys.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Активные ({activeKeys.length})
              </div>
              <div className="rounded-lg border divide-y">
                {activeKeys.map(k => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{k.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {k.keyPrefix}
                        </code>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {SCOPES.find(s => s.id === k.scopes)?.label ?? k.scopes}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 tabular">
                        Создан {formatDateTime(k.createdAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRevoke(k.id)}
                      disabled={pending && revokeId === k.id}
                      title="Отозвать ключ"
                    >
                      {pending && revokeId === k.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Revoked keys */}
          {revokedKeys.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Отозванные
                </div>
                <div className="rounded-lg border divide-y opacity-50">
                  {revokedKeys.map(k => (
                    <div key={k.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="min-w-0">
                        <div className="text-sm line-through text-muted-foreground">{k.name}</div>
                        <code className="text-[11px] text-muted-foreground font-mono">{k.keyPrefix}</code>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 shrink-0">
                        Отозван
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
