import { requireSession } from "@/lib/session";
import { listUsers } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { roleLabel } from "@/lib/status";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteDialog } from "./invite-dialog";
import { RoleSelect, UserStatusToggle } from "./user-actions";

export default async function AccessPage() {
  const session = await requireSession();
  const users = listUsers(session.orgId);

  const active = users.filter((u) => u.status === "ACTIVE").length;
  const suspended = users.filter((u) => u.status !== "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="Доступы и роли"
        description="Управление пользователями и RBAC-политиками кошелька ЦР. Каждая роль определяет допустимые операции и лимиты."
        actions={<InviteDialog />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего пользователей", value: users.length },
          { label: "Активны", value: active },
          { label: "Приостановлены", value: suspended },
          { label: "Роли в системе", value: 10 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <div className="text-2xl font-semibold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>Роль можно изменить прямо в таблице — изменение фиксируется в audit trail</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Добавлен</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={u.status !== "ACTIVE" ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.id === session.id ? (
                      <Badge variant="outline" className="text-xs">{roleLabel[u.role] ?? u.role}</Badge>
                    ) : (
                      <RoleSelect userId={u.id} currentRole={u.role} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "ACTIVE" ? "success" : "secondary"} className="text-xs">
                      {u.status === "ACTIVE" ? "Активен" : "Приостановлен"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    {u.id !== session.id && (
                      <UserStatusToggle userId={u.id} status={u.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
