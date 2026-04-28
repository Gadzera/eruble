"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addCounterparty } from "@/app/actions";

const schema = z.object({
  // Основное
  legalType: z.enum(["ЮЛ", "ИП", "ФЛ"]),
  inn: z.string().regex(/^\d{10}(\d{2})?$/, "ИНН: 10 цифр (ЮЛ) или 12 (ИП/ФЛ)"),
  kpp: z.string().regex(/^\d{9}$/, "КПП: 9 цифр").or(z.literal("")),
  ogrn: z.string().regex(/^\d{13}(\d{2})?$/, "ОГРН: 13 цифр (ЮЛ) или 15 (ИП)").or(z.literal("")),
  name: z.string().min(2, "Минимум 2 символа"),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  // Банковские реквизиты
  bik: z.string().regex(/^\d{9}$/, "БИК: 9 цифр").or(z.literal("")),
  bankName: z.string().optional(),
  bankAccount: z.string().regex(/^\d{20}$/, "Расчётный счёт: 20 цифр").or(z.literal("")),
  corrAccount: z.string().regex(/^\d{20}$/, "К/с: 20 цифр").or(z.literal("")),
  drAccountRef: z.string().regex(/^DR\d{12}$/, "Формат: DR + 12 цифр").or(z.literal("")),
  // Контакты
  contactPerson: z.string().optional(),
  email: z.string().email("Некорректный email").or(z.literal("")),
  phone: z.string().optional(),
  // Классификация
  category: z.enum(["SUPPLIER", "BUYER", "PARTNER", "TAX", "OTHER", ""]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", ""]),
  notes: z.string().optional(),
});

type Fields = z.infer<typeof schema>;

const categoryLabel: Record<string, string> = {
  SUPPLIER: "Поставщик",
  BUYER: "Покупатель",
  PARTNER: "Партнёр",
  TAX: "Налоговый орган",
  OTHER: "Прочее",
};

const riskLabel: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
};

