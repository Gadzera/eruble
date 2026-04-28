"use client";
import { useState } from "react";
import { Download, FileCode2, RefreshCw, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ApiKeysSheet } from "@/components/app/api-keys-sheet";

const OPENAPI_YAML = `openapi: "3.1.0"
info:
  title: CBDC НПК ТС API
  version: "1.0.0"
  description: >
    REST API для работы с цифровыми рублями через платформу Банка России.
    Авторизация — Bearer-токен (OAuth 2.0 client_credentials).
    Версия Альбома CBR: 2026.07.
  contact:
    name: НПК Технопром-Сервис
    email: info@tp-s.ru

servers:
  - url: https://api.tp-s.ru/v1
    description: Production
  - url: https://sandbox.tp-s.ru/v1
    description: Sandbox

security:
  - BearerAuth: []

paths:

  /orgs/{orgId}/operations:
    get:
      operationId: listOperations
      summary: Список операций
      tags: [Операции]
      parameters:
        - { name: orgId,   in: path,  required: true,  schema: { type: string } }
        - { name: limit,   in: query, schema: { type: integer, default: 50, maximum: 200 } }
        - { name: offset,  in: query, schema: { type: integer, default: 0 } }
        - { name: type,    in: query, schema: { type: string, enum: [B2B_TRANSFER, CASH_IN, CASH_OUT] } }
        - { name: status,  in: query, schema: { type: string } }
        - { name: from,    in: query, schema: { type: string, format: date-time } }
        - { name: to,      in: query, schema: { type: string, format: date-time } }
      responses:
        "200": { description: Список операций }
        "401": { description: Не авторизован }
        "403": { description: Нет доступа }
    post:
      operationId: createOperation
      summary: Создать B2B-перевод
      tags: [Операции]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateOperation' }
            example:
              recipientInn: "7707083893"
              recipientName: 'ООО "Торговый Дом"'
              recipientDrRef: DR000000000107
              amountCents: 12500050
              purpose: Оплата по договору №15 от 10.04.2026
              bankAccessId: acc_vtb
              vatRate: RATE_20
              idempotencyKey: 550e8400-e29b-41d4-a716-446655440000
      responses:
        "201": { description: Операция создана }
        "422": { description: Ошибка валидации }
        "409": { description: Дубликат (idempotency key уже использован) }

  /orgs/{orgId}/operations/{id}:
    get:
      operationId: getOperation
      summary: Получить операцию по ID
      tags: [Операции]
      responses:
        "200": { description: Операция }
        "404": { description: Не найдено }

  /orgs/{orgId}/balance:
    get:
      operationId: getBalance
      summary: Остаток ЦР-счёта
      tags: [Баланс]
      responses:
        "200":
          description: Актуальный баланс
          content:
            application/json:
              schema:
                type: object
                properties:
                  balanceCents:  { type: integer, example: 2500000000 }
                  currency:      { type: string,  example: RUB }
                  drAccountRef:  { type: string,  example: DR000000000001 }
                  asOf:          { type: string,  format: date-time }

  /orgs/{orgId}/counterparties:
    get:
      operationId: listCounterparties
      summary: Справочник контрагентов
      tags: [Контрагенты]
      responses:
        "200": { description: Список контрагентов }
    post:
      operationId: createCounterparty
      summary: Добавить контрагента
      tags: [Контрагенты]
      responses:
        "201": { description: Создан }

  /orgs/{orgId}/registries:
    get:
      operationId: listRegistries
      summary: Реестры переводов
      tags: [Реестры]
      responses:
        "200": { description: Список реестров }
    post:
      operationId: createRegistry
      summary: Создать реестр переводов
      tags: [Реестры]
      responses:
        "201": { description: Реестр создан }

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer

  schemas:
    CreateOperation:
      type: object
      required: [recipientInn, recipientDrRef, amountCents, purpose, bankAccessId]
      properties:
        recipientInn:
          type: string
          description: ИНН получателя (10 или 12 цифр)
          example: "7707083893"
        recipientName:
          type: string
          example: 'ООО "Торговый Дом"'
        recipientDrRef:
          type: string
          description: Номер ЦР-счёта получателя (DR + 12 цифр)
          example: DR000000000107
        amountCents:
          type: integer
          description: Сумма в копейках
          minimum: 1
          example: 12500050
        purpose:
          type: string
          description: Назначение платежа
          maxLength: 500
          example: Оплата по договору №15 от 10.04.2026
        bankAccessId:
          type: string
          description: Идентификатор канала банка-участника
          example: acc_vtb
        vatRate:
          type: string
          enum: [RATE_22, RATE_20, RATE_10, RATE_0, NONE, MANUAL]
          default: NONE
        vatAmountCents:
          type: integer
          description: Сумма НДС в копейках (только для vatRate=MANUAL)
        idempotencyKey:
          type: string
          description: UUID для идемпотентного создания
          format: uuid`;

