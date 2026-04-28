import { requireSession } from "@/lib/session";
import { getBanksForOrg, getWallet, listCounterparties } from "@/lib/queries";
import { PaymentForm } from "./payment-form";
import { PageHeader } from "@/components/app/page-header";

export default async function NewPaymentPage() {
  const session = await requireSession();
  const banks = getBanksForOrg(session.orgId);
  const wallet = getWallet(session.orgId)!;
  const counterparties = listCounterparties(session.orgId).filter((c) => c.status === "ACTIVE");

  return (
    <>
      <PageHeader
        title="Единичный B2B-перевод"
        description="Перевод цифровых рублей юридическому лицу. После подписания распоряжение направляется в банк-участник, далее на платформу Банка России (альбом 2026.1)."
      />
      <PaymentForm
        defaultBankAccessId={session.bankAccessId}
        banks={banks.map((b) => ({
          accessId: b.access.id,
          bankShort: b.bank.shortName,
          bankName: b.bank.name,
          status: b.bank.status,
        }))}
        availableBalanceRub={wallet.balanceCents / 100}
        payerOrgName={session.orgName}
        payerInn={session.orgInn}
        counterparties={counterparties.filter(c => c.drAccountRef).map((c) => ({
          id: c.id,
          inn: c.inn,
          name: c.name,
          drRef: c.drAccountRef!,
          riskLevel: c.riskLevel ?? "LOW",
          category: c.category,
          status: c.status,
          notes: c.notes,
          legalType: c.legalType,
          verifiedAt: c.verifiedAt,
        }))}
      />
    </>
  );
}
