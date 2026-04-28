import { NextResponse } from "next/server";

export const DEMO_USERS = [
  { id: "usr_cfo", name: "Гадзера А.Н.",  role: "CFO" },
  { id: "usr_trs", name: "Орлова Е.В.",   role: "Treasurer" },
  { id: "usr_pay", name: "Никитин П.М.",  role: "Payroll" },
  { id: "usr_app", name: "Сорокина О.И.", role: "Approver" },
  { id: "usr_ca",  name: "Борисова М.Д.", role: "ChiefAccountant" },
  { id: "usr_adm", name: "Администратор", role: "Admin" },
];

export async function GET() {
  return NextResponse.json(DEMO_USERS);
}
