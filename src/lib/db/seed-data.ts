import { nanoid } from "nanoid";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/better-sqlite3";

type DB = ReturnType<typeof drizzle<typeof schema>>;

export function seedIfEmpty(db: DB): void {
  const existing = db.select().from(schema.organizations).all();
  if (existing.length > 0) return;

  const now = Date.now();
  const daysAgo = (d: number) => now - d * 86400_000;
  const minAgo  = (m: number) => now - m * 60_000;
  const at      = (dAgo: number, hour: number) => daysAgo(dAgo) - (new Date(daysAgo(dAgo)).getHours() - hour) * 3_600_000;
  const rid = (p: string) => `${p}_${nanoid(10)}`;

  const orgMain = {
    id: "org_tps", inn: "7716250565",
    name: 'Общество с ограниченной ответственностью "НПК ТехноПром-Сервис"',
    shortName: 'ООО "НПК ТехноПром-Сервис"',
    locale: "ru-RU", timezone: "Europe/Moscow", createdAt: daysAgo(400),
  };
  const orgBeta = {
    id: "org_beta", inn: "7702000002",
    name: 'Общество с ограниченной ответственностью "Бета Логистика"',
    shortName: 'ООО "Бета Логистика"',
    locale: "ru-RU", timezone: "Europe/Moscow", createdAt: daysAgo(300),
  };
  db.insert(schema.organizations).values([orgMain, orgBeta]).run();

  const uCFO  = { id: "usr_cfo", orgId: orgMain.id, email: "an@tp-s.ru",       name: "Гадзера А.Н.", role: "CFO",             status: "ACTIVE", createdAt: daysAgo(395) };
  const uTrs  = { id: "usr_trs", orgId: orgMain.id, email: "orlova@tp-s.ru",   name: "Орлова Е.В.",  role: "Treasurer",       status: "ACTIVE", createdAt: daysAgo(390) };
  const uPay  = { id: "usr_pay", orgId: orgMain.id, email: "nikitin@tp-s.ru",  name: "Никитин П.М.", role: "Payroll",         status: "ACTIVE", createdAt: daysAgo(385) };
  const uApp  = { id: "usr_app", orgId: orgMain.id, email: "sorokina@tp-s.ru", name: "Сорокина О.И.",role: "Approver",        status: "ACTIVE", createdAt: daysAgo(380) };
  const uCA   = { id: "usr_ca",  orgId: orgMain.id, email: "borisova@tp-s.ru", name: "Борисова М.Д.",role: "ChiefAccountant", status: "ACTIVE", createdAt: daysAgo(375) };
  const uAdm  = { id: "usr_adm", orgId: orgMain.id, email: "info@tp-s.ru",     name: "Администратор",role: "Admin",           status: "ACTIVE", createdAt: daysAgo(400) };
  db.insert(schema.users).values([uCFO, uTrs, uPay, uApp, uCA, uAdm]).run();

  const sber = { id: "bnk_sber", code: "SBER", name: "ПАО Сбербанк",    shortName: "Сбер",  status: "ACTIVE",   cbrAlbumVersion: "2026.07", createdAt: daysAgo(400) };
  const vtb  = { id: "bnk_vtb",  code: "VTB",  name: "Банк ВТБ (ПАО)", shortName: "ВТБ",   status: "ACTIVE",   cbrAlbumVersion: "2026.07", createdAt: daysAgo(400) };
  const alfa = { id: "bnk_alfa", code: "ALFA", name: 'АО "Альфа-Банк"',shortName: "Альфа", status: "DEGRADED", cbrAlbumVersion: "2026.06", createdAt: daysAgo(400) };
  db.insert(schema.banks).values([sber, vtb, alfa]).run();
  db.insert(schema.bankAccess).values([
    { id: rid("ba"), orgId: orgMain.id, bankId: sber.id, status: "ACTIVE", isDefault: 1, createdAt: daysAgo(395) },
    { id: rid("ba"), orgId: orgMain.id, bankId: vtb.id,  status: "ACTIVE", isDefault: 0, createdAt: daysAgo(350) },
    { id: rid("ba"), orgId: orgMain.id, bankId: alfa.id, status: "ACTIVE", isDefault: 0, createdAt: daysAgo(280) },
    { id: rid("ba"), orgId: orgBeta.id, bankId: vtb.id,  status: "ACTIVE", isDefault: 1, createdAt: daysAgo(290) },
  ]).run();

  type CpDef = { inn: string; name: string; legalType: string; category: string; risk: string };
  const cpDefs: CpDef[] = [
    { inn: "7705035012", name: 'ПАО "Мосэнерго"',               legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "6671148900", name: 'АО "УралСталь"',                legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "6901067703", name: 'ПАО "Россети Центр"',           legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "7714869853", name: 'ООО "СтройПромГрупп"',          legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "7723604001", name: 'ООО "ГидроМонтаж"',             legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "3528039007", name: 'АО "Северсталь-Дистрибуция"',   legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "5047076350", name: 'ООО "ПромГрупп"',               legalType: "ЮЛ", category: "BUYER",    risk: "MEDIUM" },
    { inn: "4346004030", name: 'АО "Кировэнерго"',              legalType: "ЮЛ", category: "BUYER",    risk: "LOW"    },
    { inn: "7714027804", name: 'ООО "АББ"',                     legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "7701808059", name: 'АО "Шнейдер Электрик"',         legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "7710009666", name: 'ООО "Сименс"',                  legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "7718218999", name: 'ООО "Техснаб"',                 legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "7722798001", name: 'ООО "КабельСтрой"',             legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "6655002001", name: 'ООО "Электроснаб-Урал"',        legalType: "ЮЛ", category: "SUPPLIER", risk: "MEDIUM" },
    { inn: "7710654321", name: 'ООО "АвтоТранс"',               legalType: "ЮЛ", category: "SUPPLIER", risk: "LOW"    },
    { inn: "772100055613", name: "ИП Фёдоров Р.С.",             legalType: "ИП",  category: "PARTNER",  risk: "LOW"    },
    { inn: "770400778921", name: "ИП Самсонов В.Д.",            legalType: "ИП",  category: "PARTNER",  risk: "LOW"    },
    { inn: "504801665420", name: "ИП Кузнецов А.В.",            legalType: "ИП",  category: "PARTNER",  risk: "LOW"    },
    { inn: "773200891234", name: "ИП Морозова Е.И.",            legalType: "ИП",  category: "PARTNER",  risk: "LOW"    },
    { inn: "773301283900", name: "ИП Петрашов Д.В.",            legalType: "ИП",  category: "PARTNER",  risk: "MEDIUM" },
    { inn: "7707049388", name: 'ПАО "Ростелеком"',              legalType: "ЮЛ", category: "OTHER",    risk: "LOW"    },
    { inn: "7720000312", name: 'ООО "Офис Парк"',               legalType: "ЮЛ", category: "OTHER",    risk: "LOW"    },
    { inn: "7707083893", name: 'ПАО Сбербанк (займ)',           legalType: "ЮЛ", category: "OTHER",    risk: "LOW"    },
    { inn: "7703107510", name: 'ООО "1С"',                      legalType: "ЮЛ", category: "OTHER",    risk: "LOW"    },
    { inn: "9701000000", name: 'ООО "РесурсТрейд"',             legalType: "ЮЛ", category: "SUPPLIER", risk: "HIGH"   },
  ];
  const counterparties = cpDefs.map((cp, i) => ({
    id: `cp_${i}`, orgId: orgMain.id, inn: cp.inn, name: cp.name, legalType: cp.legalType,
    drAccountRef: `DR${String(200 + i).padStart(12, "0")}`,
    status: cp.risk === "HIGH" ? "BLOCKED" : i >= 23 ? "ARCHIVED" : "ACTIVE",
    riskLevel: cp.risk, category: cp.category,
    notes: cp.risk === "HIGH" ? "Контрагент заблокирован по требованию Росфинмониторинга."
      : cp.risk === "MEDIUM" ? "Требуется углублённая проверка при суммах свыше 500 000 ₽." : null,
    verifiedAt: i % 4 === 0 ? daysAgo(60) : null,
    createdAt: daysAgo(300 - i * 8),
  }));
  db.insert(schema.counterparties).values(counterparties).run();

  const cp = (i: number) => counterparties[i];
  const banks = [sber, vtb, alfa];

  type OpRow = typeof schema.operations.$inferInsert;
  const ops: OpRow[] = [];
  let balance = 2_000_000_00;

  function ensureBalance(needed: number, dAgo: number, hourOffset = 1) {
    if (balance - needed < 30_000_000) {
      const top = Math.ceil((needed + 80_000_000 - balance) / 10_000_000) * 10_000_000;
      const t = at(dAgo, 8) - hourOffset * 3_600_000;
      ops.push({
        id: rid("cin"), orgId: orgMain.id, type: "CASH_IN", bankId: sber.id,
        recipientInn: null, recipientName: null, recipientDrRef: null, counterpartyId: null,
        amountCents: top, purpose: "Пополнение ЦР-счёта с расчётного счёта организации",
        statusDashboard: "EXECUTED", statusBank: "ACCEPTED_BY_BANK", statusPlatform: "EXECUTED", statusErp: "RECONCILED",
        cbrMessageId: nanoid(12), cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
        idempotencyKey: nanoid(16), registryId: null, createdById: uTrs.id,
        createdAt: t, submittedAt: t + 60_000, executedAt: t + 5 * 60_000,
      });
      balance += top;
    }
  }

  function addCashIn(dAgo: number, amountK: number) {
    const t = at(dAgo, 8);
    const a = amountK * 1_000_00;
    ops.push({
      id: rid("cin"), orgId: orgMain.id, type: "CASH_IN", bankId: sber.id,
      recipientInn: null, recipientName: null, recipientDrRef: null, counterpartyId: null,
      amountCents: a, purpose: "Пополнение ЦР-счёта с расчётного счёта организации",
      statusDashboard: "EXECUTED", statusBank: "ACCEPTED_BY_BANK", statusPlatform: "EXECUTED", statusErp: "RECONCILED",
      cbrMessageId: nanoid(12), cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
      idempotencyKey: nanoid(16), registryId: null, createdById: uTrs.id,
      createdAt: t, submittedAt: t + 60_000, executedAt: t + 5 * 60_000,
    });
    balance += a;
  }

  function addCashOut(dAgo: number, amountK: number) {
    const a = amountK * 1_000_00;
    ensureBalance(a, dAgo);
    const t = at(dAgo, 16);
    ops.push({
      id: rid("cout"), orgId: orgMain.id, type: "CASH_OUT", bankId: sber.id,
      recipientInn: null, recipientName: null, recipientDrRef: null, counterpartyId: null,
      amountCents: a, purpose: "Вывод средств с ЦР-счёта на расчётный счёт организации",
      statusDashboard: "EXECUTED", statusBank: "ACCEPTED_BY_BANK", statusPlatform: "EXECUTED", statusErp: "RECONCILED",
      cbrMessageId: nanoid(12), cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
      idempotencyKey: nanoid(16), registryId: null, createdById: uCFO.id,
      createdAt: t, submittedAt: t + 60_000, executedAt: t + 6 * 60_000,
    });
    balance -= a;
  }

  const qrProducts = [
    "трансформаторное оборудование ТМ-1000/10", "кабель силовой ВВГ 3×185, 4×150",
    "щиты управления ГРЩ и ВРУ", "устройства плавного пуска АТС",
    "частотные преобразователи серии G", "коммутационное оборудование КРУ",
    "распределительные устройства РУ-10кВ", "контрольно-измерительные приборы",
    "силовые трансформаторы ТМГ", "электрические щитки и распределители",
    "кабельные лотки и короба", "реле защиты и автоматики",
  ];
  let qrInvNum = 312;

  function addIncoming(dAgo: number, cpIdx: number, amountK: number, hour = 10) {
    const a = amountK * 1_000_00;
    const t = at(dAgo, hour);
    const cpObj = counterparties[cpIdx];
    const product = qrProducts[(cpIdx + Math.floor(dAgo / 7)) % qrProducts.length];
    ops.push({
      id: rid("qrs"), orgId: orgMain.id, type: "QR_SETTLEMENT", bankId: sber.id,
      recipientInn: cpObj.inn, recipientName: cpObj.name, recipientDrRef: cpObj.drAccountRef,
      counterpartyId: cpObj.id, amountCents: a,
      purpose: `Оплата по счёту-фактуре №ЭТП-2026/${qrInvNum++} за ${product}`,
      statusDashboard: "EXECUTED", statusBank: "ACCEPTED_BY_BANK", statusPlatform: "EXECUTED", statusErp: "RECONCILED",
      cbrMessageId: nanoid(12), cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
      idempotencyKey: nanoid(16), registryId: null, createdById: uTrs.id,
      createdAt: t, submittedAt: t + 30_000, executedAt: t + 3 * 60_000,
    });
    balance += a;
  }

  const supplierPurposes: Record<number, string[]> = {
    8:  ["Трансформаторы ТМ по договору поставки", "Высоковольтные выключатели ВВ/TEL", "Трансформаторы тока и напряжения", "Распределительные устройства КРУ серии D", "Трансформаторы ТМГ 1000 кВА"],
    9:  ["Автоматические выключатели Compact NSX", "Щиты управления электродвигателями", "Устройства плавного пуска Altistart", "ПЛК Modicon M340 и периферия", "Программируемые реле Zelio Logic"],
    10: ["Частотные преобразователи Sinamics G120", "Промышленные коммутаторы SCALANCE", "Реле защиты SIPROTEC 4", "Двигатели серии 1LE1 асинхронные", "Силовые модули SINAMICS S120"],
    11: ["Кабель силовой ВВГ нг(А)-LS", "Кабель контрольный КВВГ", "Кабель АСБ 3×185 силовой", "Кабельная арматура и аксессуары", "Провод ПуГВ многожильный"],
    12: ["Кабельные лотки перфорированные", "Короба кабельные с крышкой", "Монтажные стойки и рейки DIN", "Крепёж для кабельных трасс", "Кабельные муфты и концевые заделки"],
    13: ["Низковольтное оборудование НКУ", "Силовые щиты ГРЩ-0.4кВ", "Вводно-распределительные устройства ВРУ", "Комплектные трансформаторные подстанции КТП"],
    14: ["Транспортные услуги по доставке оборудования", "Аренда спецтехники для разгрузки", "Курьерская доставка документов"],
  };
  const ipPurposes: Record<number, string[]> = {
    15: ["Монтажные работы по договору подряда", "Электромонтажные работы на объекте", "Пусконаладочные работы электрооборудования"],
    16: ["Услуги по наладке частотных преобразователей", "Техническое обслуживание КТП", "Инженерное сопровождение проекта"],
    17: ["Электромонтажные работы", "Монтаж кабельных трасс", "Монтаж распределительного оборудования"],
    18: ["Бухгалтерские услуги", "Подготовка первичных документов", "Составление налоговой отчётности"],
    19: ["Технический консалтинг", "Экспертиза проектной документации", "Согласование технических условий"],
  };

  const supplierPurposeIdx: Record<number, number> = {};
  const ipPurposeIdx: Record<number, number> = {};

  function getSupplierPurpose(cpIdx: number, contractNum: number): string {
    const purposes = supplierPurposes[cpIdx] ?? ["Оплата по договору поставки"];
    const i = supplierPurposeIdx[cpIdx] ?? 0;
    supplierPurposeIdx[cpIdx] = (i + 1) % purposes.length;
    return `${purposes[i]} по договору №${cpDefs[cpIdx].name.slice(4, 7)}-${contractNum}/${Math.floor(contractNum / 10)}`;
  }

  function getIPPurpose(cpIdx: number): string {
    const purposes = ipPurposes[cpIdx] ?? ["Вознаграждение по договору"];
    const i = ipPurposeIdx[cpIdx] ?? 0;
    ipPurposeIdx[cpIdx] = (i + 1) % purposes.length;
    return purposes[i];
  }

  let contractCounter = 100;

  function statusForDay(dAgo: number, opIdx: number) {
    const t = at(dAgo, 12);
    // Сегодня (d=0): черновики
    if (dAgo === 0) return { sd: "DRAFT", sb: null, sp: null, se: null, submittedAt: null, executedAt: null };
    // Вчера (d=1): большинство исполнено, пара на согласовании для реализма
    if (dAgo === 1) return opIdx % 5 === 0
      ? { sd: "PENDING_APPROVAL", sb: null, sp: null, se: null, submittedAt: null, executedAt: null }
      : { sd: "EXECUTED", sb: "ACCEPTED_BY_BANK", sp: "EXECUTED", se: "RECONCILED", submittedAt: t + 2 * 60_000, executedAt: t + 10 * 60_000 };
    // Позавчера (d=2): исполнено, один отклонён
    if (dAgo === 2) return opIdx % 15 === 0
      ? { sd: "REJECTED", sb: "REJECTED_BY_BANK", sp: null, se: null, submittedAt: t + 90_000, executedAt: null }
      : { sd: "EXECUTED", sb: "ACCEPTED_BY_BANK", sp: "EXECUTED", se: "RECONCILED", submittedAt: t + 2 * 60_000, executedAt: t + 10 * 60_000 };
    if (opIdx % 20 === 0) return { sd: "REJECTED", sb: "REJECTED_BY_BANK", sp: null, se: null, submittedAt: t + 90_000, executedAt: null };
    return {
      sd: "EXECUTED", sb: "ACCEPTED_BY_BANK", sp: "EXECUTED",
      se: opIdx % 7 === 0 ? "POSTED" : "RECONCILED",
      submittedAt: t + 2 * 60_000, executedAt: t + 10 * 60_000,
    };
  }

  function addB2B(dAgo: number, cpIdx: number, amountK: number, purpose: string, hour = 13, opIdx = 0, createdBy = uTrs) {
    const a = amountK * 1_000_00;
    const st = statusForDay(dAgo, opIdx);
    if (st.sd === "EXECUTED") ensureBalance(a, dAgo);
    const t = at(dAgo, hour);
    const cpObj = counterparties[cpIdx];
    ops.push({
      id: rid("pay"), orgId: orgMain.id, type: "B2B_TRANSFER",
      bankId: banks[opIdx % 3].id,
      recipientInn: cpObj.inn, recipientName: cpObj.name, recipientDrRef: cpObj.drAccountRef,
      counterpartyId: cpObj.id, amountCents: a, purpose,
      statusDashboard: st.sd, statusBank: st.sb, statusPlatform: st.sp, statusErp: st.se,
      cbrMessageId: st.sb ? nanoid(12) : null, cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
      idempotencyKey: nanoid(16), registryId: null, createdById: createdBy.id,
      createdAt: t, submittedAt: st.submittedAt, executedAt: st.executedAt,
    });
    if (st.sd === "EXECUTED") balance -= a;
  }

  const clients   = [0, 1, 2, 3, 4, 5, 6, 7];
  const suppliers = [8, 9, 10, 11, 12, 13, 14];
  const ipCps     = [15, 16, 17, 18, 19];
  const qrAmounts  = [190, 340, 290, 520, 140, 390, 220, 280, 330, 125, 560, 185, 300, 210, 420, 175, 370, 150, 260, 315];
  const supAmounts = [170, 140, 250, 120, 210, 160, 95, 230, 130, 290, 115, 220, 190, 360, 100, 280, 125, 250, 150, 320];
  const ipAmounts  = [28, 52, 42, 62, 35, 50, 28, 70, 48, 56, 40, 65, 28, 52, 42, 62, 48, 70];
  const cinAmounts = [600, 500, 750, 550, 800, 480, 650, 580, 500, 820, 560, 620, 700, 490, 750, 600];

  let qi = 0, si = 0, ii = 0, ci = 0, opCnt = 0;

  for (let d = 90; d >= 0; d--) {
    if (d % 6 === 0) addCashIn(d, cinAmounts[ci++ % cinAmounts.length]);
    if (d % 18 === 0 && d < 90) addCashOut(d, 350 + (d % 3) * 50);
    if (d % 2 === 0) { addIncoming(d, clients[qi % clients.length], qrAmounts[qi % qrAmounts.length], 10); qi++; }
    if (d % 7 === 0) { addIncoming(d, clients[(qi + 3) % clients.length], qrAmounts[(qi + 5) % qrAmounts.length] + 1000, 11); qi++; }

    { const cpIdx = suppliers[si % suppliers.length]; addB2B(d, cpIdx, supAmounts[si % supAmounts.length], getSupplierPurpose(cpIdx, contractCounter++), 13, opCnt++); si++; }
    if (d % 2 === 1) { const cpIdx = suppliers[(si + 3) % suppliers.length]; addB2B(d, cpIdx, supAmounts[(si + 7) % supAmounts.length], getSupplierPurpose(cpIdx, contractCounter++), 15, opCnt++); si++; }
    if (d % 3 === 0) { const cpIdx = ipCps[ii % ipCps.length]; const month = d <= 30 ? "апрель" : d <= 60 ? "март" : "февраль"; addB2B(d, cpIdx, ipAmounts[ii % ipAmounts.length], `${getIPPurpose(cpIdx)}, ${month} 2026`, 14, opCnt++, uPay); ii++; }
    if (d === 88 || d === 58 || d === 28) addB2B(d, 21, 320, "Аренда офисного помещения по договору №АП-2023/08", 9, opCnt++, uCA);
    if (d === 87 || d === 57 || d === 27) addB2B(d, 20, 48, "Услуги связи по договору №РТ-2026/01", 9, opCnt++, uCA);
    if (d === 86 || d === 56 || d === 26) addB2B(d, 23, 75, "Сопровождение 1С:ERP по договору №ИТС-2026/01", 9, opCnt++, uCA);
    if (d === 85 || d === 55 || d === 25) {
      addB2B(d, 22, 350, "Погашение основного долга по договору займа №ЗМ-2024/05", 10, opCnt++, uCFO);
      addB2B(d, 22, 52 - Math.floor(d / 30), "Уплата процентов по договору займа №ЗМ-2024/05", 10, opCnt++, uCFO);
    }
  }

  const draftSpecs = [
    { dAgo: 0, cpIdx: 9,  amtK: 580,  purpose: "Оплата по договору поставки за модули ВРУ" },
    { dAgo: 0, cpIdx: 8,  amtK: 380,  purpose: "Предоплата 30% за трансформаторы ТМГ-400/10" },
    { dAgo: 0, cpIdx: 15, amtK: 32,   purpose: "Монтажные работы по договору подряда, май 2026" },
    { dAgo: 1, cpIdx: 10, amtK: 250,  purpose: "Оплата по договору поставки за реле защиты" },
    { dAgo: 1, cpIdx: 11, amtK: 110,  purpose: "Оплата по счёту за кабель силовой ВВГ" },
    { dAgo: 2, cpIdx: 9,  amtK: 185,  purpose: "Оплата за УЗО и автоматические выключатели" },
    { dAgo: 2, cpIdx: 13, amtK: 125,  purpose: "Оплата по договору за оборудование НКУ" },
    { dAgo: 3, cpIdx: 12, amtK: 160,  purpose: "Оплата по счёту за кабельные лотки и короба" },
  ];
  for (let k = 0; k < draftSpecs.length; k++) {
    const sp = draftSpecs[k];
    addB2B(sp.dAgo, sp.cpIdx, sp.amtK, sp.purpose, 11 + k % 4, k, uTrs);
  }

  addIncoming(5,  0, 2100, 9);
  addIncoming(15, 2, 1600, 9);
  addIncoming(35, 1, 2500, 9);
  addIncoming(65, 5, 1900, 9);
  addIncoming(80, 3, 1500, 9);

  db.insert(schema.operations).values(ops).run();

  const OPENING_CENTS = 2_000_000_00;
  const netCents = ops.filter(o => o.statusDashboard === "EXECUTED").reduce(
    (s, o) => s + ((o.type === "CASH_IN" || o.type === "QR_SETTLEMENT") ? o.amountCents : -o.amountCents), 0,
  );
  db.insert(schema.wallets).values([
    { id: rid("wlt"), orgId: orgMain.id, externalRef: "DR000000000001", balanceCents: OPENING_CENTS + netCents, blockedCents: 0, status: "ACTIVE", lastSyncAt: minAgo(2), createdAt: daysAgo(400) },
    { id: rid("wlt"), orgId: orgBeta.id, externalRef: "DR000000000045", balanceCents: 890_000_00,              blockedCents: 0, status: "ACTIVE", lastSyncAt: minAgo(15), createdAt: daysAgo(300) },
  ]).run();

  const regPayroll = {
    id: rid("reg"), orgId: orgMain.id, type: "PAYROLL", source: "1C",
    fileName: "zarplata_2026_04.xml", bankId: vtb.id,
    rowsTotal: 64, rowsValid: 62, rowsInvalid: 2, rowsExecuted: 62, rowsRejected: 0,
    totalAmountCents: 5_480_000_00, status: "EXECUTED", approvalPolicy: "DUAL_SIGNATURE",
    createdById: uPay.id, createdAt: daysAgo(5), submittedAt: daysAgo(5) + 2 * 3600_000,
  };
  const regVendor = {
    id: rid("reg"), orgId: orgMain.id, type: "VENDOR", source: "CSV",
    fileName: "suppliers_april.csv", bankId: sber.id,
    rowsTotal: 18, rowsValid: 18, rowsInvalid: 0, rowsExecuted: 0, rowsRejected: 0,
    totalAmountCents: 3_240_000_00, status: "PENDING_APPROVAL", approvalPolicy: "STANDARD",
    createdById: uTrs.id, createdAt: minAgo(40), submittedAt: null,
  };
  const regTax = {
    id: rid("reg"), orgId: orgMain.id, type: "TAX", source: "XLSX",
    fileName: "nalog_Q1_2026.xlsx", bankId: sber.id,
    rowsTotal: 8, rowsValid: 7, rowsInvalid: 1, rowsExecuted: 0, rowsRejected: 0,
    totalAmountCents: 1_850_000_00, status: "VALIDATED", approvalPolicy: "STANDARD",
    createdById: uCA.id, createdAt: minAgo(90), submittedAt: null,
  };
  db.insert(schema.registries).values([regPayroll, regVendor, regTax]).run();

  const items: Array<typeof schema.registryItems.$inferInsert> = [];
  for (let i = 0; i < regPayroll.rowsTotal; i++) {
    const valid = i < regPayroll.rowsValid;
    items.push({ id: rid("ri"), registryId: regPayroll.id, rowNumber: i + 1, recipientInn: null, recipientName: `Сотрудник №${2000 + i}`, recipientDrRef: `DR${String(3000 + i).padStart(12, "0")}`, amountCents: (60 + (i * 7) % 100) * 1_000_00, purpose: "Заработная плата за апрель 2026", status: valid ? "EXECUTED" : "INVALID", errorCode: valid ? null : "INVALID_DR_ACCOUNT", errorMessage: valid ? null : "Не найден ЦР-счёт получателя", operationId: null });
  }
  for (let i = 0; i < regVendor.rowsTotal; i++) {
    const cpObj = counterparties[i % 13];
    items.push({ id: rid("ri"), registryId: regVendor.id, rowNumber: i + 1, recipientInn: cpObj.inn, recipientName: cpObj.name, recipientDrRef: cpObj.drAccountRef, amountCents: (80 + (i * 17) % 300) * 1_000_00, purpose: `Оплата по договору поставки №${200 + i}`, status: "VALID", errorCode: null, errorMessage: null, operationId: null });
  }
  for (let i = 0; i < regTax.rowsTotal; i++) {
    const valid = i < regTax.rowsValid;
    items.push({ id: rid("ri"), registryId: regTax.id, rowNumber: i + 1, recipientInn: "7707030001", recipientName: "ФНС России", recipientDrRef: "DR999000000001", amountCents: (100 + (i * 29) % 200) * 1_000_00, purpose: "Уплата налога Q1 2026, КБК 18210101011011000110", status: valid ? "VALID" : "INVALID", errorCode: valid ? null : "MISSING_KBK", errorMessage: valid ? null : "Не указан КБК", operationId: null });
  }
  db.insert(schema.registryItems).values(items).run();

  const pendingOps = ops.filter(o => o.statusDashboard === "PENDING_APPROVAL");
  const approvals: Array<typeof schema.approvalTasks.$inferInsert> = [
    { id: rid("apr"), orgId: orgMain.id, operationId: null, registryId: regVendor.id, approverRole: "CFO",             approverUserId: uCFO.id, status: "PENDING", reason: null, createdAt: regVendor.createdAt, completedAt: null },
    { id: rid("apr"), orgId: orgMain.id, operationId: null, registryId: regVendor.id, approverRole: "ChiefAccountant", approverUserId: uCA.id,  status: "PENDING", reason: null, createdAt: regVendor.createdAt, completedAt: null },
  ];
  for (const p of pendingOps.slice(0, 5)) {
    approvals.push({ id: rid("apr"), orgId: orgMain.id, operationId: p.id, registryId: null, approverRole: "Approver", approverUserId: uApp.id, status: "PENDING", reason: null, createdAt: p.createdAt, completedAt: null });
  }
  db.insert(schema.approvalTasks).values(approvals).run();

  const allUsers = [uCFO, uTrs, uPay, uApp, uCA, uAdm];
  const auditActions = [
    { action: "auth.login", obj: "session", sev: "INFO" },
    { action: "payment.create", obj: "operation", sev: "INFO" },
    { action: "payment.submit", obj: "operation", sev: "INFO" },
    { action: "payment.approve", obj: "operation", sev: "INFO" },
    { action: "registry.upload", obj: "registry", sev: "INFO" },
    { action: "registry.submit", obj: "registry", sev: "INFO" },
    { action: "access.suspend", obj: "wallet", sev: "CRITICAL" },
    { action: "regtech.export", obj: "export_package", sev: "INFO" },
    { action: "user.role_change", obj: "user", sev: "WARN" },
    { action: "bank.connect", obj: "bank_access", sev: "INFO" },
  ];
  const auditEvents: Array<typeof schema.auditEvents.$inferInsert> = [];
  for (let i = 0; i < 120; i++) {
    const a = auditActions[i % auditActions.length];
    const u = allUsers[i % allUsers.length];
    auditEvents.push({ id: rid("aud"), orgId: orgMain.id, actorId: u.id, actorName: u.name, action: a.action, objectType: a.obj, objectId: nanoid(8), ip: `10.0.${(i * 7) % 200}.${(i * 13) % 250}`, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Orca/1.0", payloadJson: null, severity: a.sev, createdAt: minAgo(i * 15 + (i % 5) * 3) });
  }
  db.insert(schema.auditEvents).values(auditEvents).run();

  db.insert(schema.notifications).values([
    { id: rid("ntf"), orgId: orgMain.id, userId: uCFO.id, type: "approval", severity: "WARN", title: "Реестр поставщикам ждёт согласования",    body: "18 платежей на сумму 3 240 000,00 ₽",      link: `/registries/${regVendor.id}`,  readAt: null,       createdAt: minAgo(15) },
    { id: rid("ntf"), orgId: orgMain.id, userId: uTrs.id, type: "status",   severity: "INFO", title: "Реестр зарплат исполнен",                  body: "62 платежа на 5 480 000,00 ₽ — успешно",  link: `/registries/${regPayroll.id}`, readAt: minAgo(60), createdAt: daysAgo(5) },
    { id: rid("ntf"), orgId: orgMain.id, userId: null,    type: "system",   severity: "WARN", title: 'Канал банка "Альфа" работает с задержкой', body: "Среднее время отклика > 4 сек.",            link: "/integrations",                readAt: null,       createdAt: minAgo(10) },
    { id: rid("ntf"), orgId: orgMain.id, userId: uCA.id,  type: "regtech",  severity: "INFO", title: "Запрос ФНС зарегистрирован",               body: "Запрос №ФНС-2026-04-1841 за период Q1 2026", link: "/audit",                     readAt: null,       createdAt: minAgo(200) },
  ]).run();
}
