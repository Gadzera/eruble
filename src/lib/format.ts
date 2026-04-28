const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rubWhole = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

const dt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const d = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const t = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatRub = (v: number) => rub.format(v);
export const formatRubWhole = (v: number) => rubWhole.format(v);
export const formatNum = (v: number) => num.format(v);
export const formatDateTime = (v: Date | string | number) =>
  dt.format(typeof v === "object" ? v : new Date(v));
export const formatDate = (v: Date | string | number) =>
  d.format(typeof v === "object" ? v : new Date(v));
export const formatTime = (v: Date | string | number) =>
  t.format(typeof v === "object" ? v : new Date(v));

const SHORT = ["", "тыс", "млн", "млрд", "трлн"];
export function formatShort(v: number, currency = false) {
  const sign = v < 0 ? "-" : "";
  let n = Math.abs(v);
  let i = 0;
  while (n >= 1000 && i < SHORT.length - 1) {
    n /= 1000;
    i++;
  }
  const fixed = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n).toString();
  return `${sign}${fixed}${SHORT[i] ? " " + SHORT[i] : ""}${currency ? " ₽" : ""}`;
}

export function formatInn(inn: string) {
  return inn;
}

export function relativeTime(v: Date | string | number) {
  const now = Date.now();
  const then = typeof v === "object" ? v.getTime() : new Date(v).getTime();
  const diff = (now - then) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
  return formatDate(v);
}
