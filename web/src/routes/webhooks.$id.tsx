import { createFileRoute } from '@tanstack/react-router'
import { SectionDataTable } from '../components/section-data-table'
import { SectionTitle } from '../components/section-title'
import { CodeBlock } from '../components/ui/code-block'
import { WebhookDetailHeader } from '../components/webhook-detail-header'
import { useSuspenseQuery } from '@tanstack/react-query'
import { webhookDetailsSchema } from '../http/schemas/webhooks'

export const Route = createFileRoute('/webhooks/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  const { data } = useSuspenseQuery({
    queryKey: ['webhook', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3333/api/webhooks/${id}`)
      const data = await response.json()
      return webhookDetailsSchema.parse(data)
    },
  })

  const overviewData = [
    {
      key: 'Method',
      value: data.method,
    },
    {
      key: 'Status Code',
      value: data.statusCode.toString(),
    },
    {
      key: 'Content Type',
      value: data.contentType || 'application/json',
    },
    {
      key: 'Content Length',
      value: `${data.contentLength} bytes`,
    },
  ]

  const queryParams = data.queryParams
    ? Object.entries(data.queryParams).map(([key, value]) => ({
        key,
        value,
      }))
    : null

  const headers = Object.entries(data.headers).map(([key, value]) => ({
    key,
    value,
  }))

  return (
    <div className="flex h-full flex-col">
      <WebhookDetailHeader
        method={data.method}
        pathname={data.pathname}
        ip={data.ip}
        createdAt={data.createdAt}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <SectionTitle>Request Overview</SectionTitle>
            <SectionDataTable data={overviewData} />
          </div>

          {queryParams && (
            <div className="space-y-4">
              <SectionTitle>Query Parameters</SectionTitle>
              <SectionDataTable data={queryParams} />
            </div>
          )}

          <div className="space-y-4">
            <SectionTitle>Headers</SectionTitle>
            <SectionDataTable data={headers} />
          </div>

          {data.body && (
            <div className="space-y-4">
              <SectionTitle>Body</SectionTitle>
              <CodeBlock code={data.body} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
