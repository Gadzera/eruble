"use client";
import { useState } from "react";
import { Building2, Landmark, ShieldCheck, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { OrcaWordmark } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DEMO_PIN = "5139";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.trim() !== DEMO_PIN) {
      setError("Неверный код доступа");
      setPin("");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/demo-users");
      const data = await res.json();
      const mainUser = data[0];
      if (!mainUser) {
        setError("Ошибка инициализации демо-данных");
        setLoading(false);
        return;
      }
      const resp = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mainUser.id }),
      });
      if (resp.ok) {
        window.location.href = "/";
      } else {
        setError("Ошибка входа. Попробуйте ещё раз.");
        setLoading(false);
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <OrcaWordmark large />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Вход в систему</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Операционная оболочка цифрового рубля для юридических лиц.
              Доступ предоставляется через банк-участник платформы Банка России.
            </p>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-11" disabled>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Войти через корпоративный SSO
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-11" disabled>
              <span className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Войти через банк-участник
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">Демо-стенд</span>
            </div>
          </div>

          <form onSubmit={handlePin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin">Код доступа к демо</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="••••"
                value={pin}
                onChange={e => { setPin(e.target.value); setError(""); }}
                className="text-center text-xl tracking-[0.5em] h-12 font-mono"
                autoFocus
              />
              {error && (
                <div className="flex items-center gap-1.5 text-destructive text-xs mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full h-10" disabled={pin.length === 0 || loading}>
              <Lock className="h-4 w-4" /> {loading ? "Входим…" : "Войти в демо"}
            </Button>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Демо-стенд защищён кодом доступа. Используются синтетические данные.
              Реальная аутентификация — через банк-участник по правилам Положения Банка России №820-П.
            </p>
          </form>
        </div>
      </div>

      {/* Right: marketing panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12">
        <div>
          <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-0 backdrop-blur-sm">
            B2B-оболочка цифрового рубля
          </Badge>
          <h2 className="mt-6 text-3xl font-semibold leading-tight max-w-md">
            Один кошелёк. Любой банк.<br />
            Единый язык операций.
          </h2>
          <p className="mt-4 text-base text-primary-foreground/85 max-w-md leading-relaxed">
            Реестры выплат, ERP/1С-интеграции, мультибанковый доступ, четырёхуровневая видимость
            статусов и неизменяемый audit trail — для регуляторных запросов ФНС и комплаенса.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            { t: "Без своего кошелька", d: "Доступ к ЦР через банк-участник — модель 820-П, без регуляторного риска." },
            { t: "Schema-driven", d: "Альбомы сообщений 2026.07 / распоряжений 2026.1. Бесшовная смена версий." },
            { t: "RegTech из коробки", d: "Машиночитаемый audit, выгрузки ФНС, реестр персональных данных." },
          ].map((b) => (
            <div key={b.t} className="flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-primary-foreground/90" />
              <div>
                <div className="font-medium">{b.t}</div>
                <div className="text-sm text-primary-foreground/80 leading-snug">{b.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-primary-foreground/70 tabular">
          ООО «НПК ТехноПром-Сервис» · MVP-стенд · Песочница ЦБ · Альбомы 2026.07 / 2026.1
        </div>
      </div>
    </div>
  );
}