function buildPostman(orgId: string): string {
  return JSON.stringify({
    info: {
      name: "CBDC НПК ТС API",
      description: "REST API для работы с цифровыми рублями. Альбом CBR 2026.07.",
      version: { raw: "1.0.0" },
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{api_key}}", type: "string" }],
    },
    variable: [
      { key: "base_url", value: "https://api.tp-s.ru/v1" },
      { key: "org_id",   value: orgId },
      { key: "api_key",  value: "" },
    ],
    item: [
      {
        name: "Операции",
        item: [
          {
            name: "Список операций",
            request: {
              method: "GET",
              url: { raw: "{{base_url}}/orgs/{{org_id}}/operations?limit=50&offset=0" },
            },
          },
          {
            name: "Создать B2B-перевод",
            request: {
              method: "POST",
              url: { raw: "{{base_url}}/orgs/{{org_id}}/operations" },
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  recipientInn: "7707083893",
                  recipientName: "ООО \"Торговый Дом\"",
                  recipientDrRef: "DR000000000107",
                  amountCents: 12500050,
                  purpose: "Оплата по договору №15 от 10.04.2026",
                  bankAccessId: "acc_vtb",
                  vatRate: "RATE_20",
                  idempotencyKey: "{{$guid}}",
                }, null, 2),
              },
            },
          },
          {
            name: "Получить операцию по ID",
            request: {
              method: "GET",
              url: { raw: "{{base_url}}/orgs/{{org_id}}/operations/:id", variable: [{ key: "id", value: "" }] },
            },
          },
        ],
      },
      {
        name: "Баланс и счёт",
        item: [
          {
            name: "Остаток ЦР-счёта",
            request: { method: "GET", url: { raw: "{{base_url}}/orgs/{{org_id}}/balance" } },
          },
        ],
      },
      {
        name: "Контрагенты",
        item: [
          {
            name: "Список контрагентов",
            request: { method: "GET", url: { raw: "{{base_url}}/orgs/{{org_id}}/counterparties" } },
          },
          {
            name: "Добавить контрагента",
            request: {
              method: "POST",
              url: { raw: "{{base_url}}/orgs/{{org_id}}/counterparties" },
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({ inn: "7707083893", name: "ООО \"Торговый Дом\"", drAccountRef: "DR000000000107" }, null, 2),
              },
            },
          },
        ],
      },
      {
        name: "Реестры",
        item: [
          {
            name: "Список реестров",
            request: { method: "GET", url: { raw: "{{base_url}}/orgs/{{org_id}}/registries" } },
          },
        ],
      },
    ],
  }, null, 2);
}

export function ApiCard({ orgId }: { orgId: string }) {
  const [openApiOpen, setOpenApiOpen] = useState(false);
  const [postmanOpen, setPostmanOpen] = useState(false);
  const [keysOpen,    setKeysOpen]    = useState(false);
  const [copied,      setCopied]      = useState<"openapi" | "postman" | null>(null);

  const postmanJson = buildPostman(orgId);

  function copy(text: string, type: "openapi" | "postman") {
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadPostman() {
    const blob = new Blob([postmanJson], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "cbdc-npc-ts-api.postman_collection.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API-доступ</CardTitle>
          <CardDescription>
            REST API для прямой интеграции с внешними системами. Авторизация через OAuth 2.0.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted p-3 text-sm font-mono">
            https://api.tp-s.ru/v1/orgs/{orgId}/operations
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setOpenApiOpen(true)}>
              <Download  className="h-4 w-4" /> OpenAPI 3.1
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPostmanOpen(true)}>
              <FileCode2 className="h-4 w-4" /> Postman Collection
            </Button>
            <Button variant="outline" size="sm" onClick={() => setKeysOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Ротация ключей
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OpenAPI Sheet */}
      <Sheet open={openApiOpen} onOpenChange={setOpenApiOpen}>
        <SheetContent className="w-[680px] sm:max-w-[680px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <SheetTitle className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" /> OpenAPI 3.1 Спецификация
                </SheetTitle>
                <SheetDescription>CBDC НПК ТС API · v1.0.0 · Альбом CBR 2026.07</SheetDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">YAML</Badge>
                <Button variant="outline" size="sm" onClick={() => copy(OPENAPI_YAML, "openapi")}>
                  {copied === "openapi"
                    ? <><Check className="h-3.5 w-3.5 text-success" /> Скопировано</>
                    : <><Copy className="h-3.5 w-3.5" /> Скопировать</>}
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-[11px] leading-relaxed p-6 font-mono whitespace-pre overflow-x-auto">
              {OPENAPI_YAML}
            </pre>
          </div>
        </SheetContent>
      </Sheet>

      {/* Postman Sheet */}
      <Sheet open={postmanOpen} onOpenChange={setPostmanOpen}>
        <SheetContent className="w-[680px] sm:max-w-[680px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <SheetTitle className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" /> Postman Collection
                </SheetTitle>
                <SheetDescription>v2.1.0 · Готов к импорту в Postman / Insomnia</SheetDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => copy(postmanJson, "postman")}>
                  {copied === "postman"
                    ? <><Check className="h-3.5 w-3.5 text-success" /> Скопировано</>
                    : <><Copy className="h-3.5 w-3.5" /> Скопировать</>}
                </Button>
                <Button size="sm" onClick={downloadPostman}>
                  <Download className="h-3.5 w-3.5" /> Скачать JSON
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="px-6 py-3 border-b bg-muted/40 shrink-0">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Для начала работы:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-muted-foreground">
              <li>Импортируйте JSON в Postman (File → Import)</li>
              <li>В переменных среды задайте <code className="bg-muted px-1 rounded font-mono">api_key</code> = ваш Bearer-токен</li>
              <li><code className="bg-muted px-1 rounded font-mono">org_id</code> уже задан: <code className="bg-muted px-1 rounded font-mono">{orgId}</code></li>
            </ol>
          </div>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-[11px] leading-relaxed p-6 font-mono whitespace-pre overflow-x-auto">
              {postmanJson}
            </pre>
          </div>
        </SheetContent>
      </Sheet>

      {/* API Keys */}
      <ApiKeysSheet open={keysOpen} onClose={() => setKeysOpen(false)} />
    </>
  );
}
