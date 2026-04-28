import { requireSession } from "@/lib/session";
import { getBanksForOrg } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { RegistryWizard } from "./wizard";

export default async function NewRegistryPage() {
  const session = await requireSession();
  const banks = getBanksForOrg(session.orgId);

  return (
    <>
      <PageHeader
        title="Новый реестр выплат"
        description="Загрузите файл из 1С/CSV/XLSX, либо подключитесь к 1С:Зарплата и Управление Персоналом напрямую. Демо-стенд использует встроенный валидатор."
      />
      <RegistryWizard
        banks={banks.map((b) => ({ accessId: b.access.id, bankShort: b.bank.shortName, status: b.bank.status }))}
        defaultBankAccessId={session.bankAccessId}
      />
    </>
  );
}
