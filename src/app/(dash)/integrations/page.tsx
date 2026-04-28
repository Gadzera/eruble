import { requireSession } from "@/lib/session";
import { getBanksForOrg } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { BankChannelsCard } from "./bank-channels-card";
import { ErpCard } from "./erp-card";
import { WebhooksCard } from "./webhooks-card";
import { ApiCard } from "./api-card";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const banks = getBanksForOrg(session.orgId);

  const bankRows = banks.map(({ bank, access }) => ({
    accessId:        access.id,
    bankCode:        bank.code,
    bankName:        bank.name,
    status:          bank.status,
    cbrAlbumVersion: bank.cbrAlbumVersion,
    isDefault:       !!access.isDefault,
  }));

  return (
    <>
      <PageHeader
        title="Интеграции"
        description="Управление банковскими каналами, ERP-коннекторами и webhook-подписками для автоматизации процессов ЦР."
      />

      <BankChannelsCard banks={bankRows} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErpCard />
        <WebhooksCard />
      </div>

      <ApiCard orgId={session.orgId} />
    </>
  );
}
