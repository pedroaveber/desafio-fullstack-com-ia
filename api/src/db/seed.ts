import { db } from './index'
import { webhooks } from './schema'
import { sql } from 'drizzle-orm'
import { faker } from '@faker-js/faker'

const STRIPE_WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'charge.succeeded',
  'charge.failed',
  'charge.refunded',
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'subscription.created',
  'subscription.updated',
  'subscription.deleted',
  'invoice.created',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'account.updated',
  'balance.available',
  'coupon.created',
  'coupon.updated',
  'coupon.deleted',
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
] as const

const STATUS_CODES = [200, 201, 400, 401, 403, 404, 422, 500, 502, 503] as const

function generateStripeSignature(): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = faker.string.alphanumeric(64)
  const v1 = faker.string.alphanumeric(32)
  return `t=${timestamp},v1=${v1},v0=${signature}`
}

function generateStripeHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
    'content-type': 'application/json',
    'stripe-signature': generateStripeSignature(),
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate',
    'connection': 'keep-alive',
  }

  // Adicionar headers opcionais do Stripe
  if (faker.datatype.boolean({ probability: 0.3 })) {
    headers['x-forwarded-for'] = faker.internet.ip()
  }

  if (faker.datatype.boolean({ probability: 0.2 })) {
    headers['x-real-ip'] = faker.internet.ip()
  }

  return headers
}

function generateStripePathname(): string {
  const pathPatterns = [
    '/webhooks/stripe',
    '/api/webhooks/stripe',
    '/api/v1/webhooks/stripe',
    '/stripe/webhook',
    '/webhook/stripe',
  ]

  return faker.helpers.arrayElement(pathPatterns)
}

