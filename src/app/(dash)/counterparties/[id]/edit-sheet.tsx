"use client";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateCounterparty } from "@/app/actions";

const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  fullName: z.string().optional(),
  kpp: z.string().regex(/^\d{9}$/, "КПП: 9 цифр").or(z.literal("")),
  ogrn: z.string().regex(/^\d{13}(\d{2})?$/, "ОГРН: 13 или 15 цифр").or(z.literal("")),
  legalAddress: z.string().optional(),
  bik: z.string().regex(/^\d{9}$/, "БИК: 9 цифр").or(z.literal("")),
  bankName: z.string().optional(),
  bankAccount: z.string().regex(/^\d{20}$/, "Р/с: 20 цифр").or(z.literal("")),
  corrAccount: z.string().regex(/^\d{20}$/, "К/с: 20 цифр").or(z.literal("")),
  drAccountRef: z.string().regex(/^DR\d{12}$/, "Формат: DR + 12 цифр").or(z.literal("")),
  contactPerson: z.string().optional(),
  email: z.string().email("Некорректный email").or(z.literal("")),
  phone: z.string().optional(),
  category: z.enum(["SUPPLIER", "BUYER", "PARTNER", "TAX", "OTHER", ""]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", ""]),
  notes: z.string().optional(),
});

export type EditCpFields = {
  inn?: string;
  name?: string;
  fullName?: string;
  kpp?: string;
  ogrn?: string;
  legalType?: string;
  legalAddress?: string;
  bik?: string;
  bankName?: string;
  bankAccount?: string;
  corrAccount?: string;
  drAccountRef?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: string;
  riskLevel?: string;
  notes?: string;
};

type Fields = z.infer<typeof schema>;

const CATEGORY_LABEL: Record<string, string> = {
  SUPPLIER: "Поставщик",
  BUYER: "Покупатель",
  PARTNER: "Партнёр",
  TAX: "Налоговый орган",
  OTHER: "Прочее",
};

const RISK_LABEL: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
};

export function EditCounterpartySheet({
  open,
  onClose,
  id,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  initial: EditCpFields;
}) {
  const [pending, start] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    values: {
      name: initial.name ?? "",
      fullName: initial.fullName ?? "",
      kpp: initial.kpp ?? "",
      ogrn: initial.ogrn ?? "",
      legalAddress: initial.legalAddress ?? "",
      bik: initial.bik ?? "",
      bankName: initial.bankName ?? "",
      bankAccount: initial.bankAccount ?? "",
      corrAccount: initial.corrAccount ?? "",
      drAccountRef: initial.drAccountRef ?? "",
      contactPerson: initial.contactPerson ?? "",
      email: initial.email ?? "",
      phone: initial.phone ?? "",
      category: (initial.category ?? "") as Fields["category"],
      riskLevel: (initial.riskLevel ?? "") as Fields["riskLevel"],
      notes: initial.notes ?? "",
    },
  });

  function onSubmit(data: Fields) {
    start(async () => {
      await updateCounterparty(id, {
        name: data.name,
        fullName: data.fullName || undefined,
        kpp: data.kpp || undefined,
        ogrn: data.ogrn || undefined,
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
      onClose();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-[560px] sm:max-w-[560px] flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <SheetTitle>Редактировать контрагента</SheetTitle>
          <SheetDescription>ИНН {initial.inn} не редактируется — является первичным идентификатором.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-6 pt-4 pb-6">
            <Tabs defaultValue="main">
              <TabsList className="grid grid-cols-4 mb-5">
                <TabsTrigger value="main">Основное</TabsTrigger>
                <TabsTrigger value="bank">Реквизиты</TabsTrigger>
                <TabsTrigger value="contact">Контакты</TabsTrigger>
                <TabsTrigger value="risk">115-ФЗ</TabsTrigger>
              </TabsList>

              {/* ── Основное ── */}
              <TabsContent value="main" className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-name">Краткое наименование *</Label>
                  <Input id="e-name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-fullName">Полное юридическое наименование</Label>
                  <Input id="e-fullName" {...register("fullName")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-kpp">КПП</Label>
                    <Input id="e-kpp" placeholder="772601001" {...register("kpp")} />
                    {errors.kpp && <p className="text-xs text-destructive">{errors.kpp.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-ogrn">ОГРН / ОГРНИП</Label>
                    <Input id="e-ogrn" {...register("ogrn")} />
                    {errors.ogrn && <p className="text-xs text-destructive">{errors.ogrn.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-legalAddress">Юридический адрес</Label>
                  <Input id="e-legalAddress" {...register("legalAddress")} />
                </div>
              </TabsContent>

              {/* ── Реквизиты ── */}
              <TabsContent value="bank" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-bik">БИК</Label>
                    <Input id="e-bik" placeholder="044525225" {...register("bik")} />
                    {errors.bik && <p className="text-xs text-destructive">{errors.bik.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-bankName">Банк</Label>
                    <Input id="e-bankName" {...register("bankName")} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="e-bankAccount">Расчётный счёт</Label>
                    <Input id="e-bankAccount" className="tabular" {...register("bankAccount")} />
                    {errors.bankAccount && <p className="text-xs text-destructive">{errors.bankAccount.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="e-corrAccount">Корреспондентский счёт</Label>
                    <Input id="e-corrAccount" className="tabular" {...register("corrAccount")} />
                    {errors.corrAccount && <p className="text-xs text-destructive">{errors.corrAccount.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="e-drAccountRef">
                      Счёт Цифрового рубля{" "}
                      <span className="text-muted-foreground text-xs">(DR + 12 цифр)</span>
                    </Label>
                    <Input id="e-drAccountRef" className="tabular font-mono text-sm" placeholder="DR000000000001" {...register("drAccountRef")} />
                    {errors.drAccountRef && <p className="text-xs text-destructive">{errors.drAccountRef.message}</p>}
                  </div>
                </div>
              </TabsContent>

              {/* ── Контакты ── */}
              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="e-contactPerson">Контактное лицо</Label>
                  <Input id="e-contactPerson" {...register("contactPerson")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-email">Email</Label>
                    <Input id="e-email" type="email" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-phone">Телефон</Label>
                    <Input id="e-phone" {...register("phone")} />
                  </div>
                </div>
              </TabsContent>

              {/* ── 115-ФЗ ── */}
              <TabsContent value="risk" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Категория контрагента</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORY_LABEL).map(([v, l]) => {
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
                          {RISK_LABEL[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-notes">Примечания комплаенса</Label>
                  <textarea
                    id="e-notes"
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Внутренние комментарии, основания для уровня риска..."
                    {...register("notes")}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2 bg-background shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохранение…" : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
