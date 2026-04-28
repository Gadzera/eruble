import { db, schema } from "../src/lib/db/client";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const cpRiskLevels = ["LOW","LOW","LOW","MEDIUM","LOW","LOW","MEDIUM","LOW","LOW","LOW","LOW","MEDIUM","LOW","LOW","LOW","LOW","MEDIUM","LOW","LOW","HIGH","LOW","LOW","LOW","LOW","LOW"];
const cpCategories = ["SUPPLIER","BUYER","PARTNER","SUPPLIER","BUYER","SUPPLIER","PARTNER","BUYER","SUPPLIER","PARTNER","OTHER","SUPPLIER","BUYER","PARTNER","SUPPLIER","BUYER","OTHER","SUPPLIER","BUYER","SUPPLIER","PARTNER","OTHER","SUPPLIER","BUYER","PARTNER"];
const cpLegalTypes = ["ЮЛ","ЮЛ","ЮЛ","ИП","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ИП","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ИП","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ","ЮЛ"];

async function migrate() {
  const cps = db.select().from(schema.counterparties).orderBy(schema.counterparties.createdAt).all();
  console.log(`Updating ${cps.length} counterparties...`);

  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    const rl = i === 19 ? "HIGH" : (cpRiskLevels[i] ?? "LOW");
    const notes = i === 19
      ? "Контрагент заблокирован по требованию Росфинмониторинга. Операции запрещены до снятия ограничений."
      : rl === "MEDIUM"
      ? "Требуется углублённая проверка при суммах свыше 500 000 ₽. Запросить документы-основания."
      : null;
    db.update(schema.counterparties)
      .set({ riskLevel: rl, category: cpCategories[i] ?? "OTHER", legalType: cpLegalTypes[i] ?? "ЮЛ", notes })
      .where(eq(schema.counterparties.id, cp.id))
      .run();
  }
  console.log("Counterparties updated.");

  // Add CASH_IN/CASH_OUT if none exist
  const existingCash = db.select().from(schema.operations).where(eq(schema.operations.type, "CASH_IN")).all();
  if (existingCash.length > 0) {
    console.log(`Already have ${existingCash.length} CASH_IN ops — skipping.`);
    return;
  }

  const orgAlfa = db.select().from(schema.organizations).all()[0];
  if (!orgAlfa) { console.log("No org found"); return; }

  const banks = db.select().from(schema.banks).all();
  const users = db.select().from(schema.users).where(eq(schema.users.orgId, orgAlfa.id)).all();
  const treasurer = users.find(u => u.role === "Treasurer") ?? users[0];

  const now = Date.now();
  const minAgo = (m: number) => now - m * 60_000;
  const cashSlots = [3, 9, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78];

  const cashOps = cashSlots.map((slot, idx) => {
    const cashIn = idx % 3 < 2;
    const bank = banks[idx % banks.length];
    const amount = (Math.floor(Math.random() * 50) + 10) * 100_000_00;
    const created = minAgo(slot * 30 + Math.floor(Math.random() * 20));
    return {
      id: `${cashIn ? "cin" : "cout"}_${nanoid(10)}`,
      orgId: orgAlfa.id,
      type: cashIn ? "CASH_IN" : "CASH_OUT",
      bankId: bank.id,
      recipientInn: null as null,
      recipientName: null as null,
      recipientDrRef: null as null,
      counterpartyId: null as null,
      amountCents: amount,
      purpose: cashIn ? "Пополнение счёта ЦР с расчётного счёта" : "Вывод средств с ЦР на расчётный счёт",
      statusDashboard: "EXECUTED",
      statusBank: "ACCEPTED_BY_BANK",
      statusPlatform: "EXECUTED",
      statusErp: "RECONCILED",
      cbrMessageId: nanoid(12),
      cbrMessageVersion: "2026.07",
      cbrOrderVersion: "2026.1",
      idempotencyKey: nanoid(16),
      registryId: null as null,
      createdById: treasurer.id,
      createdAt: created,
      submittedAt: created + 60_000,
      executedAt: created + 5 * 60_000,
    };
  });

  db.insert(schema.operations).values(cashOps).run();
  console.log(`Added ${cashOps.length} CASH_IN/CASH_OUT operations.`);
  console.log("Migration complete.");
}

migrate().catch(e => { console.error(e); process.exit(1); });