function generateStripeEventBody(eventType: string): string {
  const eventId = `evt_${faker.string.alphanumeric(24)}`
  const apiVersion = faker.helpers.arrayElement(['2023-10-16', '2024-06-20', '2024-11-20.acacia'])
  const created = Math.floor(faker.date.recent().getTime() / 1000)
  const livemode = faker.datatype.boolean()
  const pendingWebhooks = faker.number.int({ min: 0, max: 5 })

  // Gerar objeto baseado no tipo de evento
  let dataObject: Record<string, unknown> = {}

  if (eventType.includes('payment_intent')) {
    dataObject = {
      id: `pi_${faker.string.alphanumeric(24)}`,
      object: 'payment_intent',
      amount: faker.number.int({ min: 1000, max: 1000000 }),
      currency: faker.finance.currencyCode().toLowerCase(),
      status: eventType.includes('succeeded')
        ? 'succeeded'
        : eventType.includes('failed')
          ? 'requires_payment_method'
          : 'canceled',
      customer: `cus_${faker.string.alphanumeric(24)}`,
      metadata: {
        order_id: `ORD-${faker.string.alphanumeric(10).toUpperCase()}`,
        user_id: faker.string.uuid(),
      },
      created: created,
    }
  } else if (eventType.includes('charge')) {
    dataObject = {
      id: `ch_${faker.string.alphanumeric(24)}`,
      object: 'charge',
      amount: faker.number.int({ min: 1000, max: 1000000 }),
      currency: faker.finance.currencyCode().toLowerCase(),
      status: eventType.includes('succeeded')
        ? 'succeeded'
        : eventType.includes('failed')
          ? 'failed'
          : 'refunded',
      paid: eventType.includes('succeeded'),
      payment_intent: `pi_${faker.string.alphanumeric(24)}`,
      customer: `cus_${faker.string.alphanumeric(24)}`,
      created: created,
    }
  } else if (eventType.includes('customer')) {
    dataObject = {
      id: `cus_${faker.string.alphanumeric(24)}`,
      object: 'customer',
      email: faker.internet.email(),
      name: faker.person.fullName(),
      created: created,
      metadata: {
        user_id: faker.string.uuid(),
      },
    }
  } else if (eventType.includes('subscription')) {
    dataObject = {
      id: `sub_${faker.string.alphanumeric(24)}`,
      object: 'subscription',
      status: faker.helpers.arrayElement(['active', 'canceled', 'past_due', 'trialing']),
      customer: `cus_${faker.string.alphanumeric(24)}`,
      current_period_start: created,
      current_period_end: created + 2592000, // 30 dias
      items: {
        data: [
          {
            id: `si_${faker.string.alphanumeric(24)}`,
            price: {
              id: `price_${faker.string.alphanumeric(24)}`,
              unit_amount: faker.number.int({ min: 1000, max: 50000 }),
              currency: faker.finance.currencyCode().toLowerCase(),
            },
          },
        ],
      },
      created: created,
    }
  } else if (eventType.includes('invoice')) {
    dataObject = {
      id: `in_${faker.string.alphanumeric(24)}`,
      object: 'invoice',
      amount_due: faker.number.int({ min: 1000, max: 1000000 }),
      amount_paid: eventType.includes('succeeded')
        ? faker.number.int({ min: 1000, max: 1000000 })
        : 0,
      currency: faker.finance.currencyCode().toLowerCase(),
      status: eventType.includes('succeeded')
        ? 'paid'
        : eventType.includes('failed')
          ? 'open'
          : 'draft',
      customer: `cus_${faker.string.alphanumeric(24)}`,
      subscription: `sub_${faker.string.alphanumeric(24)}`,
      created: created,
    }
  } else if (eventType.includes('checkout.session')) {
    dataObject = {
      id: `cs_${faker.string.alphanumeric(24)}`,
      object: 'checkout.session',
      payment_status: eventType.includes('succeeded') ? 'paid' : 'unpaid',
      customer: `cus_${faker.string.alphanumeric(24)}`,
      amount_total: faker.number.int({ min: 1000, max: 1000000 }),
      currency: faker.finance.currencyCode().toLowerCase(),
      created: created,
    }
  } else if (eventType.includes('product')) {
    dataObject = {
      id: `prod_${faker.string.alphanumeric(24)}`,
      object: 'product',
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      active: faker.datatype.boolean(),
      created: created,
    }
  } else if (eventType.includes('price')) {
    dataObject = {
      id: `price_${faker.string.alphanumeric(24)}`,
      object: 'price',
      active: faker.datatype.boolean(),
      currency: faker.finance.currencyCode().toLowerCase(),
      unit_amount: faker.number.int({ min: 1000, max: 1000000 }),
      product: `prod_${faker.string.alphanumeric(24)}`,
      created: created,
    }
  } else {
    // Evento genérico
    dataObject = {
      id: faker.string.alphanumeric(24),
      object: 'generic',
      created: created,
    }
  }

  const eventBody = {
    id: eventId,
    object: 'event',
    api_version: apiVersion,
    created: created,
    data: {
      object: dataObject,
    },
    livemode: livemode,
    pending_webhooks: pendingWebhooks,
    request: {
      id: `req_${faker.string.alphanumeric(24)}`,
      idempotency_key: faker.string.uuid(),
    },
    type: eventType,
  }

  return JSON.stringify(eventBody, null, 2)
}

function generateContentLength(body: string): number {
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

    console.log(`📦 Creating ${recordsToCreate} Stripe webhook records (POST only) in ${batches} batches...`)

    for (let batch = 0; batch < batches; batch++) {
      const batchRecords = []
      const recordsInBatch = Math.min(batchSize, recordsToCreate - batch * batchSize)

      for (let i = 0; i < recordsInBatch; i++) {
        const eventType = faker.helpers.arrayElement(STRIPE_WEBHOOK_EVENTS)
        const body = generateStripeEventBody(eventType)
        const contentLength = generateContentLength(body)
        const headers = generateStripeHeaders()

        const record = {
          method: 'POST',
          pathname: generateStripePathname(),
          ip: faker.internet.ip(),
          statusCode: faker.helpers.arrayElement(STATUS_CODES),
          contentType: 'application/json',
          contentLength,
          queryParams: undefined,
          headers,
          body,
        }

        batchRecords.push(record)
      }

      await db.insert(webhooks).values(batchRecords)
      console.log(
        `✅ Batch ${batch + 1}/${batches} created (${recordsInBatch} records)`,
      )
    }

    console.log(`🎉 Successfully created ${recordsToCreate} Stripe webhook records!`)

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