export function AddCounterpartyDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalType: "ЮЛ",
      inn: "", kpp: "", ogrn: "", name: "", fullName: "", legalAddress: "",
      bik: "", bankName: "", bankAccount: "", corrAccount: "", drAccountRef: "",
      contactPerson: "", email: "", phone: "",
      category: "", riskLevel: "", notes: "",
    },
  });

  const legalType = watch("legalType");

  function onSubmit(data: Fields) {
    start(async () => {
      await addCounterparty({
        legalType: data.legalType,
        inn: data.inn,
        kpp: data.kpp || undefined,
        ogrn: data.ogrn || undefined,
        name: data.name,
        fullName: data.fullName || undefined,
        legalAddress: data.legalAddress || undefined,
        bik: data.bik || undefined,
        bankName: data.bankName || undefined,
        bankAccount: data.bankAccount || undefined,
        corrAccount: data.corrAccount || undefined,
        drAccountRef: data.drAccountRef || undefined,
        contactPerson: data.contactPerson || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        category: data.category || undefined,
        riskLevel: data.riskLevel || undefined,
        notes: data.notes || undefined,
      });
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Добавить контрагента</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый контрагент</DialogTitle>
          <DialogDescription>
            Заполните реквизиты получателя. Поля с * обязательны; остальные влияют на верификацию и оценку рисков 115-ФЗ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="main" className="mt-2">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="main">Основное</TabsTrigger>
              <TabsTrigger value="bank">Реквизиты</TabsTrigger>
              <TabsTrigger value="contact">Контакты</TabsTrigger>
              <TabsTrigger value="risk">115-ФЗ</TabsTrigger>
            </TabsList>

            {/* ── Основное ── */}
            <TabsContent value="main" className="space-y-4">
              {/* Тип */}
              <div className="space-y-1.5">
                <Label>Тип контрагента *</Label>
                <div className="flex gap-2">
                  {(["ЮЛ", "ИП", "ФЛ"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue("legalType", t)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        legalType === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {t === "ЮЛ" ? "Юр. лицо" : t === "ИП" ? "ИП" : "Физ. лицо"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inn">ИНН *</Label>
                  <Input
                    id="inn"
                    placeholder={legalType === "ЮЛ" ? "7726000077" : "772600007700"}
                    {...register("inn")}
                  />
                  {errors.inn && <p className="text-xs text-destructive">{errors.inn.message}</p>}
                </div>

                {legalType === "ЮЛ" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="kpp">КПП</Label>
                    <Input id="kpp" placeholder="772601001" {...register("kpp")} />
                    {errors.kpp && <p className="text-xs text-destructive">{errors.kpp.message}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="ogrn">
                    {legalType === "ИП" ? "ОГРНИП" : "ОГРН"}
                  </Label>
                  <Input
                    id="ogrn"
                    placeholder={legalType === "ИП" ? "304770000000000" : "1027700000000"}
                    {...register("ogrn")}
                  />
                  {errors.ogrn && <p className="text-xs text-destructive">{errors.ogrn.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Краткое наименование *</Label>
                <Input id="name" placeholder="ООО «Ромашка»" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Полное юридическое наименование</Label>
                <Input
                  id="fullName"
                  placeholder="Общество с ограниченной ответственностью «Ромашка»"
                  {...register("fullName")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="legalAddress">Юридический адрес</Label>
                <Input
                  id="legalAddress"
                  placeholder="115280, г. Москва, ул. Ленинская Слобода, д. 19"
                  {...register("legalAddress")}
                />
              </div>
            </TabsContent>

            {/* ── Банковские реквизиты ── */}
            <TabsContent value="bank" className="space-y-4">
              <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2">
                Традиционные реквизиты используются для сверки и валидации при конвертации ЦР ↔ обычные деньги.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bik">БИК банка</Label>
                  <Input id="bik" placeholder="044525225" {...register("bik")} />
                  {errors.bik && <p className="text-xs text-destructive">{errors.bik.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Наименование банка</Label>
                  <Input id="bankName" placeholder="ПАО Сбербанк" {...register("bankName")} />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="bankAccount">Расчётный счёт (р/с)</Label>
                  <Input id="bankAccount" placeholder="40702810038000012345" {...register("bankAccount")} />
                  {errors.bankAccount && <p className="text-xs text-destructive">{errors.bankAccount.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="corrAccount">Корреспондентский счёт банка (к/с)</Label>
                  <Input id="corrAccount" placeholder="30101810400000000225" {...register("corrAccount")} />
                  {errors.corrAccount && <p className="text-xs text-destructive">{errors.corrAccount.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="drAccountRef">
                    Счёт Цифрового рубля (ЦР){" "}
                    <span className="text-muted-foreground text-xs">(после верификации на платформе ЦБ)</span>
                  </Label>
                  <Input id="drAccountRef" placeholder="DR000000000001" {...register("drAccountRef")} />
                  {errors.drAccountRef && <p className="text-xs text-destructive">{errors.drAccountRef.message}</p>}
                </div>
              </div>
            </TabsContent>

            {/* ── Контакты ── */}
            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">Контактное лицо</Label>
                <Input id="contactPerson" placeholder="Иванова Мария Сергеевна" {...register("contactPerson")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="billing@romashka.ru" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" placeholder="+7 (495) 000-00-00" {...register("phone")} />
                </div>
              </div>
            </TabsContent>

            {/* ── 115-ФЗ ── */}
            <TabsContent value="risk" className="space-y-4">
              <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2">
                Классификация используется в аналитике рисков. Уровень риска влияет на автоматические проверки и лимиты согласно Положению ЦБ РФ (115-ФЗ).
              </p>

              <div className="space-y-1.5">
                <Label>Категория контрагента</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabel).map(([v, l]) => {
                    const current = watch("category");
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setValue("category", v as Fields["category"])}
                        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          current === v
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Уровень риска (115-ФЗ)</Label>
                <div className="flex gap-2">
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((r) => {
                    const current = watch("riskLevel");
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setValue("riskLevel", r)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          current === r
                            ? r === "LOW"
                              ? "border-success bg-success text-success-foreground"
                              : r === "MEDIUM"
                              ? "border-warning bg-warning text-warning-foreground"
                              : "border-destructive bg-destructive text-destructive-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {riskLabel[r]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Высокий риск — ограничение суммы платежей, дополнительное согласование.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Примечания</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Внутренние комментарии, основания для уровня риска, документы..."
                  {...register("notes")}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохранение…" : "Добавить контрагента"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
