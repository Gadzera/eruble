// Mapping of status codes to Russian labels and visual variants.
// Используется для бейджей в таблицах и карточках операций.

export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "muted" | "outline";

export const dashboardStatusLabel: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING_APPROVAL: "На согласовании",
  SUBMITTED: "Отправлено",
  EXECUTED: "Исполнено",
  REJECTED: "Отказ",
  CANCELED: "Отменено",
};

export const dashboardStatusVariant: Record<string, BadgeVariant> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  SUBMITTED: "info",
  EXECUTED: "success",
  REJECTED: "destructive",
  CANCELED: "secondary",
};

export const bankStatusLabel: Record<string, string> = {
  PENDING: "Ожидает",
  ACCEPTED_BY_BANK: "Принято банком",
  REJECTED_BY_BANK: "Отказано банком",
};

export const bankStatusVariant: Record<string, BadgeVariant> = {
  PENDING: "muted",
  ACCEPTED_BY_BANK: "info",
  REJECTED_BY_BANK: "destructive",
};

export const platformStatusLabel: Record<string, string> = {
  PENDING: "В очереди",
  ACCEPTED_BY_PLATFORM: "Принято платформой",
  IN_PROCESS: "В обработке",
  EXECUTED: "Исполнено",
  REJECTED: "Отказ",
};

export const platformStatusVariant: Record<string, BadgeVariant> = {
  PENDING: "muted",
  ACCEPTED_BY_PLATFORM: "info",
  IN_PROCESS: "info",
  EXECUTED: "success",
  REJECTED: "destructive",
};

export const erpStatusLabel: Record<string, string> = {
  NOT_POSTED: "Не проведено",
  POSTED: "Проведено",
  RECONCILED: "Сверено",
  MISMATCH: "Расхождение",
};

export const erpStatusVariant: Record<string, BadgeVariant> = {
  NOT_POSTED: "muted",
  POSTED: "info",
  RECONCILED: "success",
  MISMATCH: "destructive",
};

export const operationTypeLabel: Record<string, string> = {
  B2B_TRANSFER: "B2B-перевод",
  CASH_IN: "Пополнение ЦР",
  CASH_OUT: "Вывод с ЦР",
  REGISTRY_ITEM: "Из реестра",
  QR_SETTLEMENT: "Входящий перевод",
};

export const registryTypeLabel: Record<string, string> = {
  PAYROLL: "Зарплата",
  VENDOR: "Поставщикам",
  TAX: "Налоги",
  DIVIDEND: "Дивиденды",
};

export const registryStatusLabel: Record<string, string> = {
  VALIDATING: "Валидация",
  VALIDATED: "Валидирован",
  PENDING_APPROVAL: "На согласовании",
  SUBMITTED: "Отправлен",
  EXECUTED: "Исполнен",
  FAILED: "Ошибки",
};

export const registryStatusVariant: Record<string, BadgeVariant> = {
  VALIDATING: "muted",
  VALIDATED: "info",
  PENDING_APPROVAL: "warning",
  SUBMITTED: "info",
  EXECUTED: "success",
  FAILED: "destructive",
};

export const bankAdapterStatusLabel: Record<string, string> = {
  ACTIVE: "Активен",
  DEGRADED: "Замедлен",
  DOWN: "Недоступен",
};

export const bankAdapterStatusVariant: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  DEGRADED: "warning",
  DOWN: "destructive",
};

export const counterpartyStatusLabel: Record<string, string> = {
  ACTIVE: "Активен",
  BLOCKED: "Заблокирован",
  ARCHIVED: "В архиве",
};

export const counterpartyStatusVariant: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  BLOCKED: "destructive",
  ARCHIVED: "muted",
};

export const roleLabel: Record<string, string> = {
  Viewer: "Наблюдатель",
  Creator: "Создатель",
  Payroll: "Кадровый оператор",
  Treasurer: "Казначей",
  Approver: "Согласующий",
  Signer: "Подписант",
  ChiefAccountant: "Главный бухгалтер",
  CFO: "Генеральный директор",
  Compliance: "Комплаенс-офицер",
  Security: "Офицер безопасности",
  Admin: "Администратор",
};
