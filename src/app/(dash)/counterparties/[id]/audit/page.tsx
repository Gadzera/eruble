import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCounterparty } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";

export default async function CpAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const cp = getCounterparty(id);
  if (!cp || cp.orgId !== session.orgId) notFound();

  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        Аудит-трейл по контрагенту отображается в разделе{" "}
        <a href="/audit" className="underline text-foreground">
          Аудит и RegTech
        </a>{" "}
        с фильтром по объекту.
      </CardContent>
    </Card>
  );
}
