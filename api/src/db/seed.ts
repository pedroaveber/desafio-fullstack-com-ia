import { db } from './index'
import { webhooks } from './schema'
import { sql } from 'drizzle-orm'
import { faker } from '@faker-js/faker'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

const STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 422, 500, 502, 503] as const

const CONTENT_TYPES = [
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html',
  'application/javascript',
  'image/png',
  'image/jpeg',
] as const

function generateHeaders(method: string, contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'user-agent': faker.internet.userAgent(),
    'accept': faker.helpers.arrayElement([
      'application/json',
      '*/*',
      'application/json, text/plain, */*',
      'text/html, application/xhtml+xml',
    ]),
    'accept-language': faker.helpers.arrayElement([
      'en-US,en;q=0.9',
      'pt-BR,pt;q=0.9',
      'es-ES,es;q=0.9',
      'fr-FR,fr;q=0.9',
      'de-DE,de;q=0.9',
    ]),
    'accept-encoding': 'gzip, deflate, br',
    'connection': 'keep-alive',
  }

  if (contentType) {
    headers['content-type'] = contentType
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    headers['content-length'] = String(faker.number.int({ min: 100, max: 5000 }))
  }

  // Adicionar headers aleatórios extras
  if (faker.datatype.boolean()) {
    headers['authorization'] = faker.helpers.arrayElement([
      `Bearer ${faker.string.alphanumeric(50)}`,
      `Basic ${faker.string.alphanumeric(200)}`,
      `Token ${faker.string.uuid()}`,
    ])
  }

  if (faker.datatype.boolean({ probability: 0.3 })) {
    headers['x-api-key'] = `sk_live_${faker.string.alphanumeric(32)}`
  }

  if (faker.datatype.boolean({ probability: 0.4 })) {
    headers['x-request-id'] = faker.string.uuid()
  }

  if (faker.datatype.boolean({ probability: 0.3 })) {
    headers['x-forwarded-for'] = faker.internet.ip()
  }

  if (faker.datatype.boolean({ probability: 0.2 })) {
    headers['referer'] = faker.internet.url()
  }

  return headers
}

function generateQueryParams(): Record<string, string> | undefined {
  if (faker.datatype.boolean({ probability: 0.4 })) {
    return undefined
  }

  const params: Record<string, string> = {}
  const paramCount = faker.number.int({ min: 1, max: 4 })

  for (let i = 0; i < paramCount; i++) {
    const key = faker.helpers.arrayElement([
      'page',
      'limit',
      'sort',
      'filter',
      'search',
      'status',
      'type',
      'category',
      'q',
      'order',
    ])
    const value = faker.helpers.arrayElement([
      String(faker.number.int({ min: 1, max: 100 })),
      faker.helpers.arrayElement(['asc', 'desc', 'active', 'pending', 'completed']),
      faker.lorem.word(),
    ])
    params[key] = value
  }

  return params
}

function generatePathname(): string {
  const pathPatterns = [
    `/api/${faker.helpers.arrayElement(['users', 'products', 'orders', 'payments', 'invoices'])}`,
    `/api/${faker.helpers.arrayElement(['users', 'products', 'orders'])}/${faker.string.uuid()}`,
    `/api/${faker.helpers.arrayElement(['auth', 'webhooks', 'notifications'])}/${faker.lorem.word()}`,
    `/api/webhooks/${faker.helpers.arrayElement(['stripe', 'paypal', 'github', 'slack', 'discord'])}`,
    `/api/${faker.lorem.word()}/${faker.string.uuid()}/${faker.lorem.word()}`,
  ]

  return faker.helpers.arrayElement(pathPatterns)
}

function generateBody(method: string, contentType?: string): string | null {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || !contentType) {
    return null
  }

  if (contentType === 'application/json') {
    const bodyTypes = [
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 18, max: 80 }),
      },
      {
        productId: faker.string.uuid(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        price: faker.commerce.price(),
      },
      {
        orderId: `ORD-${faker.string.alphanumeric(10).toUpperCase()}`,
        status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
        total: faker.commerce.price(),
      },
      {
        userId: faker.string.uuid(),
        action: faker.helpers.arrayElement(['login', 'logout', 'register', 'update']),
        timestamp: faker.date.recent().toISOString(),
      },
      {
        event: faker.helpers.arrayElement([
          'payment.received',
          'payment.failed',
          'order.created',
          'user.updated',
        ]),
        amount: faker.commerce.price(),
        currency: faker.finance.currencyCode(),
      },
      {
        message: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['notification', 'alert', 'info']),
      },
      {
        data: {
          nested: {
            value: faker.lorem.word(),
            count: faker.number.int({ min: 1, max: 100 }),
          },
        },
      },
      {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        tags: faker.helpers.arrayElements(['tag1', 'tag2', 'tag3'], { min: 1, max: 3 }),
      },
    ]
    return JSON.stringify(faker.helpers.arrayElement(bodyTypes))
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    return `name=${encodeURIComponent(faker.person.fullName())}&email=${encodeURIComponent(faker.internet.email())}&age=${faker.number.int({ min: 18, max: 80 })}`
  }

  if (contentType === 'text/plain') {
    return faker.lorem.paragraph()
  }

  if (contentType === 'text/html') {
    return `<html><body><h1>${faker.lorem.sentence()}</h1><p>${faker.lorem.paragraph()}</p></body></html>`
  }

  if (contentType === 'application/xml') {
    return `<?xml version="1.0"?><root><item>${faker.lorem.word()}</item><value>${faker.number.int({ min: 1, max: 100 })}</value></root>`
  }

  return null
}

function generateContentLength(body: string | null): number | null {
  if (!body) {
    return null
  }
  return body.length
}

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Deletar todos os registros existentes
    console.log('🗑️  Deleting existing records...')
    await db.delete(webhooks)
    console.log('✅ All existing records deleted')

    // Gerar 200 registros
    const recordsToCreate = 200
    const batchSize = 50
    const batches = Math.ceil(recordsToCreate / batchSize)

    console.log(`📦 Creating ${recordsToCreate} records in ${batches} batches...`)

    for (let batch = 0; batch < batches; batch++) {
      const batchRecords = []
      const recordsInBatch = Math.min(batchSize, recordsToCreate - batch * batchSize)

      for (let i = 0; i < recordsInBatch; i++) {
        const method = faker.helpers.arrayElement(HTTP_METHODS)
        const contentType =
          method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
            ? undefined
            : faker.helpers.arrayElement(CONTENT_TYPES)
        const body = generateBody(method, contentType)
        const contentLength = generateContentLength(body)

        const record = {
          method,
          pathname: generatePathname(),
          ip: faker.internet.ip(),
          statusCode: faker.helpers.arrayElement(STATUS_CODES),
          contentType,
          contentLength,
          queryParams: generateQueryParams(),
          headers: generateHeaders(method, contentType),
          body,
        }

        batchRecords.push(record)
      }

      await db.insert(webhooks).values(batchRecords)
      console.log(
        `✅ Batch ${batch + 1}/${batches} created (${recordsInBatch} records)`,
      )
    }

    console.log(`🎉 Successfully created ${recordsToCreate} webhook records!`)

    // Verificar contagem final
    const count = await db.select({ count: sql<number>`count(*)` }).from(webhooks)
    console.log(`📊 Total records in database: ${count[0].count}`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

seed()
