"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteUser } from "@/app/actions";

const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  role: z.string().min(1, "Выберите роль"),
});

type Fields = z.infer<typeof schema>;

const roles = [
  { value: "Viewer", label: "Наблюдатель" },
  { value: "Creator", label: "Создатель" },
  { value: "Payroll", label: "Кадровый оператор" },
  { value: "Treasurer", label: "Казначей" },
  { value: "Approver", label: "Согласующий" },
  { value: "Signer", label: "Подписант" },
  { value: "ChiefAccountant", label: "Главный бухгалтер" },
  { value: "CFO", label: "Финансовый директор" },
  { value: "Compliance", label: "Комплаенс-офицер" },
  { value: "Admin", label: "Администратор" },
];

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [selectedRole, setSelectedRole] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "" },
  });

  function onSubmit(data: Fields) {
    start(async () => {
      await inviteUser(data);
      reset();
      setSelectedRole("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="h-4 w-4" /> Пригласить пользователя</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый пользователь</DialogTitle>
          <DialogDescription>
            Пользователь получит доступ к кошельку ЦР в рамках выбранной роли.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Имя *</Label>
            <Input id="name" placeholder="Иван Иванов" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="ivan@company.ru" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Роль *</Label>
            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setValue("role", v); }}>
              <SelectTrigger><SelectValue placeholder="Выберите роль" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={pending}>{pending ? "Сохранение…" : "Пригласить"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
