import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Landmark, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { OrcaWordmark } from "@/components/app/logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

async function loginAs(formData: FormData) {
  "use server";
  const userId = formData.get("user_id")?.toString();
  if (!userId) return;
  const c = await cookies();
  c.set("orca_uid", userId, { path: "/", sameSite: "lax" });
  c.delete("orca_bank");
  redirect("/");
}

export default function LoginPage() {
  // Demo: pull users from Альфа org for one-click login
  const users = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.orgId, db.select({ id: schema.organizations.id }).from(schema.organizations).get()!.id))
    .all();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <Link href="/login"><OrcaWordmark className="" /></Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Вход в систему</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Орка — операционная оболочка цифрового рубля для юридических лиц.
              Доступ предоставляется через банк-участник платформы Банка России.
            </p>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-11">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Войти через корпоративный SSO
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-11">
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

          <form action={loginAs} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="user_id">Войти как</Label>
              <select
                name="user_id"
                id="user_id"
                defaultValue={users[0]?.id}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full h-10">
              <Lock className="h-4 w-4" /> Открыть демо
            </Button>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              На демо-стенде используются синтетические данные. Реальная аутентификация — через банк-участник
              по правилам Положения Банка России №820-П и №833-П.
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
          Орка · MVP-стенд · Песочница ЦБ · Альбомы 2026.07 / 2026.1
        </div>
      </div>
    </div>
  );
}
